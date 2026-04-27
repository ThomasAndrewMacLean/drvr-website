#!/usr/bin/env node
/**
 * Reads extracted_projects/, copies images into src/assets/images/projects/,
 * and writes src/_data/projects.json with real project data.
 */

const fs = require("fs");
const path = require("path");

const EXTRACTED = path.join(__dirname, "extracted_projects");
const IMG_DEST = path.join(__dirname, "src", "assets", "images", "projects");
const JSON_OUT = path.join(__dirname, "src", "_data", "projects.json");

fs.mkdirSync(IMG_DEST, { recursive: true });

const slugs = fs.readdirSync(EXTRACTED).filter((name) => {
  const full = path.join(EXTRACTED, name);
  return fs.statSync(full).isDirectory();
});

// Sort descending by numeric prefix so newest projects come first
slugs.sort((a, b) => {
  const na = parseInt(a.split("_")[0], 10) || 0;
  const nb = parseInt(b.split("_")[0], 10) || 0;
  return nb - na;
});

const projects = [];

for (const slug of slugs) {
  const srcDir = path.join(EXTRACTED, slug);
  const destDir = path.join(IMG_DEST, slug);
  fs.mkdirSync(destDir, { recursive: true });

  // Copy all image files
  const imageFiles = fs
    .readdirSync(srcDir)
    .filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f))
    .sort();

  const images = [];
  for (const imgFile of imageFiles) {
    fs.copyFileSync(path.join(srcDir, imgFile), path.join(destDir, imgFile));
    images.push(`/assets/images/projects/${slug}/${imgFile}`);
  }

  // Read data.json
  const dataPath = path.join(srcDir, "data.json");
  let data = {};
  if (fs.existsSync(dataPath)) {
    try {
      data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    } catch (e) {
      console.warn(`  Warning: could not parse ${dataPath}`);
    }
  }

  projects.push({
    id: slug,
    slug,
    title: data.title || slug,
    subtitle: data.subtitle || "",
    opdracht: data.opdracht || "",
    architect: data.architect || "",
    opdrachtgever: data.opdrachtgever || "",
    aannemer: data.aannemer || "",
    ligging: data.ligging || "",
    omvang: data.omvang || "",
    budget: data.budget || "",
    status: data.status || "",
    bijzonderheden: data.bijzonderheden || "",
    notes: data.notes || "",
    images,
  });

  console.log(`  ${slug}: ${images.length} image(s)`);
}

fs.writeFileSync(JSON_OUT, JSON.stringify(projects, null, 2), "utf8");
console.log(`\nWrote ${projects.length} projects to ${JSON_OUT}`);
