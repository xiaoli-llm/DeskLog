const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// 创建画布
const canvas = createCanvas(512, 512);
const ctx = canvas.getContext('2d');

// 背景圆角方形
const radius = 96;
ctx.beginPath();
ctx.moveTo(32 + radius, 32);
ctx.lineTo(480 - radius, 32);
ctx.quadraticCurveTo(480, 32, 480, 32 + radius);
ctx.lineTo(480, 480 - radius);
ctx.quadraticCurveTo(480, 480, 480 - radius, 480);
ctx.lineTo(32 + radius, 480);
ctx.quadraticCurveTo(32, 480, 32, 480 - radius);
ctx.lineTo(32, 32 + radius);
ctx.quadraticCurveTo(32, 32, 32 + radius, 32);
ctx.closePath();

// 渐变背景
const gradient = ctx.createLinearGradient(32, 32, 480, 480);
gradient.addColorStop(0, '#F59E0B');
gradient.addColorStop(0.5, '#D97706');
gradient.addColorStop(1, '#B45309');
ctx.fillStyle = gradient;
ctx.fill();

// 内部装饰圆
const innerGradient = ctx.createRadialGradient(256, 220, 0, 256, 220, 140);
innerGradient.addColorStop(0, 'rgba(253, 230, 138, 0.6)');
innerGradient.addColorStop(1, 'rgba(217, 119, 6, 0)');
ctx.fillStyle = innerGradient;
ctx.beginPath();
ctx.arc(256, 220, 140, 0, Math.PI * 2);
ctx.fill();

// 书页/日志本主体
ctx.save();
ctx.translate(256, 240);

// 左页
ctx.beginPath();
ctx.moveTo(-80, -80);
ctx.bezierCurveTo(-80, -90, -70, -100, -60, -100);
ctx.lineTo(60, -100);
ctx.bezierCurveTo(70, -100, 80, -90, 80, -80);
ctx.lineTo(80, 70);
ctx.bezierCurveTo(80, 80, 70, 90, 60, 90);
ctx.lineTo(-60, 90);
ctx.bezierCurveTo(-70, 90, -80, 80, -80, 70);
ctx.closePath();
ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
ctx.fill();

// 书脊装饰线
ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(-50, -100);
ctx.lineTo(-50, 90);
ctx.stroke();

// 文字行
ctx.fillStyle = 'rgba(217, 119, 6, 0.6)';
roundRect(ctx, -30, -70, 80, 8, 4);
ctx.fill();

ctx.fillStyle = 'rgba(146, 64, 14, 0.3)';
roundRect(ctx, -30, -50, 60, 6, 3);
ctx.fill();

ctx.fillStyle = 'rgba(146, 64, 14, 0.3)';
roundRect(ctx, -30, -34, 70, 6, 3);
ctx.fill();

ctx.fillStyle = 'rgba(146, 64, 14, 0.3)';
roundRect(ctx, -30, -18, 50, 6, 3);
ctx.fill();

// 复选框任务列表
ctx.strokeStyle = '#D97706';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.rect(-30, 10, 12, 12);
ctx.stroke();

ctx.fillStyle = 'rgba(22, 163, 74, 0.5)';
roundRect(ctx, -12, 14, 50, 6, 3);
ctx.fill();

ctx.strokeStyle = '#D97706';
ctx.beginPath();
ctx.rect(-30, 32, 12, 12);
ctx.stroke();

ctx.fillStyle = 'rgba(217, 119, 6, 0.5)';
roundRect(ctx, -12, 36, 40, 6, 3);
ctx.fill();

ctx.strokeStyle = '#A8A29E';
ctx.beginPath();
ctx.rect(-30, 54, 12, 12);
ctx.stroke();

ctx.fillStyle = 'rgba(168, 162, 158, 0.4)';
roundRect(ctx, -12, 58, 55, 6, 3);
ctx.fill();

ctx.restore();

// 装饰性对勾
ctx.fillStyle = 'rgba(22, 163, 74, 0.9)';
ctx.beginPath();
ctx.arc(380, 160, 28, 0, Math.PI * 2);
ctx.fill();

ctx.strokeStyle = 'white';
ctx.lineWidth = 5;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.beginPath();
ctx.moveTo(366, 160);
ctx.lineTo(376, 170);
ctx.lineTo(394, 150);
ctx.stroke();

// 底部装饰点
ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
ctx.beginPath();
ctx.arc(180, 400, 6, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(200, 400, 6, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(220, 400, 6, 0, Math.PI * 2);
ctx.fill();

// 辅助函数：绘制圆角矩形
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 保存为 PNG
const buffer = canvas.toBuffer('image/png');
const outputPath = path.join(__dirname, '..', 'resources', 'icon.png');
fs.writeFileSync(outputPath, buffer);

console.log('Icon generated successfully:', outputPath);
