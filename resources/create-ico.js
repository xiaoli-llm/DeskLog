const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 创建 256x256 PNG 图标数据
function createPNGIcon() {
  const width = 256;
  const height = 256;
  const pixels = Buffer.alloc(height * (1 + width * 4));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    pixels[rowOffset] = 0; // filter None

    for (let x = 0; x < width; x++) {
      const i = rowOffset + 1 + x * 4;
      const cx = width / 2;
      const cy = height / 2;

      // 圆角矩形检测
      const margin = 24;
      const radius = 48;
      const left = margin;
      const top = margin;
      const right = width - margin;
      const bottom = height - margin;

      let inside = false;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        // 四个角的圆角检测
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

        // 检查是否在矩形区域或圆角内
        const inRect = (x >= left + radius && x <= right - radius) ||
                       (y >= top + radius && y <= bottom - radius);
        inside = inRect || inCorner;
      }

      if (inside) {
        // Claude 渐变色 #F59E0B -> #B45309
        const t = ((x - left) + (y - top)) / ((right - left) + (bottom - top));
        const r = Math.round(245 - t * 65);
        const g = Math.round(158 - t * 75);
        const b = Math.round(11 - t * 2);

        // 内部白色书页区域
        const pageMargin = 70;
        const pageLeft = left + pageMargin;
        const pageTop = top + pageMargin - 10;
        const pageRight = right - pageMargin;
        const pageBottom = bottom - pageMargin + 10;

        if (x >= pageLeft && x <= pageRight && y >= pageTop && y <= pageBottom) {
          // 书页背景 - 白色
          pixels[i] = 255;
          pixels[i + 1] = 255;
          pixels[i + 2] = 255;
          pixels[i + 3] = 240;

          // 书脊线
          if (x >= pageLeft + 20 && x <= pageLeft + 24) {
            pixels[i] = 217;
            pixels[i + 1] = 119;
            pixels[i + 2] = 6;
            pixels[i + 3] = 100;
          }

          // 文字行
          const lineY1 = pageTop + 30;
          const lineY2 = pageTop + 50;
          const lineY3 = pageTop + 70;
          const lineY4 = pageTop + 90;

          if (y >= lineY1 && y < lineY1 + 8 && x >= pageLeft + 35 && x < pageLeft + 130) {
            pixels[i] = 217; pixels[i + 1] = 119; pixels[i + 2] = 6; pixels[i + 3] = 180;
          }
          if (y >= lineY2 && y < lineY2 + 6 && x >= pageLeft + 35 && x < pageLeft + 110) {
            pixels[i] = 146; pixels[i + 1] = 64; pixels[i + 2] = 14; pixels[i + 3] = 80;
          }
          if (y >= lineY3 && y < lineY3 + 6 && x >= pageLeft + 35 && x < pageLeft + 120) {
            pixels[i] = 146; pixels[i + 1] = 64; pixels[i + 2] = 14; pixels[i + 3] = 80;
          }

          // 复选框
          const cbY1 = pageTop + 110;
          const cbY2 = pageTop + 135;
          const cbY3 = pageTop + 160;

          // 复选框1 - 已完成
          if (y >= cbY1 && y < cbY1 + 14 && x >= pageLeft + 35 && x < pageLeft + 49) {
            pixels[i] = 217; pixels[i + 1] = 119; pixels[i + 2] = 6; pixels[i + 3] = 200;
          }
          if (y >= cbY1 + 3 && y < cbY1 + 11 && x >= pageLeft + 55 && x < pageLeft + 120) {
            pixels[i] = 22; pixels[i + 1] = 163; pixels[i + 2] = 74; pixels[i + 3] = 150;
          }

          // 复选框2 - 进行中
          if (y >= cbY2 && y < cbY2 + 14 && x >= pageLeft + 35 && x < pageLeft + 49) {
            pixels[i] = 217; pixels[i + 1] = 119; pixels[i + 2] = 6; pixels[i + 3] = 200;
          }
          if (y >= cbY2 + 3 && y < cbY2 + 11 && x >= pageLeft + 55 && x < pageLeft + 105) {
            pixels[i] = 217; pixels[i + 1] = 119; pixels[i + 2] = 6; pixels[i + 3] = 150;
          }

          // 复选框3 - 待办
          if (y >= cbY3 && y < cbY3 + 14 && x >= pageLeft + 35 && x < pageLeft + 49) {
            pixels[i] = 168; pixels[i + 1] = 162; pixels[i + 2] = 158; pixels[i + 3] = 150;
          }
          if (y >= cbY3 + 3 && y < cbY3 + 11 && x >= pageLeft + 55 && x < pageLeft + 115) {
            pixels[i] = 168; pixels[i + 1] = 162; pixels[i + 2] = 158; pixels[i + 3] = 100;
          }

        } else {
          // 渐变背景
          pixels[i] = r;
          pixels[i + 1] = g;
          pixels[i + 2] = b;
          pixels[i + 3] = 255;

          // 右上角绿色对勾圆
          const checkX = right - 45;
          const checkY = top + 45;
          const checkR = 24;
          const dx = x - checkX;
          const dy = y - checkY;
          if (dx * dx + dy * dy <= checkR * checkR) {
            pixels[i] = 22;
            pixels[i + 1] = 163;
            pixels[i + 2] = 74;
            pixels[i + 3] = 230;

            // 对勾白色线条
            const lx = x - checkX;
            const ly = y - checkY;
            if (ly >= -2 && ly <= 2 && lx >= -12 && lx <= -4) {
              pixels[i] = 255; pixels[i + 1] = 255; pixels[i + 2] = 255; pixels[i + 3] = 255;
            }
            if (ly >= -8 && ly <= -2 && lx >= -4 && lx <= 4) {
              const dist = Math.abs(lx + ly + 4);
              if (dist < 3) {
                pixels[i] = 255; pixels[i + 1] = 255; pixels[i + 2] = 255; pixels[i + 3] = 255;
              }
            }
          }
        }
      } else {
        // 透明背景
        pixels[i] = 0;
        pixels[i + 1] = 0;
        pixels[i + 2] = 0;
        pixels[i + 3] = 0;
      }
    }
  }

  return { width, height, pixels };
}

// 创建 PNG 文件
function createPNG({ width, height, pixels }) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT
  const compressed = zlib.deflateSync(pixels, { level: 9 });

  // 组合
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
  const crc = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0);
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

// 生成并保存
const iconData = createPNGIcon();
const pngBuffer = createPNG(iconData);

const outputPath = path.join(__dirname, 'icon.png');
fs.writeFileSync(outputPath, pngBuffer);

console.log('✅ Icon created:', outputPath);
console.log('   Size:', iconData.width, 'x', iconData.height);
console.log('   File size:', Math.round(pngBuffer.length / 1024), 'KB');
