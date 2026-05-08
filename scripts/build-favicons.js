const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'logo.png');

async function png(size) {
  return sharp(source)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
}

function createIco(entries) {
  const headerSize = 6;
  const directorySize = entries.length * 16;
  let offset = headerSize + directorySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const directories = entries.map(({ size, buffer }) => {
    const directory = Buffer.alloc(16);
    directory.writeUInt8(size === 256 ? 0 : size, 0);
    directory.writeUInt8(size === 256 ? 0 : size, 1);
    directory.writeUInt8(0, 2);
    directory.writeUInt8(0, 3);
    directory.writeUInt16LE(1, 4);
    directory.writeUInt16LE(32, 6);
    directory.writeUInt32LE(buffer.length, 8);
    directory.writeUInt32LE(offset, 12);
    offset += buffer.length;
    return directory;
  });

  return Buffer.concat([header, ...directories, ...entries.map((entry) => entry.buffer)]);
}

async function main() {
  const faviconEntries = await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, buffer: await png(size) }))
  );

  const files = [
    ['favicon.ico', createIco(faviconEntries)],
    ['apple-touch-icon.png', await png(180)],
    ['icon-192.png', await png(192)],
  ];

  for (const [file, buffer] of files) {
    fs.writeFileSync(path.join(root, file), buffer);
    console.log(`${file}: ${buffer.length} bytes`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
