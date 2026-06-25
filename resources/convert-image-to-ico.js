const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertImageToICO() {
  const inputPath = process.argv[2] || path.join(__dirname, '..', 'image.png');
  const outputPath = path.join(__dirname, 'icon.ico');

  console.log('输入图片:', inputPath);
  console.log('输出ICO:', outputPath);

  try {
    // 读取并调整图片大小为256x256
    const resizedBuffer = await sharp(inputPath)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

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

    // 使用调整大小后的PNG数据
    entry.writeUInt32LE(resizedBuffer.length, 8);     // size of image data
    entry.writeUInt32LE(22, 12);                 // offset (6 + 16 = 22)

    const icoBuffer = Buffer.concat([header, entry, resizedBuffer]);

    fs.writeFileSync(outputPath, icoBuffer);

    console.log('✅ ICO 图标已创建:', outputPath);
    console.log('   文件大小:', Math.round(icoBuffer.length / 1024), 'KB');

    // 同时更新 icon.png
    const pngOutputPath = path.join(__dirname, 'icon.png');
    await sharp(inputPath)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(pngOutputPath);

    console.log('✅ PNG 图标已更新:', pngOutputPath);

  } catch (error) {
    console.error('❌ 转换失败:', error.message);
    process.exit(1);
  }
}

convertImageToICO();