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

const RICHTER_PALETTE = [
  "#8889A8","#2A5671","#A38FAA","#105050","#19313B","#72AFD4","#172433","#C2719A",
  "#442D53","#6B8754","#1D3138","#2D3A4B","#525256","#CB7C43","#526574","#B69DBB",
  "#FDD164","#036D82","#DBB380","#016194","#92B16E","#024065","#017898","#415E4B",
  "#2F5B38","#292F32","#004F88","#467496","#2D6480","#B4BAD7","#8B5859","#61B0C6",
  "#D64963","#146C87","#669A57","#162333","#446286","#12242E","#319493","#EC7D21",
  "#3F2C4C","#9EC9DA","#173F73","#A3B3CC","#946039","#058378","#5D76AB","#DF5E7D",
  "#703B39","#08406F","#F7AA50","#852E51","#27763C","#4C95B0","#E4532A","#555479",
  "#09425F","#143544","#393E5B","#102226","#6D595B","#191E21","#1C1F24","#EB9D99",
  "#203C2D","#024C78","#503D53","#643D71","#B75181","#F5AD85","#7C786D","#A7CDE0",
  "#C10831","#D99AB9","#FEE8AF","#1D8031","#6B7749","#9D898A","#A9A46D","#1F354D",
  "#945556","#60658B","#121C26","#AD5879","#576C31","#CF0324","#44385C","#647CA2",
  "#0188A5","#915F56","#233D3A","#AE0E3E","#FABD03","#0F3250","#423F36","#BAA661",
  "#01528A","#87833B","#DA261A","#865E90","#83686D","#9DBABE","#523041","#8499B6",
  "#EB7068","#EEB80E","#83A8C5","#0276B3","#96245F","#1C5170","#583A38","#4A96CA",
  "#B23E29","#181E36","#17312E","#DBBF75","#247AA2","#EC9FB3","#C39A67","#FDDE9E",
  "#016A5C","#272A39","#025E87","#879830","#40161A","#501F22","#156387","#828363",
  "#1393BC","#FAE3B7","#113A6F","#121711","#C3215C","#5D794F","#CB051C","#941415",
  "#C698B5","#66517C","#1B242B","#9CBCD1","#78B6B1","#526047","#02425B","#255D6E",
  "#CE0845","#0C1617","#EE8857","#64632A","#008979","#403E63","#4EA497","#A1608B",
  "#292234","#01467D","#4D7843","#396D94","#3DABD4","#F9D263","#2684AD","#E66B88",
  "#173F3F","#0D2A30","#BD889F","#A32664","#233C3D","#02729A","#15201C","#1C1815",
  "#111610","#063F45","#7D90BA","#1E1916","#FAC021","#223A2D","#716D64","#CFD5B3",
  "#46344E","#025F81","#D5102C","#DD8757","#D9CC3F","#FECB70","#F7E59D","#6E3F5F",
  "#ADC6DC","#898D4F","#8FA36E","#0D2C27","#BB0F49","#141B1D","#E084A3","#1C445E",
  "#0B3B3B","#0D1311","#E3D371","#2C243C","#A7254B","#0D4254","#2EA1D3","#540F21",
  "#3A2721","#C8CBB7","#825689","#151F2B","#685E5D","#EBDDAE","#B80A25","#DB9D54",
  "#7B1327","#0290A8","#C7B963","#0A150D","#EAD29C","#559537","#0F212B","#065B58",
  "#A56685","#DBA25B","#412323","#263134","#131B28","#A43B1E","#151F2B","#7DBCDB",
  "#653147","#616A57","#1A2C42","#21182B","#1E7193","#311813","#2C848C","#F6A434",
  "#7FA8C8","#F3BE20","#909EC1","#E44C47","#9F9D4A","#242C3F","#B39091","#82162E",
  "#DAAF99","#03567E","#02614B","#0281B4","#152836","#4F5A5B","#1D4B86","#D86184",
  "#9EAA29","#024B33","#5D222A","#884636","#233735","#C8A8AD","#A47796","#0084C4",
];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// Generate random color and set complementary text color
function setRandomColors(forceNew = false) {
  // test if colors stored in sessionstorage
  const storedBgColor = sessionStorage.getItem("bgColor");
  const storedTextColor = sessionStorage.getItem("textColor");
  if (storedBgColor && storedTextColor && !forceNew) {
    document.documentElement.style.setProperty(
      "--background-color",
      storedBgColor,
    );
    document.documentElement.style.setProperty("--text-color", storedTextColor);
    console.log(
      `Using stored colors: Background: ${storedBgColor}, Text: ${storedTextColor}`,
    );
    return;
  }

  // Pick a random background color from the Richter palette
  const bgIndex = Math.floor(Math.random() * RICHTER_PALETTE.length);
  const bgHex = RICHTER_PALETTE[bgIndex];
  const bgRgb = hexToRgb(bgHex);

  // Pick a text color from the palette with sufficient contrast,
  // starting at a random index and looping through subsequent colors
  const startIndex = Math.floor(Math.random() * RICHTER_PALETTE.length);
  let textHex = null;
  for (let i = 0; i < RICHTER_PALETTE.length; i++) {
    const candidateIndex = (startIndex + i) % RICHTER_PALETTE.length;
    if (candidateIndex === bgIndex) continue;
    const candidateHex = RICHTER_PALETTE[candidateIndex];
    if (testIfTwoColorsHaveSufficientContrast(bgRgb, hexToRgb(candidateHex))) {
      textHex = candidateHex;
      break;
    }
  }
  // Fallback (should never be needed with 256 colors)
  if (!textHex) textHex = "#FFFFFF";

  sessionStorage.setItem("bgColor", bgHex);
  sessionStorage.setItem("textColor", textHex);
  document.documentElement.style.setProperty("--background-color", bgHex);
  document.documentElement.style.setProperty("--text-color", textHex);

  console.log(`Background: ${bgHex}, Text: ${textHex}`);
}

// Copy-to-clipboard for footer elements
document.querySelectorAll(".copy-text").forEach((el) => {
  el.addEventListener("click", () => {
    const text = el.dataset.copy;
    navigator.clipboard.writeText(text).then(() => {
      const toast = document.getElementById("copy-toast");
      toast.textContent = `Copied: ${text}`;
      toast.classList.add("show");
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2000);
    });
  });
});

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
setRandomColors(true);

document.addEventListener("click", () => setRandomColors(true));

const popovers = document.querySelectorAll("[popovertarget]");

popovers.forEach((e) => {
  const target = document.querySelector("#" + e.getAttribute("popovertarget"));
  e.addEventListener("mouseover", () => {
    target.showPopover();
  });

  e.addEventListener("mouseout", () => {
    target.hidePopover();
  });
});
