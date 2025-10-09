import { app, BrowserWindow, Menu, dialog, powerMonitor } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log/main';
import path from 'node:path';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import started from 'electron-squirrel-startup';
import dns from 'node:dns';
import {
  initializeDatabase,
  getDatabase
} from './database';
import { setupIpcHandlers } from './ipc-handlers';
import { isDev } from './utils/environment';

// Configure logging for auto-updater
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Vite plugin injects these at build time; declare for TypeScript
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Do NOT quit on --squirrel-firstrun so the app actually launches after an update.
if (started && process.platform === 'win32') {
  const isFirstRun = process.argv.includes('--squirrel-firstrun');
  if (!isFirstRun) {
    app.quit();
  }
}

const createWindow = () => {
  // Create the browser window.
  // Resolve an icon path for Windows/Linux (dev and packaged)
  let iconPath: string | undefined;
  try {
    const candidates = [
      // Packaged locations
      path.join(process.resourcesPath, 'logo.ico'),
      path.join(process.resourcesPath, 'assets', 'logo.ico'),
      // Dev locations
      path.join(__dirname, '..', '..', 'assets', 'logo.ico'),
      path.join(process.cwd(), 'assets', 'logo.ico'),
    ];
    iconPath = candidates.find(p => existsSync(p));
  } catch {
    // ignore
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false, // Don't show until ready
    titleBarStyle: 'default',
    // Use a custom icon if resolved
    ...(iconPath ? { icon: iconPath } : {}),
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Ensure window is focused and brought to front
    mainWindow.focus();
    mainWindow.moveTop();
  });

  // Handle window focus events
  mainWindow.on('focus', () => {
    // Send focus event to renderer
    mainWindow.webContents.send('window-focused');
  });

  mainWindow.on('blur', () => {
    // Send blur event to renderer
    mainWindow.webContents.send('window-blurred');
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Only open DevTools in development
  if (isDev()) {
    mainWindow.webContents.openDevTools();
  }

  // Set up application menu
  setupApplicationMenu();

  return mainWindow;
};

// Seed medications from bundled CSV on first launch (or when version changes)
function seedMedicationsIfNeeded() {
  const db = getDatabase();

  // Ensure metadata table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Ensure helpful indexes exist
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_medications_generic ON medications(genericName);
    CREATE UNIQUE INDEX IF NOT EXISTS uidx_medications_name_generic ON medications(name, genericName);
  `);

  const SEED_KEY = 'medications_seed_version';
  const SEED_VERSION = 'v2';
  const getMeta = db.prepare('SELECT value FROM app_metadata WHERE key = ?');
  const current = getMeta.get(SEED_KEY) as { value: string } | undefined;
  if (current?.value === SEED_VERSION) {
    return; // already seeded with this version
  }

  // Locate CSV in production or development
  const candidates: string[] = [
    path.join(__dirname, 'database', 'meds_1.csv'),
    path.join(process.resourcesPath, 'database', 'meds_1.csv'),
    path.join(process.resourcesPath, 'meds_1.csv'),
    path.join(process.cwd(), 'src', 'database', 'meds_1.csv'),
  ];
  const csvPath = candidates.find(p => existsSync(p));
  if (!csvPath) {
    return; // csv not found; skip seeding
  }

  const raw = readFileSync(csvPath, 'utf8');

  const splitCsvLines = (input: string): string[] => {
    const rows: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];

      if (ch === '"') {
        if (inQuotes && input[i + 1] === '"') {
          current += ch;
          current += input[i + 1];
          i++;
        } else {
          inQuotes = !inQuotes;
          current += ch;
        }
        continue;
      }

      if (ch === '\r') {
        continue;
      }

      if (ch === '\n') {
        if (inQuotes) {
          current += ch;
        } else {
          rows.push(current);
          current = '';
        }
        continue;
      }

      current += ch;
    }

    if (current.trim().length > 0) {
      rows.push(current);
    }

    return rows.filter(row => row.trim().length > 0);
  };

  const lines = splitCsvLines(raw);
  if (lines.length <= 1) return;
  
  // Light-weight CSV parser that handles quoted commas
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { // escaped quote
          cur += '"'; i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };

  // Determine header and column indices
  const headerCells = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  const hasHeader = headerCells.some(h => h.includes('generic') || h.includes('trade'));
  const rowsStart = hasHeader ? 1 : 0;

  const idxGeneric = hasHeader ? headerCells.findIndex(h => h.includes('generic')) : 0;
  const idxTrade = hasHeader ? headerCells.findIndex(h => h.includes('trade')) : 1;
  const idxLevel = hasHeader ? headerCells.findIndex(h => h.includes('prescrib')) : -1;
  const idxPreAuth = hasHeader ? headerCells.findIndex(h => h.includes('pre-authorization') || h.includes('pre_authorization') || h.includes('protocol')) : -1;

  const insert = db.prepare('INSERT OR REPLACE INTO medications (name, genericName, prescribingLevel, preAuthorizationProtocol) VALUES (?, ?, ?, ?)');
  const tx = db.transaction((rows: Array<{ generic: string; trade: string; level?: string; preAuth?: string }>) => {
    for (const r of rows) {
      const name = (r.trade || '').trim();
      const genericName = (r.generic || '').trim();
      const level = (r.level || '').trim() || null;
      const preAuth = (r.preAuth || '').trim() || null;
      if (name.length === 0) continue;
      insert.run(name, genericName || null, level, preAuth);
    }
  });

  const rows: Array<{ generic: string; trade: string; level?: string; preAuth?: string }> = [];
  for (let i = rowsStart; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 2) continue;
    const generic = cells[idxGeneric >= 0 ? idxGeneric : 0] || '';
    const trade = cells[idxTrade >= 0 ? idxTrade : 1] || '';
    const level = idxLevel >= 0 ? cells[idxLevel] || '' : '';
    const preAuth = idxPreAuth >= 0 ? cells[idxPreAuth] || '' : '';
    rows.push({ generic, trade, level, preAuth });
  }

  // In-memory dedupe (case-insensitive)
  const seen = new Set<string>();
  const uniqueRows = rows.filter(r => {
    const key = `${(r.trade || '').toLowerCase()}||${(r.generic || '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  tx(uniqueRows);

  // Persist seed version
  const upsert = db.prepare(`INSERT INTO app_metadata(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`);
  upsert.run(SEED_KEY, SEED_VERSION);
}

// Seed procedure codes from bundled CSV on first launch (or when version changes)
function seedProcedureCodesIfNeeded() {
  const db = getDatabase();

  // Ensure metadata table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  const SEED_KEY = 'procedure_codes_seed_version';
  const SEED_VERSION = 'v1';
  const getMeta = db.prepare('SELECT value FROM app_metadata WHERE key = ?');
  const current = getMeta.get(SEED_KEY) as { value: string } | undefined;
  if (current?.value === SEED_VERSION) {
    return; // already seeded with this version
  }

  // Locate CSV in production or development
  const candidates: string[] = [
    path.join(__dirname, 'database', 'procedure-codes.csv'),
    path.join(process.resourcesPath, 'database', 'procedure-codes.csv'),
    path.join(process.resourcesPath, 'procedure-codes.csv'),
    path.join(process.cwd(), 'src', 'database', 'procedure-codes.csv'),
  ];
  const csvPath = candidates.find(p => existsSync(p));
  if (!csvPath) {
    log.info('Procedure codes CSV not found; skipping seeding');
    return; // csv not found; skip seeding
  }

  const raw = readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return;
  
  // Light-weight CSV parser that handles quoted commas
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { // escaped quote
          cur += '"'; i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };

  // Determine header and column indices
  const headerCells = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  const hasHeader = headerCells.some(h => h.includes('uhia') || h.includes('ar_name') || h.includes('en_name'));
  const rowsStart = hasHeader ? 1 : 0;

  const idxUhiaCode = hasHeader ? headerCells.findIndex(h => h.includes('uhia')) : 0;
  const idxArName = hasHeader ? headerCells.findIndex(h => h.includes('ar_name')) : 1;
  const idxEnName = hasHeader ? headerCells.findIndex(h => h.includes('en_name')) : 2;
  const idxCategory = hasHeader ? headerCells.findIndex(h => h.includes('category')) : 3;

  const insert = db.prepare('INSERT OR REPLACE INTO procedure_codes (uhia_code, ar_name, en_name, category) VALUES (?, ?, ?, ?)');
  const tx = db.transaction((rows: Array<{ uhiaCode: string; arName: string; enName: string; category?: string }>) => {
    for (const r of rows) {
      const uhiaCode = (r.uhiaCode || '').trim();
      const arName = (r.arName || '').trim();
      const enName = (r.enName || '').trim();
      const category = (r.category || '').trim() || null;
      if (uhiaCode.length === 0 || arName.length === 0 || enName.length === 0) {
        continue;
      }
      insert.run(uhiaCode, arName, enName, category);
    }
  });

  const rows: Array<{ uhiaCode: string; arName: string; enName: string; category?: string }> = [];
  for (let i = rowsStart; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 2) continue;
    const uhiaCode = cells[idxUhiaCode >= 0 ? idxUhiaCode : 0] || '';
    const arName = cells[idxArName >= 0 ? idxArName : 1] || '';
    const enName = cells[idxEnName >= 0 ? idxEnName : 2] || '';
    const category = idxCategory >= 0 ? cells[idxCategory] || '' : '';
    rows.push({ uhiaCode, arName, enName, category });
  }

  // In-memory dedupe (case-insensitive by uhia_code)
  const seen = new Set<string>();
  const uniqueRows = rows.filter(r => {
    const key = (r.uhiaCode || '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  tx(uniqueRows);

  log.info(`Seeded ${uniqueRows.length} procedure codes`);

  // Persist seed version
  const upsertMeta = db.prepare(`INSERT INTO app_metadata(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`);
  upsertMeta.run(SEED_KEY, SEED_VERSION);
}

// Set up application menu
function setupApplicationMenu() {
  const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            BrowserWindow.getFocusedWindow()?.reload();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(BrowserWindow.getFocusedWindow()!, {
              type: 'info',
              title: 'About SCU Clinics',
              message: 'SCU Clinics',
              detail: `Version ${app.getVersion()}\n\nA clinic management system for prescription management.`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Configure auto-updater
function setupAutoUpdater() {
  // Don't check for updates in development
  if (isDev()) {
    log.info('Auto-updater disabled in development mode');
    return;
  }

  // For private repositories, set GitHub token
  // NOTE: Only needed if repository is private
  // If repository is public, comment out or remove this line
  // autoUpdater.setFeedURL({
  //   provider: 'github',
  //   owner: 'scuht2025',
  //   repo: 'scu-clinics',
  //   token: process.env.GH_TOKEN // Set this as environment variable
  // });

  // Configure auto-updater behavior
  // Don't auto-download; let the renderer explicitly trigger download to avoid double flows
  autoUpdater.autoDownload = false;
  // Install on quit after a successful download (also handled by explicit quitAndInstall)
  autoUpdater.autoInstallOnAppQuit = true;
  // Prefer full installer (avoid web installer) and skip differential to reduce 404 noise on blockmaps
  try {
    (autoUpdater as any).disableWebInstaller = true;
    (autoUpdater as any).disableDifferentialDownload = true;
  } catch {}

  // Persist and resume interrupted downloads
  const resumeFlagPath = path.join(app.getPath('userData'), 'update-resume.json');
  let isDownloading = false;
  let lastProgress = 0;
  let retryTimer: NodeJS.Timeout | null = null;

  const clearRetryTimer = () => {
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
  };

  const scheduleRetryOnReconnect = () => {
    if (retryTimer) return;
    retryTimer = setInterval(() => {
      dns.lookup('github.com', (err) => {
        if (!err) {
          clearRetryTimer();
          if (isDownloading || lastProgress > 0) {
            log.info('Network restored, resuming update download');
            autoUpdater.downloadUpdate().catch(e => log.error('Resume download failed:', e));
          }
        }
      });
    }, 10000);
  };

  // Check for updates when app is ready
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
  });

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message);
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
    logMessage = `${logMessage} - Downloaded ${progressObj.percent}%`;
    logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
    log.info(logMessage);
    isDownloading = true;
    lastProgress = Math.round(progressObj.percent || 0);
    try {
      if (lastProgress > 0 && lastProgress < 100) {
        writeFileSync(resumeFlagPath, JSON.stringify({ inProgress: true, lastProgress }), 'utf-8');
      }
    } catch {}
    
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    isDownloading = false;
    lastProgress = 100;
    try { unlinkSync(resumeFlagPath); } catch {}
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });

  // Log lifecycle when quitting for update (Windows Squirrel)
  app.on('before-quit-for-update', () => {
    log.info('App is quitting to install update (before-quit-for-update)');
  });

  // Resume download after system wake if it was interrupted
  powerMonitor.on('resume', () => {
    log.info('System resumed from sleep');
    if (isDownloading || (lastProgress > 0 && lastProgress < 100)) {
      autoUpdater.downloadUpdate().catch(e => log.error('Resume after resume() failed:', e));
    }
  });

  // If previous session had an interrupted download, try to resume on startup
  try {
    const shouldResume = existsSync(resumeFlagPath);
    if (shouldResume) {
      log.info('Found interrupted update download, will attempt to resume after checking for updates');
      setTimeout(() => {
        autoUpdater.checkForUpdates().then(() => {
          autoUpdater.downloadUpdate().catch(e => log.error('Resume on startup failed:', e));
        }).catch(e => log.error('Check for updates (resume path) failed:', e));
      }, 4000);
    }
  } catch {}

  // Check for updates on startup (after 3 seconds delay)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      log.error('Failed to check for updates:', err);
    });
  }, 3000);

  // Check for updates every 6 hours
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(err => {
      log.error('Failed to check for updates:', err);
    });
  }, 6 * 60 * 60 * 1000);

  // Handle updater errors and retry on network reconnection
  autoUpdater.on('error', (err: any) => {
    log.error('Error in auto-updater:', err);
    if (isDownloading && (err?.code === 'ENOTFOUND' || err?.code === 'ETIMEDOUT' || err?.code === 'ECONNRESET' || err?.message?.toString().includes('network'))) {
      log.info('Network-related updater error detected, will retry when online');
      scheduleRetryOnReconnect();
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  try {
    // Initialize database
    initializeDatabase();

    // First-launch medications seeding
    seedMedicationsIfNeeded();

    // First-launch procedure codes seeding
    seedProcedureCodesIfNeeded();

    // Set up IPC handlers
    setupIpcHandlers();

    createWindow();

    // Set up auto-updater
    setupAutoUpdater();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
});


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
