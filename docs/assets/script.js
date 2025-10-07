function testIfTwoColorsHaveSufficientContrast(bgColor, textColor) {
  // Function to calculate relative luminance
  function getLuminance(color) {
    const rgb = color
      .replace(/[^\d,]/g, "")
      .split(",")
      .map((c) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  const L1 = getLuminance(bgColor);
  const L2 = getLuminance(textColor);
  const contrastRatio =
    L1 > L2 ? (L1 + 0.05) / (L2 + 0.05) : (L2 + 0.05) / (L1 + 0.05);

  return contrastRatio >= 1.5;
}

// Generate random color and set complementary text color
function setRandomColors(forceNew = false) {
  // test if colors stored in sessionstorage
  const storedBgColor = sessionStorage.getItem("bgColor");
  const storedTextColor = sessionStorage.getItem("textColor");
  if (storedBgColor && storedTextColor && !forceNew) {
    document.documentElement.style.setProperty(
      "--background-color",
      storedBgColor
    );
    document.documentElement.style.setProperty("--text-color", storedTextColor);
    console.log(
      `Using stored colors: Background: ${storedBgColor}, Text: ${storedTextColor}`
    );
    return;
  }
  // Generate random RGB values
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);

  // Convert RGB to HSL and get the true complementary color (180° hue rotation)
  const complementaryColor = getRGBComplementaryColor(r, g, b);

  if (
    !testIfTwoColorsHaveSufficientContrast(
      `rgb(${r}, ${g}, ${b})`,
      complementaryColor
    )
  ) {
    // If contrast is insufficient, try again
    setRandomColors(false);
    return;
  }

  // Store colors in sessionstorage
  sessionStorage.setItem("bgColor", `rgb(${r}, ${g}, ${b})`);
  sessionStorage.setItem("textColor", complementaryColor);
  // set these 2 colors to css variables
  document.documentElement.style.setProperty(
    "--background-color",
    `rgb(${r}, ${g}, ${b})`
  );
  document.documentElement.style.setProperty(
    "--text-color",
    complementaryColor
  );

  // Log colors for debugging (optional)
  console.log(`Background: rgb(${r}, ${g}, ${b}), Text: ${complementaryColor}`);
}

const randomColorButton = document.getElementById("randomColorButton");
if (randomColorButton) {
  randomColorButton.addEventListener("click", () => setRandomColors(true));
}
// Convert RGB to HSL, rotate hue by 180°, and return complementary RGB color
function getRGBComplementaryColor(r, g, b) {
  // Check if the color is too dark (using luminance)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // set luminance on body in h2

  if (luminance < 30) {
    return "rgb(255, 255, 255)";
  }

  // Normalize RGB values to 0-1 range
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Convert RGB to HSL
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s =
    diff === 0 ? 0 : l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

  if (diff !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0)) / 6;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / diff + 2) / 6;
    } else {
      h = ((rNorm - gNorm) / diff + 4) / 6;
    }
  }

  // Rotate hue by 180° (0.5 in normalized range)
  const complementaryH = (h + 0.5) % 1;

  // Convert HSL back to RGB
  const complementaryRGB = hslToRgb(complementaryH, s, l);

  return `rgb(${complementaryRGB.r}, ${complementaryRGB.g}, ${complementaryRGB.b})`;
}

// Convert HSL to RGB
function hslToRgb(h, s, l) {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}
setRandomColors();


const popovers = document.querySelectorAll("[popovertarget]");

popovers.forEach((e) => {
  const target = document.querySelector("#" + e.getAttribute("popovertarget"));
  e.addEventListener("mouseover",()=>{
    target.showPopover();
  });
  
  e.addEventListener("mouseout",()=>{
    target.hidePopover();
  });
});
