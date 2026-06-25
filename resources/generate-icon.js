const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 多尺寸 ICO 生成器
// ICO 格式：文件头 + N个目录条目 + N个PNG数据

const SIZES = [16, 32, 48, 256];

async function generateICO() {
  const inputPath = process.argv[2] || path.join(__dirname, '..', 'image.png');
  const icoPath = path.join(__dirname, 'icon.ico');
  const pngPath = path.join(__dirname, 'icon.png');

  console.log('输入图片:', inputPath);

  // 读取原图并生成各尺寸的 RGBA PNG
  const pngBuffers = [];
  for (const size of SIZES) {
    const buf = await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha() // 强制 RGBA，保留透明通道
      .png()
      .toBuffer();
    pngBuffers.push({ size, buf });
    console.log(`  生成 ${size}x${size}: ${buf.length} bytes`);
  }

  // 构建 ICO 文件
  const imageCount = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const headerAndEntriesSize = headerSize + entrySize * imageCount;

  // 计算每个 PNG 数据的偏移量
  let currentOffset = headerAndEntriesSize;
  const entries = [];
  for (const { size, buf } of pngBuffers) {
    entries.push({ size, buf, offset: currentOffset });
    currentOffset += buf.length;
  }

  // 文件头 (6 bytes)
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);           // reserved
  header.writeUInt16LE(1, 2);           // type: 1 = ICO
  header.writeUInt16LE(imageCount, 4);  // image count

  // 目录条目 (每个 16 bytes)
  const entryBuffers = entries.map(({ size, buf, offset }) => {
    const entry = Buffer.alloc(entrySize);
    entry[0] = size >= 256 ? 0 : size;  // width (0 means 256)
    entry[1] = size >= 256 ? 0 : size;  // height
    entry[2] = 0;                        // color palette
    entry[3] = 0;                        // reserved
    entry.writeUInt16LE(1, 4);           // color planes
    entry.writeUInt16LE(32, 6);          // bits per pixel (RGBA)
    entry.writeUInt32LE(buf.length, 8);  // image data size
    entry.writeUInt32LE(offset, 12);     // image data offset
    return entry;
  });

  const icoBuffer = Buffer.concat([header, ...entryBuffers, ...entries.map(e => e.buf)]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`\n✅ ICO 已生成: ${icoPath} (${Math.round(icoBuffer.length / 1024)} KB)`);
  console.log(`   包含尺寸: ${SIZES.join(', ')}`);

  // 同时生成 256x256 PNG
  await sharp(inputPath)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toFile(pngPath);
  console.log(`✅ PNG 已更新: ${pngPath}`);
}

generateICO().catch(err => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});
