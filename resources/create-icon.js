// 简单的图标生成脚本 - 使用纯 JavaScript 创建 PNG
const fs = require('fs');
const path = require('path');

// 创建一个简单的 256x256 PNG 图标
// 这是一个简化的 PNG 文件，包含基本的 Claude 风格图标

// PNG 文件头
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// 创建 IHDR chunk (256x256, 8-bit RGBA)
const width = 256;
const height = 256;
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(width, 0);  // width
ihdrData.writeUInt32BE(height, 4); // height
ihdrData.writeUInt8(8, 8);         // bit depth
ihdrData.writeUInt8(6, 9);         // color type (RGBA)
ihdrData.writeUInt8(0, 10);        // compression
ihdrData.writeUInt8(0, 11);        // filter
ihdrData.writeUInt8(0, 12);        // interlace

const ihdrChunk = createChunk('IHDR', ihdrData);

// 创建图像数据 - 绘制一个简单的图标
const rawData = Buffer.alloc(height * (1 + width * 4)); // filter byte + RGBA for each pixel

for (let y = 0; y < height; y++) {
  const rowOffset = y * (1 + width * 4);
  rawData[rowOffset] = 0; // filter type: None

  for (let x = 0; x < width; x++) {
    const pixelOffset = rowOffset + 1 + x * 4;

    // 计算到中心的距离
    const cx = width / 2;
    const cy = height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 背景圆角方形
    const margin = 20;
    const radius = 40;
    const inBox = x >= margin && x < width - margin && y >= margin && y < height - margin;

    if (inBox) {
      // 检查是否在圆角内
      const cornerDist = getCornerDist(x, y, width, height, margin, radius);

      if (cornerDist <= radius) {
        // 在圆角内 - 绘制渐变背景
        const t = (x + y) / (width + height);
        const r = Math.floor(245 * (1 - t) + 180 * t); // #F59E0B -> #B45309
        const g = Math.floor(158 * (1 - t) + 83 * t);
        const b = Math.floor(11 * (1 - t) + 9 * t);

        rawData[pixelOffset] = r;     // R
        rawData[pixelOffset + 1] = g; // G
        rawData[pixelOffset + 2] = b; // B
        rawData[pixelOffset + 3] = 255; // A
      } else {
        // 在圆角外 - 透明
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    } else {
      // 在框外 - 透明
      rawData[pixelOffset] = 0;
      rawData[pixelOffset + 1] = 0;
      rawData[pixelOffset + 2] = 0;
      rawData[pixelOffset + 3] = 0;
    }

    // 绘制书页 (白色矩形)
    const pageMargin = 60;
    const pageRadius = 10;
    if (x >= pageMargin && x < width - pageMargin &&
        y >= pageMargin + 20 && y < height - pageMargin + 20) {
      const inPageCorner = getCornerDist(x, y, width, height - 40, pageMargin, pageRadius) <= pageRadius;

      if (inPageCorner) {
        rawData[pixelOffset] = 255;     // R
        rawData[pixelOffset + 1] = 255; // G
        rawData[pixelOffset + 2] = 255; // B
        rawData[pixelOffset + 3] = 245; // A
      }
    }

    // 绘制文字行 (琥珀色)
    if (y >= 80 && y < 88 && x >= 80 && x < 180) {
      rawData[pixelOffset] = 217;     // R
      rawData[pixelOffset + 1] = 119; // G
      rawData[pixelOffset + 2] = 6;   // B
      rawData[pixelOffset + 3] = 150; // A
    }

    // 绘制任务复选框
    if (y >= 120 && y < 132 && x >= 80 && x < 92) {
      rawData[pixelOffset] = 217;     // R
      rawData[pixelOffset + 1] = 119; // G
      rawData[pixelOffset + 2] = 6;   // B
      rawData[pixelOffset + 3] = 200; // A
    }

    // 绘制对勾 (绿色)
    const checkX = 180;
    const checkY = 80;
    const checkR = 20;
    const checkDist = Math.sqrt((x - checkX) ** 2 + (y - checkY) ** 2);
    if (checkDist <= checkR) {
      rawData[pixelOffset] = 22;      // R
      rawData[pixelOffset + 1] = 163; // G
      rawData[pixelOffset + 2] = 74;  // B
      rawData[pixelOffset + 3] = 230; // A
    }
  }
}

// 压缩数据
const zlib = require('zlib');
const compressedData = zlib.deflateSync(rawData);

const idatChunk = createChunk('IDAT', compressedData);

// IEND chunk
const iendChunk = createChunk('IEND', Buffer.alloc(0));

// 组合 PNG 文件
const pngFile = Buffer.concat([
  pngSignature,
  ihdrChunk,
  idatChunk,
  iendChunk
]);

// 保存文件
const outputPath = path.join(__dirname, 'icon.png');
fs.writeFileSync(outputPath, pngFile);

console.log('Icon created successfully:', outputPath);
console.log('Icon size:', width, 'x', height);

// 辅助函数：创建 PNG chunk
function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// 辅助函数：计算 CRC32
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crc ^ buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ -1) >>> 0;
}

// 辅助函数：计算到圆角的距离
function getCornerDist(x, y, width, height, margin, radius) {
  const corners = [
    { x: margin + radius, y: margin + radius },
    { x: width - margin - radius, y: margin + radius },
    { x: margin + radius, y: height - margin - radius },
    { x: width - margin - radius, y: height - margin - radius }
  ];

  for (const corner of corners) {
    const dx = x - corner.x;
    const dy = y - corner.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= radius) {
      return dist;
    }
  }

  return radius + 1; // 不在任何圆角内
}
