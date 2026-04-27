#!/usr/bin/env python3
"""
Extract the 256 hex colors from Gerhard Richter's '256 Colors' painting.
Usage: python extract_richter_colors.py <image_path>
"""

import sys
from PIL import Image
import numpy as np

def find_grid_bounds(img_array):
    """Find the inner grid area by trimming the white outer border."""
    # Convert to grayscale to find white border
    gray = np.mean(img_array, axis=2)
    h, w = gray.shape

    # Find rows/cols that are NOT mostly white (threshold 230)
    threshold = 230

    row_means = gray.mean(axis=1)
    col_means = gray.mean(axis=0)

    non_white_rows = np.where(row_means < threshold)[0]
    non_white_cols = np.where(col_means < threshold)[0]

    if len(non_white_rows) == 0 or len(non_white_cols) == 0:
        # Fallback: use full image with small margin
        margin = int(min(h, w) * 0.03)
        return margin, margin, h - margin, w - margin

    top = non_white_rows[0]
    bottom = non_white_rows[-1] + 1
    left = non_white_cols[0]
    right = non_white_cols[-1] + 1

    return top, left, bottom, right


def sample_grid_colors(image_path, cols=16, rows=16):
    img = Image.open(image_path).convert("RGB")
    img_array = np.array(img)

    top, left, bottom, right = find_grid_bounds(img_array)

    grid_h = bottom - top
    grid_w = right - left

    cell_h = grid_h / rows
    cell_w = grid_w / cols

    # Sample fraction to use from the center of each cell (avoids the white gaps)
    sample_frac = 0.45

    hex_colors = []

    for row in range(rows):
        for col in range(cols):
            # Cell boundaries
            cy1 = top + row * cell_h
            cy2 = top + (row + 1) * cell_h
            cx1 = left + col * cell_w
            cx2 = left + (col + 1) * cell_w

            # Center sample region
            pad_y = (cy2 - cy1) * sample_frac
            pad_x = (cx2 - cx1) * sample_frac

            sy1 = int(cy1 + pad_y)
            sy2 = int(cy2 - pad_y)
            sx1 = int(cx1 + pad_x)
            sx2 = int(cx2 - pad_x)

            # Clamp
            sy1 = max(sy1, 0)
            sy2 = min(sy2, img_array.shape[0])
            sx1 = max(sx1, 0)
            sx2 = min(sx2, img_array.shape[1])

            region = img_array[sy1:sy2, sx1:sx2]
            avg = region.mean(axis=(0, 1))
            r, g, b = int(round(avg[0])), int(round(avg[1])), int(round(avg[2]))
            hex_colors.append(f"#{r:02X}{g:02X}{b:02X}")

    return hex_colors


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_richter_colors.py <image_path>")
        sys.exit(1)

    path = sys.argv[1]
    colors = sample_grid_colors(path)

    print(f"Extracted {len(colors)} colors:\n")
    for i, hex_val in enumerate(colors, 1):
        print(hex_val)

    # Also write to a file
    out_path = "richter_256_colors.txt"
    with open(out_path, "w") as f:
        f.write("\n".join(colors) + "\n")
    print(f"\nSaved to {out_path}")
