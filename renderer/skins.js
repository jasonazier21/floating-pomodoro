'use strict';

/* =====================================================================
   Pixel skins — each one is drawn procedurally on a 36x48 grid of 7px
   cells. Every skin keeps the timer "pit" at the same spot so the UI
   overlay lines up no matter which skin is active.
   ===================================================================== */

const GRID_W = 36;
const GRID_H = 48;
const PX = 7;
const PIT = { x: 18, y: 31.5, r: 9.5 };

const canvas = document.getElementById('sprite');
const ctx = canvas.getContext('2d');

/* ---------- helpers ---------- */

function cell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * PX, y * PX, PX, PX);
}

const hash = (x, y) => ((Math.imul(x, 374761393) + Math.imul(y, 668265263)) >>> 0) % 100;

// A body is a union of circles; "inset" shrinks each one to make shading bands.
function inCircles(circles, x, y, inset) {
  const px = x + 0.5;
  const py = y + 0.5;
  for (const [cx, cy, r] of circles) {
    const rr = r - inset;
    if (rr > 0 && (px - cx) ** 2 + (py - cy) ** 2 <= rr * rr) return true;
  }
  return false;
}

function swept(x, y0, y1, r0, r1, n = 24) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([x, y0 + (y1 - y0) * t, r0 + (r1 - r0) * t]);
  }
  return out;
}

function sprite(rows, x0, y0, map) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = map[row[i]];
      if (c) cell(x0 + i, y0 + j, c);
    }
  });
}

const mirrorRows = (rows) => rows.map((r) => [...r].reverse().join(''));

const pit = (ring, fill, shine, progress) => ({ ring, fill, shine, progress });

/* ---------- shared sprites ---------- */

const LEAF_COLORS = { G: '#4caf32', D: '#2f7d26', B: '#6b3f1d' };

const SPROUT = [
  '..GG......GG..',
  '..DGG....GGD..',
  '...DGG..GGD...',
  '....DGGGGD....',
  '......GD......',
  '......GD......',
  '......GD......',
];

const STEM_LEAF = [
  '..DGGG..',
  'BDGGGGD.',
  'BB......',
  'BB......',
];

const STRAWBERRY_CAP = [
  '.........BB.........',
  '..GG..GGDBBDGG..GG..',
  '.GGGGGGGGDDGGGGGGGG.',
  '..GGGGGGGDDGGGGGGG..',
  '....DGGGGGGGGGGD....',
  '......DDGGGGDD......',
];

const EAR = [
  'O.......',
  'OOO.....',
  'OEEO....',
  'OEEEO...',
  'OEPEEO..',
  'OEPPEEO.',
  'OEPPPEEO',
  'OEEEEEEE',
  'OEEEEEEE',
  '.OEEEEEE',
];

function catEars(outline, fur, inner) {
  return () => {
    const map = { O: outline, E: fur, P: inner };
    sprite(EAR, 7, 5, map);
    sprite(mirrorRows(EAR), 21, 5, map);
  };
}

/* ---------- skins ---------- */

const AVOCADO_SPECKS = new Set(['15,9', '22,10', '9,24', '27,22', '7,33', '29,35', '12,43', '24,44', '20,19']
  .map((s) => s));
const AVOCADO_BODY = swept(18, 16, 31.5, 10, 15);

const FOOD_FACE = { ey: 16, cy: 20, my: 20, cheek: '#ff8fa3' };
const ROUND = [[18, 28, 16]];

const EARTH_LAND = [[10, 21, 5], [14, 25, 3], [26, 19, 4], [28, 24, 3], [8, 37, 4], [27, 38, 5], [22, 41, 3]];
const MARS_CRATERS = [[12, 35, 3], [26, 24, 2.5], [24, 38, 2], [9, 25, 2], [20, 17, 1.8]];
const MOON_CRATERS = [[11, 22, 3.5], [27, 30, 3], [10, 38, 2.5], [25, 40, 2.5], [22, 19, 2]];

function saturnRing(fn) {
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      // ring is an ellipse tilted by 22 degrees
      const ox = x + 0.5 - 18;
      const oy = y + 0.5 - 29.5;
      const dx = ox * 0.927 + oy * 0.375;
      const dy = -ox * 0.375 + oy * 0.927;
      const o = (dx / 18.6) ** 2 + (dy / 6.6) ** 2;
      if (o > 1) continue;
      if ((dx / 14.5) ** 2 + (dy / 3.4) ** 2 < 1) continue;
      fn(x, y, o, dy);
    }
  }
}

const SKINS = [
  {
    name: 'AVOCADO',
    body: AVOCADO_BODY,
    layers: ['#23402b', '#5b9a2c', '#b5d94a', '#f3f08c'],
    paint: (x, y, l) => (l === 3 && AVOCADO_SPECKS.has(`${x},${y}`) && inCircles(AVOCADO_BODY, x, y, 3.5) ? '#dcd768' : null),
    behind: () => sprite(SPROUT, 11, 0, LEAF_COLORS),
    face: { ey: 12, cy: 16, my: 16, cheek: '#ff8fa3' },
    pit: pit('#3a1c0f', '#5a2d18', '#74401f', '#f2a03d'),
  },
  {
    name: 'ORANGE',
    body: ROUND,
    layers: ['#7a3a0e', '#e8731a', '#f59a2f', '#ffb64a'],
    paint: (x, y, l) => (l >= 2 && hash(x, y) < 6 ? '#f08a22' : null),
    front: () => sprite(STEM_LEAF, 17, 8, LEAF_COLORS),
    face: FOOD_FACE,
    pit: pit('#40160a', '#5e2610', '#7c3a1a', '#9be564'),
  },
  {
    name: 'STRAWBERRY',
    body: swept(18, 21, 32, 14, 11.5),
    layers: ['#5c0f1f', '#c81e3c', '#e8455f', '#f2566e'],
    paint: (x, y, l) => (l >= 2 && y % 3 === 1 && (x + (y % 2) * 2) % 4 === 0 ? '#ffe08a' : null),
    front: () => sprite(STRAWBERRY_CAP, 8, 5, LEAF_COLORS),
    face: { ey: 14, cy: 18, my: 18, cheek: '#ffd0d8' },
    pit: pit('#3a0a16', '#561322', '#7a2236', '#ffe08a'),
  },
  {
    name: 'WATERMELON',
    body: ROUND,
    layers: ['#0f3a1a', '#2a7a35', '#46a64e', '#5cbf63'],
    paint: (x, y, l) => {
      const s = x + Math.round(Math.sin(y * 0.45) * 2.5);
      return l >= 1 && (((s % 8) + 8) % 8) < 3 ? (l === 3 ? '#3a9a43' : '#17501f') : null;
    },
    front: () => sprite(STEM_LEAF, 17, 8, LEAF_COLORS),
    face: FOOD_FACE,
    pit: pit('#2e0a12', '#5a1424', '#7c2a3c', '#ff7b8a'),
  },
  {
    name: 'TABBY CAT',
    body: ROUND,
    layers: ['#6b3410', '#d9822b', '#eb9a3d', '#f6b560'],
    paint: (x, y, l) => {
      if (l >= 2 && y >= 13 && y <= 15 && (x === 15 || x === 21 || (x === 18 && y <= 15))) return '#b3651a';
      if (l >= 1 && (x < 7 || x > 28) && y % 4 === 0) return '#b3651a';
      return null;
    },
    front: catEars('#6b3410', '#d9822b', '#ff9fb0'),
    face: { ey: 16, my: 19, cat: true, nose: '#ff8fa3', whisker: '#6b3410' },
    pit: pit('#3a1c0f', '#5a2d18', '#74401f', '#f6d56b'),
  },
  {
    name: 'BLACK CAT',
    body: ROUND,
    layers: ['#05050b', '#23233a', '#31314d', '#3c3c5c'],
    front: catEars('#05050b', '#23233a', '#7a4a6a'),
    face: { ey: 16, my: 19, cat: true, nose: '#ff8fa3', whisker: '#c8c8e0', eyeColor: '#ffd23f', slit: true },
    pit: pit('#120d22', '#241c3a', '#3a2d5a', '#ffd23f'),
  },
  {
    name: 'EARTH',
    body: ROUND,
    layers: ['#0b1e4a', '#1f5fbf', '#2f7fe0', '#3b8ff0'],
    paint: (x, y, l) => {
      if (l >= 2 && inCircles(EARTH_LAND, x, y, 0)) return '#43b04a';
      if (l >= 2 && hash(x, y) < 4) return '#ffffff';
      return null;
    },
    face: FOOD_FACE,
    pit: pit('#070a1e', '#0f1330', '#2a3166', '#7fd1ff'),
  },
  {
    name: 'MARS',
    body: ROUND,
    layers: ['#3a1005', '#a63a1c', '#c4552e', '#d9703f'],
    paint: (x, y, l) => (l >= 2 && inCircles(MARS_CRATERS, x, y, 0) ? '#a63a1c' : null),
    face: FOOD_FACE,
    pit: pit('#1c0a08', '#2e1410', '#4a2418', '#ffcf6b'),
  },
  {
    name: 'MOON',
    body: ROUND,
    layers: ['#25252f', '#8a8a9c', '#a6a6b8', '#c2c2d2'],
    paint: (x, y, l) => (l >= 2 && inCircles(MOON_CRATERS, x, y, 0) ? '#9a9aac' : null),
    face: { ey: 16, cy: 20, my: 20, cheek: '#d9a0b4' },
    pit: pit('#0a0c1c', '#14172e', '#2a3060', '#ffffff'),
  },
  {
    name: 'SATURN',
    body: [[18, 29.5, 14]],
    layers: ['#4a3510', '#c9a24a', '#e0bd6a', '#f0d68a'],
    paint: (x, y, l) => (l >= 2 && y % 6 < 2 ? '#d4a94f' : null),
    behind: () => saturnRing((x, y, o) => cell(x, y, o > 0.85 ? '#7a5418' : '#f5dc94')),
    front: () => saturnRing((x, y, o, dy) => { if (dy > 0) cell(x, y, o > 0.85 ? '#7a5418' : '#f5dc94'); }),
    face: { ey: 17, cy: 20, my: 20, cheek: '#ff9bb0' },
    pit: pit('#120c05', '#2a1d0a', '#4a3516', '#ffe08a'),
  },
];

/* ---------- rendering ---------- */

// Shading level per cell (0 = outline … 3 = innermost, -1 = outside), cached per skin.
function levels(skin) {
  if (skin._levels) return skin._levels;
  const lv = new Int8Array(GRID_W * GRID_H).fill(-1);
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      for (let l = 3; l >= 0; l--) {
        if (inCircles(skin.body, x, y, l)) { lv[y * GRID_W + x] = l; break; }
      }
    }
  }
  skin._levels = lv;
  return lv;
}

function drawPit(p, progress) {
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const dx = x + 0.5 - PIT.x;
      const dy = y + 0.5 - PIT.y;
      const d = Math.hypot(dx, dy);
      if (d > PIT.r) continue;
      let color = p.fill;
      if (d > PIT.r - 1.2) {
        let angle = Math.atan2(dx, -dy); // 0 at top, clockwise
        if (angle < 0) angle += Math.PI * 2;
        color = angle < progress * Math.PI * 2 ? p.progress : p.ring;
      } else if (d > PIT.r - 2.6 && dx < -2 && dy < -2) {
        color = p.shine;
      }
      cell(x, y, color);
    }
  }
}

function drawEye(x, y, look, f) {
  const c = f.eyeColor || '#1d2340';
  if (look === 'blink') {
    for (let i = 0; i < 3; i++) cell(x + i, y + 2, c);
  } else if (look === 'happy') {
    cell(x, y + 2, c);
    cell(x + 1, y + 1, c);
    cell(x + 2, y + 2, c);
  } else {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cell(x + i, y + j, c);
    if (f.slit) for (let j = 0; j < 3; j++) cell(x + 1, y + j, '#0a0a12');
    else cell(x, y, '#ffffff');
  }
}

function drawFace(f, look) {
  drawEye(12, f.ey, look, f);
  drawEye(21, f.ey, look, f);

  if (f.cheek) {
    for (const cx of [10, 24]) {
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) cell(cx + i, f.cy + j, f.cheek);
    }
  }

  const line = '#1d2340';
  if (f.cat) {
    cell(17, f.my, f.nose);
    cell(18, f.my, f.nose);
    const m = f.my + 1;
    if (look === 'happy') {
      cell(16, m, line); cell(17, m + 1, line); cell(18, m + 1, line); cell(19, m, line);
    } else {
      cell(16, m, line); cell(19, m, line);
    }
    for (let i = 0; i < 3; i++) {
      for (const wy of [f.my, f.my + 2]) {
        cell(4 + i, wy, f.whisker);
        cell(29 + i, wy, f.whisker);
      }
    }
  } else if (look === 'happy') {
    cell(16, f.my, line); cell(17, f.my + 1, line); cell(18, f.my + 1, line); cell(19, f.my, line);
  } else {
    cell(17, f.my, line); cell(18, f.my, line);
  }
}

function drawSprite(index, progress, look) {
  const skin = SKINS[index];
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (skin.behind) skin.behind();

  const lv = levels(skin);
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const l = lv[y * GRID_W + x];
      if (l < 0) continue;
      let color = skin.layers[l];
      if (skin.paint) color = skin.paint(x, y, l) || color;
      cell(x, y, color);
    }
  }

  if (skin.front) skin.front();
  drawPit(skin.pit, progress);
  drawFace(skin.face, look);
}
