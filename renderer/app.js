'use strict';

/* =====================================================================
   Timer  (sprites live in skins.js)
   ===================================================================== */

const MODES = {
  focus: { label: 'FOCUS', def: 25 },
  short: { label: 'BREAK', def: 5 },
  long: { label: 'LONG BREAK', def: 15 },
};
const MODE_ORDER = ['focus', 'short', 'long'];
const FOCUS_PER_ROUND = 4;

const el = {
  avocado: document.getElementById('avocado'),
  pit: document.getElementById('pit'),
  time: document.getElementById('time'),
  mode: document.getElementById('mode'),
  task: document.getElementById('task'),
  toggle: document.getElementById('toggle'),
  reset: document.getElementById('reset'),
  minus: document.getElementById('minus'),
  plus: document.getElementById('plus'),
  pin: document.getElementById('pin'),
  min: document.getElementById('min'),
  close: document.getElementById('close'),
  prevSkin: document.getElementById('prevSkin'),
  nextSkin: document.getElementById('nextSkin'),
  skinName: document.getElementById('skinName'),
  grip: document.getElementById('grip'),
};

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v == null ? fallback : v;
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

const minutes = Object.assign(
  { focus: MODES.focus.def, short: MODES.short.def, long: MODES.long.def },
  load('minutes', {})
);

const state = {
  mode: 'focus',
  running: false,
  remaining: minutes.focus * 60000,
  endAt: 0,
  focusDone: 0,
  blink: false,
};

let skinIdx = Number(load('skin', 0));
if (!Number.isInteger(skinIdx) || skinIdx < 0 || skinIdx >= SKINS.length) skinIdx = 0;

const total = () => minutes[state.mode] * 60000;
const isFresh = () => !state.running && state.remaining === total();

function remainingNow() {
  return state.running ? Math.max(0, state.endAt - Date.now()) : state.remaining;
}

function render() {
  const rem = remainingNow();
  const fresh = isFresh();

  el.time.readOnly = !fresh;
  if (fresh) {
    // don't clobber what the user is typing
    if (document.activeElement !== el.time) el.time.value = String(minutes[state.mode]);
  } else {
    const secs = Math.ceil(rem / 1000);
    el.time.value = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  }

  el.mode.textContent = fresh ? `${MODES[state.mode].label} MIN` : MODES[state.mode].label;
  el.mode.disabled = !fresh;
  el.toggle.textContent = state.running ? '❚❚ PAUSE' : fresh ? '▸ START' : '▸ RESUME';
  el.pit.classList.toggle('fresh', fresh);
  el.pit.classList.toggle('ticking', !fresh);
  el.avocado.classList.toggle('running', state.running);

  const onBreak = state.mode !== 'focus';
  const look = state.blink ? 'blink' : onBreak && state.running ? 'happy' : 'open';
  drawSprite(skinIdx, 1 - rem / total(), look);

  document.title = fresh ? 'Avocado Pomodoro' : `${el.time.value} · ${MODES[state.mode].label}`;
}

/* ---------- skins ---------- */
let skinNameTimer;
function setSkin(delta) {
  skinIdx = (skinIdx + delta + SKINS.length) % SKINS.length;
  save('skin', skinIdx);
  el.skinName.textContent = SKINS[skinIdx].name;
  el.skinName.classList.add('show');
  clearTimeout(skinNameTimer);
  skinNameTimer = setTimeout(() => el.skinName.classList.remove('show'), 1400);
  render();
}

/* ---------- timer controls ---------- */
function start() {
  if (state.running) return;
  state.endAt = Date.now() + state.remaining;
  state.running = true;
  render();
}

function pause() {
  if (!state.running) return;
  state.remaining = remainingNow();
  state.running = false;
  render();
}

function reset() {
  state.running = false;
  state.remaining = total();
  render();
}

function setMode(mode) {
  state.mode = mode;
  reset();
}

function setMinutes(n) {
  minutes[state.mode] = Math.min(120, Math.max(1, Math.round(n)));
  save('minutes', minutes);
  state.remaining = total();
  render();
}

function adjust(delta) {
  if (!isFresh()) return;
  setMinutes(minutes[state.mode] + delta);
}

// Apply whatever was typed into the time field (blank/garbage reverts).
function commitTime() {
  if (!isFresh()) return;
  const n = parseInt(el.time.value, 10);
  if (Number.isFinite(n)) setMinutes(n);
  else render();
}

function complete() {
  const finished = state.mode;
  state.running = false;

  if (finished === 'focus') {
    state.focusDone += 1;
    state.mode = state.focusDone % FOCUS_PER_ROUND === 0 ? 'long' : 'short';
  } else {
    state.mode = 'focus';
  }
  state.remaining = total();
  render();

  chime();
  el.avocado.classList.remove('done');
  void el.avocado.offsetWidth; // restart the hop animation
  el.avocado.classList.add('done');

  const task = el.task.value.trim();
  const title = finished === 'focus' ? 'Focus session done!' : 'Break is over!';
  const body = finished === 'focus'
    ? `${task ? `"${task}" — ` : ''}time for a ${minutes[state.mode]} minute break.`
    : 'Ready for another focus session?';
  try { new Notification(title, { body, silent: true }); } catch { /* notifications unavailable */ }
  if (window.desktop) window.desktop.attention();
}

/* ---------- little chiptune jingle ---------- */
let audio;
function chime() {
  try {
    audio = audio || new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const t = audio.currentTime + i * 0.14;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  } catch { /* audio unavailable */ }
}

/* ---------- wiring ---------- */
el.toggle.addEventListener('click', () => (state.running ? pause() : start()));
el.reset.addEventListener('click', reset);
el.minus.addEventListener('click', () => adjust(-1));
el.plus.addEventListener('click', () => adjust(1));
el.prevSkin.addEventListener('click', () => setSkin(-1));
el.nextSkin.addEventListener('click', () => setSkin(1));
el.mode.addEventListener('click', () => {
  if (!isFresh()) return;
  setMode(MODE_ORDER[(MODE_ORDER.indexOf(state.mode) + 1) % MODE_ORDER.length]);
});
el.pit.addEventListener('wheel', (e) => adjust(e.deltaY < 0 ? 1 : -1), { passive: true });

/* ---------- typed minutes ---------- */
el.time.addEventListener('focus', () => { if (isFresh()) el.time.select(); });
el.time.addEventListener('input', () => {
  el.time.value = el.time.value.replace(/\D/g, '').slice(0, 3);
});
el.time.addEventListener('blur', commitTime);
el.time.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') el.time.blur();
  else if (e.key === 'Escape') { el.time.value = String(minutes[state.mode]); el.time.blur(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); el.time.value = String(Math.min(120, (parseInt(el.time.value, 10) || 0) + 1)); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); el.time.value = String(Math.max(1, (parseInt(el.time.value, 10) || 2) - 1)); }
  e.stopPropagation(); // keep Space / R / arrow-skin shortcuts out of the field
});

/* ---------- resizing: grip + scale-to-fit ---------- */
const BASE_W = 272;
function applyScale() {
  document.body.style.zoom = String(window.innerWidth / BASE_W);
}
window.addEventListener('resize', () => {
  applyScale();
  save('width', window.innerWidth);
});
applyScale();

if (window.desktop) {
  let drag = null;
  el.grip.addEventListener('pointerdown', (e) => {
    drag = { x: e.screenX, w: window.innerWidth };
    el.grip.setPointerCapture(e.pointerId);
    el.grip.classList.add('dragging');
  });
  el.grip.addEventListener('pointermove', (e) => {
    if (drag) window.desktop.resize(drag.w + (e.screenX - drag.x));
  });
  const endDrag = () => { drag = null; el.grip.classList.remove('dragging'); };
  el.grip.addEventListener('pointerup', endDrag);
  el.grip.addEventListener('pointercancel', endDrag);
  el.grip.addEventListener('dblclick', () => window.desktop.resize(BASE_W));

  const savedWidth = Number(load('width', BASE_W));
  if (Number.isFinite(savedWidth) && Math.round(savedWidth) !== window.innerWidth) {
    window.desktop.resize(savedWidth);
  }
}

el.task.value = load('task', '');
el.task.addEventListener('input', () => save('task', el.task.value));
el.task.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { el.task.blur(); start(); }
  e.stopPropagation();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); state.running ? pause() : start(); }
  if (e.key === 'r' || e.key === 'R') reset();
  if (e.key === 'ArrowLeft') setSkin(-1);
  if (e.key === 'ArrowRight') setSkin(1);
});

if (window.desktop) {
  el.close.addEventListener('click', () => window.desktop.close());
  el.min.addEventListener('click', () => window.desktop.minimize());
  el.pin.addEventListener('click', async () => {
    el.pin.classList.toggle('on', await window.desktop.togglePin());
  });
}

setInterval(() => {
  if (!state.running) return;
  if (remainingNow() <= 0) complete();
  else render();
}, 250);

// blink every few seconds
(function scheduleBlink() {
  setTimeout(() => {
    state.blink = true;
    render();
    setTimeout(() => { state.blink = false; render(); scheduleBlink(); }, 160);
  }, 2500 + Math.random() * 3000);
})();

render();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
