// Generate random color and set complementary text color
function setRandomColors() {
    // Generate random RGB values
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    // Calculate luminance to determine if background is light or dark
    // Using relative luminance formula: https://www.w3.org/WAI/GL/wiki/Relative_luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Use white text for dark backgrounds, black text for light backgrounds
    // This ensures high contrast for better readability
    const textColor = luminance > 0.5 ? '#000000' : '#ffffff';
    
    // Apply colors to the document
    document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    document.body.style.color = textColor;
    
    // Log colors for debugging (optional)
    console.log(`Background: rgb(${r}, ${g}, ${b}), Text: ${textColor}, Luminance: ${luminance.toFixed(3)}`);
}

// Set colors when page loads
document.addEventListener('DOMContentLoaded', setRandomColors);

// Optional: Allow manual color refresh (for testing)
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setRandomColors();
    }
});