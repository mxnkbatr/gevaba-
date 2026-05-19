const sharp = require('sharp');

const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="#F0EAE0"/>
  <circle cx="200" cy="145" r="72" fill="#C4A882" opacity="0.55"/>
  <ellipse cx="200" cy="320" rx="112" ry="95" fill="#C4A882" opacity="0.55"/>
</svg>`;

sharp(Buffer.from(svg))
  .jpeg({ quality: 85 })
  .toFile('public/default-monk.jpg')
  .then(() => console.log('✅ Created public/default-monk.jpg'))
  .catch(e => { console.error(e); process.exit(1); });
