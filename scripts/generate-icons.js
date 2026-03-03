const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const iconsDir = path.join(__dirname, '..', 'icons');
const sizes = [16, 32, 48];
const dark = { r: 15, g: 23, b: 42 };

function drawIcon(size) {
  const png = new PNG({ width: size, height: size });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = dark.r;
    png.data[i + 1] = dark.g;
    png.data[i + 2] = dark.b;
    png.data[i + 3] = 255;
  }
  return png;
}

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

let done = 0;
sizes.forEach((size) => {
  const png = drawIcon(size);
  const out = path.join(iconsDir, `icon${size}.png`);
  const outStream = fs.createWriteStream(out);
  png.pack().pipe(outStream);
  outStream.on('finish', () => {
    console.log('Written', out);
    if (++done === sizes.length) process.exit(0);
  });
});
