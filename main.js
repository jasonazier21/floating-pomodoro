const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 272,
    height: 356,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    alwaysOnTop: true,
    title: 'Avocado Pomodoro',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Keep the countdown accurate while the window is hidden or minimized.
      backgroundThrottling: false,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

const BASE_W = 272;
const BASE_H = 356;
const MIN_W = 136;
const MAX_W = 816;

// Resizing is driven by the in-app corner grip (transparent frameless windows
// can't be resized from their edges on Windows). The aspect ratio is kept.
ipcMain.on('window:resize', (_e, width) => {
  if (!win || win.isDestroyed() || !Number.isFinite(width)) return;
  const w = Math.round(Math.min(MAX_W, Math.max(MIN_W, width)));
  const h = Math.round((w * BASE_H) / BASE_W);
  const b = win.getBounds();
  win.setBounds({ x: b.x, y: b.y, width: w, height: h });
});

ipcMain.on('window:close', () => win && win.close());
ipcMain.on('window:minimize', () => win && win.minimize());
ipcMain.handle('window:toggle-pin', () => {
  if (!win) return false;
  const next = !win.isAlwaysOnTop();
  win.setAlwaysOnTop(next);
  return next;
});
ipcMain.on('window:attention', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.showInactive();
  win.flashFrame(true);
  setTimeout(() => win && !win.isDestroyed() && win.flashFrame(false), 3000);
});

app.setAppUserModelId('com.avocado.pomodoro');

app.whenReady().then(createWindow);

app.on('window-all-closed', () => app.quit());
