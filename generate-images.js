const fs = require("fs");
const path = require("path");

// Simple function to generate architectural-style SVG drawings
function generateArchitecturalSVG(projectId, width = 800, height = 600) {
  const seed = projectId * 137; // Simple seed for reproducible randomness

  function random(min, max) {
    const x = Math.sin(seed + min * 1000 + max * 100) * 10000;
    return Math.abs(x - Math.floor(x)) * (max - min) + min;
  }

  function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
  }

  // Generate different architectural elements based on project ID
  const buildingTypes = ["residential", "modern", "traditional", "complex"];
  const buildingType = buildingTypes[projectId % buildingTypes.length];

  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background: #f8f8f8;">`;

  // Define colors and styles
  const colors = {
    wall: "#2c3e50",
    room: "#ecf0f1",
    door: "#8b4513",
    window: "#3498db",
    dimension: "#e74c3c",
    text: "#2c3e50",
  };

  // Add architectural elements based on type
  if (buildingType === "residential") {
    // Simple house floor plan
    const houseWidth = random(300, 500);
    const houseHeight = random(200, 300);
    const startX = (width - houseWidth) / 2;
    const startY = (height - houseHeight) / 2;

    // Outer walls
    svgContent += `<rect x="${startX}" y="${startY}" width="${houseWidth}" height="${houseHeight}" 
                   fill="none" stroke="${colors.wall}" stroke-width="6"/>`;

    // Interior walls
    const rooms = randomInt(2, 4);
    for (let i = 1; i < rooms; i++) {
      const wallX = startX + (houseWidth / rooms) * i;
      svgContent += `<line x1="${wallX}" y1="${startY}" x2="${wallX}" y2="${
        startY + houseHeight
      }" 
                     stroke="${colors.wall}" stroke-width="4"/>`;
    }

    // Add some horizontal divisions
    if (random(0, 1) > 0.5) {
      const midY = startY + houseHeight / 2;
      svgContent += `<line x1="${startX}" y1="${midY}" x2="${
        startX + houseWidth
      }" y2="${midY}" 
                     stroke="${colors.wall}" stroke-width="4"/>`;
    }

    // Add doors and windows
    const numDoors = randomInt(1, 3);
    for (let i = 0; i < numDoors; i++) {
      const doorX = startX + random(20, houseWidth - 60);
      const doorY = startY + houseHeight - 6;
      svgContent += `<rect x="${doorX}" y="${doorY}" width="40" height="6" fill="${colors.door}"/>`;
    }

    // Add windows
    const numWindows = randomInt(3, 8);
    for (let i = 0; i < numWindows; i++) {
      const windowX = startX + random(20, houseWidth - 30);
      const windowY = startY + random(20, houseHeight - 30);
      svgContent += `<rect x="${windowX}" y="${windowY}" width="20" height="15" 
                     fill="${colors.window}" stroke="${colors.wall}" stroke-width="2"/>`;
    }
  } else if (buildingType === "modern") {
    // Modern building with geometric shapes
    const numBlocks = randomInt(2, 5);
    for (let i = 0; i < numBlocks; i++) {
      const blockWidth = random(100, 200);
      const blockHeight = random(80, 150);
      const blockX = random(50, width - blockWidth - 50);
      const blockY = random(50, height - blockHeight - 50);

      svgContent += `<rect x="${blockX}" y="${blockY}" width="${blockWidth}" height="${blockHeight}" 
                     fill="${colors.room}" stroke="${colors.wall}" stroke-width="3"/>`;

      // Add grid pattern inside
      const gridSpacing = 20;
      for (
        let gx = blockX + gridSpacing;
        gx < blockX + blockWidth;
        gx += gridSpacing
      ) {
        svgContent += `<line x1="${gx}" y1="${blockY}" x2="${gx}" y2="${
          blockY + blockHeight
        }" 
                       stroke="#bdc3c7" stroke-width="1"/>`;
      }
      for (
        let gy = blockY + gridSpacing;
        gy < blockY + blockHeight;
        gy += gridSpacing
      ) {
        svgContent += `<line x1="${blockX}" y1="${gy}" x2="${
          blockX + blockWidth
        }" y2="${gy}" 
                       stroke="#bdc3c7" stroke-width="1"/>`;
      }
    }
  } else if (buildingType === "traditional") {
    // Traditional building with detailed rooms
    const mainWidth = random(400, 600);
    const mainHeight = random(300, 400);
    const startX = (width - mainWidth) / 2;
    const startY = (height - mainHeight) / 2;

    // Main structure
    svgContent += `<rect x="${startX}" y="${startY}" width="${mainWidth}" height="${mainHeight}" 
                   fill="${colors.room}" stroke="${colors.wall}" stroke-width="5"/>`;

    // Create rooms
    const roomsX = randomInt(2, 4);
    const roomsY = randomInt(2, 3);

    for (let x = 1; x < roomsX; x++) {
      const wallX = startX + (mainWidth / roomsX) * x;
      svgContent += `<line x1="${wallX}" y1="${startY}" x2="${wallX}" y2="${
        startY + mainHeight
      }" 
                     stroke="${colors.wall}" stroke-width="3"/>`;
    }

    for (let y = 1; y < roomsY; y++) {
      const wallY = startY + (mainHeight / roomsY) * y;
      svgContent += `<line x1="${startX}" y1="${wallY}" x2="${
        startX + mainWidth
      }" y2="${wallY}" 
                     stroke="${colors.wall}" stroke-width="3"/>`;
    }

    // Add room labels
    for (let x = 0; x < roomsX; x++) {
      for (let y = 0; y < roomsY; y++) {
        const roomX =
          startX + (mainWidth / roomsX) * x + mainWidth / roomsX / 2;
        const roomY =
          startY + (mainHeight / roomsY) * y + mainHeight / roomsY / 2;
        const roomTypes = [
          "KEUKEN",
          "WOONKAMER",
          "SLAAPKAMER",
          "BADKAMER",
          "BUREAU",
          "BERGING",
        ];
        const roomType = roomTypes[(x + y + projectId) % roomTypes.length];
        svgContent += `<text x="${roomX}" y="${roomY}" text-anchor="middle" 
                       font-family="Arial, sans-serif" font-size="12" fill="${colors.text}">${roomType}</text>`;
      }
    }
  } else {
    // Complex architectural plan
    const sections = randomInt(3, 6);
    for (let i = 0; i < sections; i++) {
      const sectionWidth = random(80, 180);
      const sectionHeight = random(60, 120);
      const sectionX = random(50, width - sectionWidth - 50);
      const sectionY = random(50, height - sectionHeight - 50);

      svgContent += `<rect x="${sectionX}" y="${sectionY}" width="${sectionWidth}" height="${sectionHeight}" 
                     fill="${colors.room}" stroke="${colors.wall}" stroke-width="2"/>`;

      // Add connecting elements
      if (i > 0) {
        const prevX = random(50, width - 50);
        const prevY = random(50, height - 50);
        svgContent += `<line x1="${sectionX + sectionWidth / 2}" y1="${
          sectionY + sectionHeight / 2
        }" 
                       x2="${prevX}" y2="${prevY}" stroke="${
          colors.wall
        }" stroke-width="2" stroke-dasharray="5,5"/>`;
      }
    }
  }

  // Add dimension lines and annotations
  svgContent += `<text x="50" y="30" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${
    colors.text
  }">
                 PROJECT ${projectId} - ${buildingType.toUpperCase()} PLAN</text>`;

  // Add scale indicator
  svgContent += `<text x="${width - 150}" y="${
    height - 20
  }" font-family="Arial, sans-serif" font-size="10" fill="${colors.text}">
                 SCHAAL 1:100</text>`;

  // Add north arrow
  const arrowX = width - 80;
  const arrowY = 80;
  svgContent += `<g transform="translate(${arrowX}, ${arrowY})">
                 <line x1="0" y1="0" x2="0" y2="-30" stroke="${colors.dimension}" stroke-width="2"/>
                 <polygon points="0,-30 -5,-20 5,-20" fill="${colors.dimension}"/>
                 <text x="10" y="-10" font-family="Arial, sans-serif" font-size="10" fill="${colors.text}">N</text>
                 </g>`;

  svgContent += "</svg>";
  return svgContent;
}

// Generate images for projects 1-50
function generateAllImages() {
  const outputDir = path.join(__dirname, "src", "assets", "images");

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 1; i <= 50; i++) {
    const svgContent = generateArchitecturalSVG(i);
    const fileName = `project_${i}.svg`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, svgContent);
    console.log(`Generated ${fileName}`);
  }

  console.log("All 50 architectural drawings generated successfully!");
}

// Run the generation
generateAllImages();
