const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const keys = new Set();

const scientist = {
  x: 126,
  y: 392,
  w: 78,
  h: 142,
  baseSpeed: 245,
  slowUntil: 0,
  facing: 1,
  step: 0
};

const mucus = [
  { x: 420, y: 472, r: 19, vx: 34, phase: 0 },
  { x: 380, y: 490, r: 15, vx: -26, phase: 2.1 },
  { x: 765, y: 158, r: 17, vx: -22, phase: 1.2 },
  { x: 804, y: 190, r: 12, vx: 28, phase: 3.4 }
];

const viruses = [
  { x: 810, y: 128, r: 27, vx: -48, vy: 24, phase: 0, color: "#71b6c5", spike: "#c33b48" },
  { x: 720, y: 505, r: 29, vx: 54, vy: -20, phase: 1.7, color: "#96b63b", spike: "#516915" },
  { x: 560, y: 135, r: 25, vx: -36, vy: 28, phase: 3.1, color: "#8d58b5", spike: "#4d2a73" }
];

let last = 0;
let dead = false;

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "a" || key === "d") keys.add(key);
  if (dead && (key === " " || key === "enter")) resetGame();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

function resetGame() {
  scientist.x = 126;
  scientist.slowUntil = 0;
  scientist.facing = 1;
  scientist.step = 0;
  dead = false;
  last = performance.now();
}

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.04) || 0;
  last = now;

  if (!dead) update(dt, now);
  draw(now);
  requestAnimationFrame(loop);
}

function update(dt, now) {
  const slowed = now < scientist.slowUntil;
  const speed = slowed ? scientist.baseSpeed * 0.42 : scientist.baseSpeed;
  let direction = 0;

  if (keys.has("a")) direction -= 1;
  if (keys.has("d")) direction += 1;

  if (direction !== 0) {
    scientist.facing = direction;
    scientist.x += direction * speed * dt;
    scientist.step += dt * (slowed ? 5 : 10);
  } else {
    scientist.step = 0;
  }

  scientist.x = clamp(scientist.x, 42, W - scientist.w - 42);

  mucus.forEach((blob) => {
    blob.x += blob.vx * dt;
    blob.y += Math.sin(now / 420 + blob.phase) * 13 * dt;
    if (blob.x < 285 || blob.x > 865) blob.vx *= -1;
  });

  viruses.forEach((virus) => {
    virus.x += virus.vx * dt;
    virus.y += virus.vy * dt;
    virus.phase += dt * 2.8;

    if (virus.x < 235 || virus.x > 895) virus.vx *= -1;
    if (virus.y < 105 || virus.y > 530) virus.vy *= -1;
  });

  const playerCircle = {
    x: scientist.x + scientist.w * 0.52,
    y: scientist.y + scientist.h * 0.58,
    r: 36
  };

  if (mucus.some((blob) => circlesTouch(playerCircle, blob))) {
    scientist.slowUntil = now + 1300;
  }

  if (viruses.some((virus) => circlesTouch(playerCircle, virus))) {
    dead = true;
  }
}

function draw(now) {
  ctx.clearRect(0, 0, W, H);
  drawBackground(now);
  mucus.forEach((blob) => drawMucus(blob, now));
  viruses.forEach((virus) => drawVirus(virus, now));
  drawScientist(scientist, now);
  if (dead) drawDeathScreen(now);
}

function drawBackground(now) {
  ctx.fillStyle = "#120607";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#a8252c";
  pixelBand(0, 58, [
    [0, 0, 178, 72], [178, 18, 220, 62], [398, 34, 204, 52],
    [602, 22, 158, 70], [760, 10, 200, 74]
  ]);
  pixelBand(0, 505, [
    [0, 54, 82, 74], [82, 34, 142, 88], [224, 22, 270, 86],
    [494, 34, 198, 92], [692, 54, 182, 80], [874, 70, 86, 64]
  ]);

  ctx.fillStyle = "#c7232b";
  ctx.fillRect(0, 135, W, 62);
  ctx.fillRect(0, 498, W, 88);

  ctx.fillStyle = "#ff8558";
  ctx.fillRect(0, 184, W, 316);

  ctx.fillStyle = "#ff9a75";
  ctx.fillRect(0, 196, W, 228);

  ctx.strokeStyle = "rgba(127, 18, 24, 0.35)";
  ctx.lineWidth = 10;
  for (let i = 0; i < 8; i += 1) {
    const y = 72 + i * 73 + Math.sin(now / 900 + i) * 7;
    ctx.beginPath();
    ctx.moveTo(-40, y);
    ctx.bezierCurveTo(170, y + 38, 300, y - 42, 520, y + 8);
    ctx.bezierCurveTo(705, y + 50, 815, y - 25, 1005, y + 24);
    ctx.stroke();
  }
}

function pixelBand(x, y, blocks) {
  blocks.forEach(([bx, by, bw, bh]) => ctx.fillRect(x + bx, y + by, bw, bh));
}

function drawScientist(p, now) {
  const bounce = Math.sin(p.step) * 3;
  const x = p.x;
  const y = p.y + bounce;

  ctx.save();
  ctx.translate(x + p.w / 2, y + p.h / 2);
  ctx.scale(p.facing, 1);
  ctx.translate(-p.w / 2, -p.h / 2);

  ctx.fillStyle = "#1b1314";
  ctx.fillRect(18, 126, 15, 13);
  ctx.fillRect(48, 126, 15, 13);
  ctx.fillStyle = "#f6f0e8";
  ctx.fillRect(17, 55, 49, 76);
  ctx.fillStyle = "#163b4c";
  ctx.fillRect(27, 58, 10, 67);
  ctx.fillRect(46, 58, 8, 67);
  ctx.fillStyle = "#22252a";
  ctx.fillRect(10, 83, 20, 34);
  ctx.fillRect(63, 81, 10, 39);
  ctx.fillStyle = "#633329";
  ctx.fillRect(26, 24, 33, 31);
  ctx.fillRect(18, 38, 9, 10);
  ctx.fillStyle = "#111";
  ctx.fillRect(22, 14, 38, 16);
  ctx.fillRect(16, 28, 51, 12);
  ctx.fillStyle = "#0c1118";
  ctx.fillRect(19, 40, 20, 15);
  ctx.fillRect(44, 40, 19, 15);
  ctx.fillStyle = "#fff";
  ctx.fillRect(24, 44, 8, 5);
  ctx.fillRect(49, 44, 7, 5);
  ctx.fillStyle = "#e9f6fb";
  ctx.fillRect(67, 74, 13, 28);
  ctx.fillStyle = "#4fc2df";
  ctx.fillRect(72, 87, 15, 22);
  ctx.fillStyle = "#122b38";
  ctx.fillRect(75, 81, 9, 6);
  ctx.fillStyle = "#72d8ef";
  ctx.fillRect(83, 62 + Math.sin(now / 120) * 3, 4, 4);
  ctx.fillRect(90, 51 + Math.sin(now / 150) * 4, 3, 3);
  ctx.fillRect(86, 43 + Math.sin(now / 180) * 5, 3, 3);

  if (performance.now() < p.slowUntil) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#317066";
    ctx.fillRect(10, 120, 58, 12);
  }

  ctx.restore();
}

function drawMucus(blob, now) {
  const wobble = Math.sin(now / 260 + blob.phase) * 3;
  ctx.fillStyle = "#071227";
  circle(blob.x - 5, blob.y + 5, blob.r + 5);
  ctx.fillStyle = "#1b4f57";
  circle(blob.x, blob.y, blob.r + wobble);
  ctx.fillStyle = "#398d85";
  circle(blob.x - blob.r * 0.25, blob.y - blob.r * 0.28, Math.max(3, blob.r * 0.28));
  ctx.fillStyle = "#0a2237";
  circle(blob.x - blob.r * 1.35, blob.y - 3, blob.r * 0.42);
  circle(blob.x + blob.r * 1.28, blob.y + 8, blob.r * 0.36);
  circle(blob.x - 6, blob.y + blob.r * 1.22, blob.r * 0.34);
}

function drawVirus(virus, now) {
  ctx.save();
  ctx.translate(virus.x, virus.y);
  ctx.rotate(Math.sin(virus.phase) * 0.14);

  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI * 2 * i) / 10 + virus.phase * 0.08;
    const sx = Math.cos(angle) * (virus.r + 10);
    const sy = Math.sin(angle) * (virus.r + 10);
    ctx.strokeStyle = "#2a1328";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * virus.r * 0.76, Math.sin(angle) * virus.r * 0.76);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    ctx.fillStyle = virus.spike;
    circle(sx, sy, 7);
  }

  ctx.fillStyle = "#1b1632";
  circle(3, 5, virus.r + 3);
  ctx.fillStyle = virus.color;
  circle(0, 0, virus.r);
  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  circle(-10, -10, 4);
  circle(8, -14, 3);
  ctx.fillStyle = virus.spike;
  circle(0, 1, 8);
  ctx.fillStyle = "#25354f";
  circle(-11, 10, 4);
  circle(14, 9, 3);

  ctx.restore();
}

function drawDeathScreen(now) {
  ctx.fillStyle = "rgba(8, 1, 3, 0.78)";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#121015";
  ctx.fillRect(165, 154, 630, 322);
  ctx.strokeStyle = "#c52834";
  ctx.lineWidth = 10;
  ctx.strokeRect(165, 154, 630, 322);

  ctx.fillStyle = "#e02635";
  ctx.font = "bold 72px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("VOCE MORREU!!!", W / 2, 292);

  ctx.fillStyle = "#fff1e0";
  ctx.font = "bold 42px 'Courier New', monospace";
  ctx.fillText("TENTE OUTRA VEZ.", W / 2, 388);

  ctx.fillStyle = now % 1000 < 550 ? "#ffebc6" : "#8d2a31";
  ctx.font = "bold 20px 'Courier New', monospace";
  ctx.fillText("ENTER OU ESPACO PARA REINICIAR", W / 2, 433);
}

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function circlesTouch(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.hypot(dx, dy);
  return distance < a.r + b.r;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

requestAnimationFrame((time) => {
  last = time;
  requestAnimationFrame(loop);
});
