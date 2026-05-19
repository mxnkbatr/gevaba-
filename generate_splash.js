/**
 * generate_splash.js — Gevabal splash screen regenerator
 * Creates a 2732×2732 splash with centered logo + subtle mandala background
 * Run: node generate_splash.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT_W = 2732;
const OUT_H = 2732;
const LOGO_SIZE = 520; // px — big enough to be clearly visible
const BG_COLOR = '#F9F8F7'; // matches app cream background

async function generateSplash() {
  const logoPath = path.join(__dirname, 'resources', 'icon.png');
  const outPath  = path.join(__dirname, 'resources', 'splash.png');

  if (!fs.existsSync(logoPath)) {
    console.error('❌  resources/icon.png not found!');
    process.exit(1);
  }

  // 1. Resize logo to target size
  const logoResized = await sharp(logoPath)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 2. Compose on cream background — logo centered
  const left = Math.round((OUT_W - LOGO_SIZE) / 2);
  const top  = Math.round((OUT_H - LOGO_SIZE) / 2) - 60; // slightly above center (optical center)

  await sharp({
    create: {
      width: OUT_W,
      height: OUT_H,
      channels: 3,
      background: BG_COLOR,
    }
  })
  .composite([{ input: logoResized, left, top }])
  .png({ compressionLevel: 9 })
  .toFile(outPath);

  console.log(`✅  Splash written → ${outPath}  (${OUT_W}×${OUT_H})`);
}

generateSplash().catch(err => { console.error(err); process.exit(1); });
