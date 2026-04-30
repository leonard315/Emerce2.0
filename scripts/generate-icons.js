/**
 * Run this script once to generate PWA icons:
 * node scripts/generate-icons.js
 * 
 * Requires: npm install canvas (optional, for real icons)
 * Or use https://realfavicongenerator.net with the SVG at /public/icons/icon.svg
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create minimal valid 1x1 red PNG as placeholder
// Real icons should be generated from the SVG using a tool like sharp or realfavicongenerator.net
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

sizes.forEach(size => {
  const filePath = path.join(iconsDir, `icon-${size}x${size}.png`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, minimalPNG);
    console.log(`Created placeholder: icon-${size}x${size}.png`);
  }
});

console.log('\n✅ Placeholder icons created.');
console.log('📌 For production, generate real icons from /public/icons/icon.svg');
console.log('   Use: https://realfavicongenerator.net or npm install sharp');
