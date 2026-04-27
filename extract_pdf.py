#!/usr/bin/env python3
"""
PDF data extractor — extracts text and images from each page into separate folders.
Each folder is named after the page title (first line of text).

Usage:
    python3 extract_pdf.py <path-to-pdf> [output-dir]

Requires PyMuPDF:
    pip install pymupdf
"""

import sys
import re
import json
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf"])
    import fitz


def sanitize_folder_name(name: str) -> str:
    """Remove characters that are invalid in folder names."""
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name)
    name = name.strip(". ")
    return name or "untitled"


def parse_key_value_text(text: str) -> dict:
    """
    Parse structured text like:
        opdracht : Stabiliteitsstudie
        architect : OYO architects
    into a dict. Lines without ' : ' are collected as 'notes'.
    """
    data = {}
    notes = []
    lines = text.splitlines()

    # First non-empty line is the title, second (if short) is the subtitle
    non_empty = [l.strip() for l in lines if l.strip()]
    if non_empty:
        data["title"] = non_empty[0]
    if len(non_empty) > 1 and " : " not in non_empty[1]:
        data["subtitle"] = non_empty[1]
        start = 2
    else:
        start = 1

    for line in non_empty[start:]:
        if " : " in line:
            key, _, value = line.partition(" : ")
            data[key.strip()] = value.strip()
        else:
            notes.append(line.strip())

    if notes:
        data["notes"] = " ".join(notes)

    return data


def _collect_image_items(page):
    """(rect, pixel_w, pixel_h, xref) for each unique image reference on the page."""
    items, seen = [], set()
    for img in page.get_images(full=True):
        xref, _, pw, ph = img[0], img[1], img[2], img[3]
        if xref in seen:
            continue
        seen.add(xref)
        try:
            for r in page.get_image_rects(xref):
                if r.width > 5 and r.height > 1:
                    items.append((fitz.Rect(r), pw, ph, xref))
        except Exception:
            pass
    return items


def _cluster_strips(items, gap: float = 15.0):
    """Merge thin horizontal strip tiles sharing the same x-range and pixel width."""
    groups = {}
    for r, pw, ph, xref in items:
        key = (round(r.x0 / 3), round(r.x1 / 3), pw)
        groups.setdefault(key, []).append(r)
    clusters = []
    for rects in groups.values():
        rects = sorted(rects, key=lambda r: r.y0)
        cur = fitz.Rect(rects[0])
        for r in rects[1:]:
            if r.y0 - cur.y1 <= gap:
                cur = fitz.Rect(min(cur.x0, r.x0), min(cur.y0, r.y0),
                                max(cur.x1, r.x1), max(cur.y1, r.y1))
            else:
                clusters.append(cur)
                cur = fitz.Rect(r)
        clusters.append(cur)
    return clusters


def _cluster_column_tiles(items, tol: float = 5.0, gap: float = 3.0):
    """Merge tiles in the same x-column with the same pixel width into one rect."""
    groups = {}
    for r, pw, ph, xref in items:
        key = (round(r.x0 / tol), round(r.x1 / tol), pw)
        groups.setdefault(key, []).append(r)
    clusters = []
    for rects in groups.values():
        rects = sorted(rects, key=lambda r: r.y0)
        cur = fitz.Rect(rects[0])
        for r in rects[1:]:
            if r.y0 - cur.y1 <= gap:
                cur = fitz.Rect(min(cur.x0, r.x0), min(cur.y0, r.y0),
                                max(cur.x1, r.x1), max(cur.y1, r.y1))
            else:
                clusters.append(cur)
                cur = fitz.Rect(r)
        clusters.append(cur)
    return clusters


def _pixel_boundary_diff(doc, xref_a: int, xref_b: int, n_rows: int = 8) -> float:
    """
    Mean absolute RGB difference between the bottom n_rows of image xref_a
    and the top n_rows of image xref_b.  Low = same photo; high = different photo.
    Returns 0.0 on any error so the caller defaults to merging.
    """
    try:
        from io import BytesIO
        from PIL import Image
        raw_a = doc.extract_image(xref_a)["image"]
        raw_b = doc.extract_image(xref_b)["image"]
        img_a = Image.open(BytesIO(raw_a)).convert("RGB")
        img_b = Image.open(BytesIO(raw_b)).convert("RGB")
        sw = min(img_a.width, img_b.width, 300)
        crop_a = img_a.crop((0, max(0, img_a.height - n_rows), img_a.width, img_a.height))
        crop_a = crop_a.resize((sw, n_rows))
        crop_b = img_b.crop((0, 0, img_b.width, min(n_rows, img_b.height)))
        crop_b = crop_b.resize((sw, n_rows))
        px_a = [crop_a.getpixel((x, y)) for y in range(n_rows) for x in range(sw)]
        px_b = [crop_b.getpixel((x, y)) for y in range(n_rows) for x in range(sw)]
        total = sum(sum(abs(int(ca) - int(cb)) for ca, cb in zip(pa, pb))
                    for pa, pb in zip(px_a, px_b))
        return total / (3 * max(len(px_a), 1))
    except Exception:
        return 0.0


def _merge_fullwidth_tiles(items, doc, threshold: float = 15.0, gap: float = 3.0):
    """
    Merge full-width stacked tiles into photo clusters using pixel boundary diff.

    Adjacent tiles with diff <= threshold are part of the same photo (merged).
    A diff > threshold signals a new photo (new cluster).  This threshold of 15
    is deliberately lower than the strip threshold because full-width tiles that
    represent different photos typically have much larger colour differences at
    their seams than intra-photo tile boundaries (which usually score < 12).
    """
    sorted_items = sorted(items, key=lambda x: x[0].y0)
    clusters = []
    cur = fitz.Rect(sorted_items[0][0])
    prev_xref = sorted_items[0][3]
    for r, pw, ph, xref in sorted_items[1:]:
        if r.y0 - cur.y1 <= gap:
            diff = _pixel_boundary_diff(doc, prev_xref, xref) if doc else 0.0
            if diff <= threshold:
                cur = fitz.Rect(min(cur.x0, r.x0), min(cur.y0, r.y0),
                                max(cur.x1, r.x1), max(cur.y1, r.y1))
                prev_xref = xref
            else:
                clusters.append(cur)
                cur = fitz.Rect(r)
                prev_xref = xref
        else:
            clusters.append(cur)
            cur = fitz.Rect(r)
            prev_xref = xref
    clusters.append(cur)
    return clusters


def _collect_image_clusters(page, doc=None):
    """Return logical photo regions as a list of fitz.Rect."""
    items = _collect_image_items(page)
    if not items:
        return []

    # ── Path 1: strip tiles (very thin images, h/w < 0.1) ────────────────────
    if any(pw > 0 and ph / max(pw, 1) < 0.1 for _, pw, ph, _ in items):
        return [c for c in _cluster_strips(items) if c.width >= 20 and c.height >= 20]

    # ── Path 2: full-width stacked tiles ─────────────────────────────────────
    # All images share the same x-range AND that range covers ≥85 % of page width.
    # Pixel boundary diff (threshold=15) reliably separates photo seams from
    # intra-photo tile joins (intra-photo diffs typically score < 12).
    x0s = [r.x0 for r, *_ in items]
    x1s = [r.x1 for r, *_ in items]
    same_x = (max(x0s) - min(x0s)) < 10 and (max(x1s) - min(x1s)) < 10
    full_w = (max(x1s) - min(x0s)) / max(page.rect.width, 1) > 0.85
    if len(items) >= 2 and same_x and full_w:
        return [c for c in _merge_fullwidth_tiles(items, doc) if c.width >= 20 and c.height >= 20]

    # ── Path 3: column-stacked tiles (different x-columns) ───────────────────
    return [c for c in _cluster_column_tiles(items) if c.width >= 20 and c.height >= 20]


def _has_tiling(page, doc=None) -> bool:
    """Return True if page images need merging/rendering rather than raw extraction."""
    unique = len(set(i[0] for i in page.get_images(full=True)))
    clusters = _collect_image_clusters(page, doc=doc)
    return len(clusters) < unique


def _extract_images_by_rendering(page, folder_path: Path, scale: float = 3.0, doc=None) -> int:
    """Render each photo cluster at high quality and save as PNG."""
    clusters = _collect_image_clusters(page, doc=doc)
    clusters = [c for c in clusters if c.width >= 20 and c.height >= 20]
    mat = fitz.Matrix(scale, scale)
    saved = 0
    for c in clusters:
        try:
            pix = page.get_pixmap(matrix=mat, clip=c)
            (folder_path / f"image_{saved + 1}.png").write_bytes(pix.tobytes("png"))
            saved += 1
        except Exception as e:
            print(f"    Warning: could not render image cluster: {e}")
    return saved


def _extract_images_raw(doc, page, folder_path: Path) -> int:
    """Extract original image bytes (JPEG/PNG) for pages with no tile merging needed."""
    saved, seen = 0, set()
    for idx, img_info in enumerate(page.get_images(full=True)):
        xref = img_info[0]
        if xref in seen:
            continue
        seen.add(xref)
        try:
            raw = doc.extract_image(xref)
            data = raw["image"]
            if len(data) < 2048:
                continue
            (folder_path / f"image_{saved + 1}.{raw['ext']}").write_bytes(data)
            saved += 1
        except Exception as e:
            print(f"    Warning: could not extract image {idx + 1}: {e}")
    return saved


def extract_pdf(pdf_path: str, output_dir: str, skip_pages: int = 1) -> None:
    pdf_path = Path(pdf_path)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(str(pdf_path))
    total = len(doc)
    print(f"PDF has {total} pages. Skipping first {skip_pages} page(s).")

    for page_num in range(skip_pages, total):
        page = doc[page_num]

        # ── Extract text ──────────────────────────────────────────────────────
        full_text = page.get_text("text").strip()
        if not full_text:
            print(f"  Page {page_num + 1}: no text found, skipping.")
            continue

        # Title = first non-empty line
        first_line = next(
            (l.strip() for l in full_text.splitlines() if l.strip()), f"page_{page_num + 1}"
        )
        folder_name = sanitize_folder_name(first_line)

        # Avoid collisions: append page number if folder already exists
        folder_path = output_path / folder_name
        if folder_path.exists():
            folder_path = output_path / f"{folder_name}_p{page_num + 1}"
        folder_path.mkdir(parents=True, exist_ok=True)

        # Save raw text
        (folder_path / "text.txt").write_text(full_text, encoding="utf-8")

        # Save parsed JSON
        parsed = parse_key_value_text(full_text)
        (folder_path / "data.json").write_text(
            json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        # ── Extract images ────────────────────────────────────────────────────
        if _has_tiling(page, doc):
            saved_images = _extract_images_by_rendering(page, folder_path, doc=doc)
            method = "rendered"
        else:
            saved_images = _extract_images_raw(doc, page, folder_path)
            method = "raw"

        print(
            f"  Page {page_num + 1:>3}: '{first_line}' "
            f"→ {saved_images} image(s) [{method}]  [{folder_path.name}/]"
        )

    doc.close()
    print(f"\nDone. Output saved to: {output_path.resolve()}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    pdf = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else Path(pdf).stem + "_extracted"
    skip = int(sys.argv[3]) if len(sys.argv) > 3 else 1  # default: skip cover page

    extract_pdf(pdf, out, skip_pages=skip)
