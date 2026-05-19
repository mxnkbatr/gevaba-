const sharp = require('sharp');
const fs = require('fs');

async function generate() {
  if (!fs.existsSync('resources')) {
    fs.mkdirSync('resources');
  }

  const inputFile = 'c:/Users/User/.gemini/antigravity/brain/6ed34358-05fb-4307-b951-6fe504237688/media__1779161523194.png';

  // 1. Generate icon.png (1024x1024, no alpha, white bg)
  await sharp(inputFile)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .removeAlpha()
    .toFile('resources/icon.png');
  
  console.log('Generated resources/icon.png');

  // 2. Generate splash.png (2732x2732, #F9F8F7 bg)
  // #F9F8F7 is rgb(249, 248, 247)
  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 249, g: 248, b: 247, alpha: 1 }
    }
  })
    .composite([
      {
        input: inputFile,
        gravity: 'center'
      }
    ])
    .png()
    .toFile('resources/splash.png');

  console.log('Generated resources/splash.png');
}

generate().catch(console.error);
