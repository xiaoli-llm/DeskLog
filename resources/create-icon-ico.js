const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 创建 ICO 文件格式的图标
function createICO() {
  // ICO 文件头 (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // reserved
  header.writeUInt16LE(1, 2);      // type: 1 = ICO
  header.writeUInt16LE(1, 4);      // count: 1 image

  // 图标目录条目 (16 bytes)
  const entry = Buffer.alloc(16);
  entry[0] = 0;                    // width (0 = 256)
  entry[1] = 0;                    // height (0 = 256)
  entry[2] = 0;                    // color palette
  entry[3] = 0;                    // reserved
  entry.writeUInt16LE(1, 4);       // color planes
  entry.writeUInt16LE(32, 6);      // bits per pixel

  // 创建 PNG 图标数据
  const pngData = createPNGIcon();

  entry.writeUInt32LE(pngData.length, 8);     // size of image data
  entry.writeUInt32LE(22, 12);                 // offset (6 + 16 = 22)

  return Buffer.concat([header, entry, pngData]);
}

function createPNGIcon() {
  const width = 256;
  const height = 256;

  // 创建像素数据
  const rawPixels = Buffer.alloc(height * (1 + width * 4));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawPixels[rowOffset] = 0; // filter None

    for (let x = 0; x < width; x++) {
      const i = rowOffset + 1 + x * 4;

      // 圆角矩形
      const margin = 24;
      const radius = 48;
      const left = margin;
      const top = margin;
      const right = width - margin;
      const bottom = height - margin;

      let inside = false;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        const corners = [
          { cx: left + radius, cy: top + radius },
          { cx: right - radius, cy: top + radius },
          { cx: left + radius, cy: bottom - radius },
          { cx: right - radius, cy: bottom - radius }
        ];

        let inCorner = false;
        for (const c of corners) {
          const dx = x - c.cx;
          const dy = y - c.cy;
          if (dx * dx + dy * dy <= radius * radius) {
            inCorner = true;
            break;
          }
        }

        const inRect = (x >= left + radius && x <= right - radius) ||
                       (y >= top + radius && y <= bottom - radius);
        inside = inRect || inCorner;
      }

      if (inside) {
        // Claude 渐变
        const t = ((x - left) + (y - top)) / ((right - left) + (bottom - top));
        let r = Math.round(245 - t * 65);
        let g = Math.round(158 - t * 75);
        let b = Math.round(11 - t * 2);
        let a = 255;

        // 白色书页区域
        const pageMargin = 65;
        const pageLeft = left + pageMargin;
        const pageTop = top + pageMargin - 5;
        const pageRight = right - pageMargin;
        const pageBottom = bottom - pageMargin + 5;

        if (x >= pageLeft && x <= pageRight && y >= pageTop && y <= pageBottom) {
          r = 255; g = 255; b = 255; a = 240;

          // 书脊
          if (x >= pageLeft + 18 && x <= pageLeft + 22) {
            r = 217; g = 119; b = 6; a = 100;
          }

          // 标题行
          if (y >= pageTop + 25 && y < pageTop + 33 && x >= pageLeft + 30 && x < pageLeft + 140) {
            r = 217; g = 119; b = 6; a = 180;
          }

          // 内容行
          for (let line = 0; line < 3; line++) {
            const ly = pageTop + 45 + line * 18;
            const lw = 100 - line * 15;
            if (y >= ly && y < ly + 6 && x >= pageLeft + 30 && x < pageLeft + 30 + lw) {
              r = 146; g = 64; b = 14; a = 80;
            }
          }

          // 任务复选框
          for (let cb = 0; cb < 3; cb++) {
            const cy = pageTop + 105 + cb * 25;
            const cx = pageLeft + 30;

            // 复选框边框
            if (y >= cy && y < cy + 14 && x >= cx && x < cx + 14) {
              if (cb < 2) {
                r = 217; g = 119; b = 6; a = 200;
              } else {
                r = 168; g = 162; b = 158; a = 150;
              }
            }

            // 任务文本
            const tw = 80 - cb * 10;
            if (y >= cy + 3 && y < cy + 11 && x >= cx + 20 && x < cx + 20 + tw) {
              if (cb === 0) {
                r = 22; g = 163; b = 74; a = 150;
              } else if (cb === 1) {
                r = 217; g = 119; b = 6; a = 150;
              } else {
                r = 168; g = 162; b = 158; a = 100;
              }
            }
          }

        } else {
          // 右上角绿色对勾
          const checkX = right - 40;
          const checkY = top + 40;
          const checkR = 22;
          const dx = x - checkX;
          const dy = y - checkY;
          if (dx * dx + dy * dy <= checkR * checkR) {
            r = 22; g = 163; b = 74; a = 230;
          }
        }

        rawPixels[i] = r;
        rawPixels[i + 1] = g;
        rawPixels[i + 2] = b;
        rawPixels[i + 3] = a;
      } else {
        rawPixels[i] = 0;
        rawPixels[i + 1] = 0;
        rawPixels[i + 2] = 0;
        rawPixels[i + 3] = 0;
      }
    }
  }

  // 压缩为 PNG
  const compressed = zlib.deflateSync(rawPixels, { level: 9 });

  // PNG 结构
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal >>> 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
    }
  }
  return c ^ 0xFFFFFFFF;
}

// 生成 ICO 文件
const icoBuffer = createICO();
const icoPath = path.join(__dirname, 'icon.ico');
fs.writeFileSync(icoPath, icoBuffer);

console.log('✅ ICO icon created:', icoPath);
console.log('   File size:', Math.round(icoBuffer.length / 1024), 'KB');
