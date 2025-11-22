const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const api = require('./api');

let mainWindow;
let welcomeWindow;
let authWindow;
let currentUser = null;

function createWelcomeWindow() {
  welcomeWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  welcomeWindow.loadFile('src/welcome.html');
}

function createAuthWindow() {
  authWindow = new BrowserWindow({
    width: 500,
    height: 650,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  authWindow.loadFile('src/auth.html');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#1a1a2e',
    show: false,
    title: 'VoidHub',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('src/index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(async () => {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  const sessionPath = path.join(app.getPath('userData'), 'session.json');
  
  let config = { firstRun: true };
  
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  
  // Проверяем сохраненную сессию
  if (fs.existsSync(sessionPath)) {
    try {
      const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      
      if (session.guest) {
        currentUser = { username: 'Guest', email: null, id: null };
        createWindow();
        return;
      }
      
      if (session.userId) {
        currentUser = await api.getUser(session.userId);
        
        if (currentUser) {
          createWindow();
          return;
        }
      }
    } catch (error) {
      console.error('Session restore failed:', error);
      fs.unlinkSync(sessionPath);
    }
  }
  
  if (config.firstRun) {
    createWelcomeWindow();
    config.firstRun = false;
    fs.writeFileSync(configPath, JSON.stringify(config));
  } else {
    createAuthWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Управление окном
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

// Установка игры через exe-инсталлятор
ipcMain.on('install-game', (event, game) => {
  const { exec } = require('child_process');
  const installerPath = path.join(__dirname, '..', 'installers', `${game.id}_Setup.exe`);
  
  event.reply('install-progress', { gameId: game.id, progress: 0 });
  
  // Проверяем наличие инсталлятора
  if (fs.existsSync(installerPath)) {
    // Запускаем exe-инсталлятор
    exec(`"${installerPath}" /S`, (error) => {
      if (error) {
        console.error('Ошибка установки:', error);
        return;
      }
      event.reply('install-complete', { gameId: game.id });
    });
    
    // Симуляция прогресса
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      event.reply('install-progress', { gameId: game.id, progress });
      if (progress >= 100) clearInterval(interval);
    }, 500);
  } else {
    // Если инсталлятора нет, симулируем загрузку
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      event.reply('install-progress', { gameId: game.id, progress });
      
      if (progress >= 100) {
        clearInterval(interval);
        event.reply('install-complete', { gameId: game.id });
      }
    }, 500);
  }
});

ipcMain.on('launch-game', (event, gameId) => {
  console.log(`Запуск игры: ${gameId}`);
  event.reply('game-launched', gameId);
});

// Завершение приветствия
ipcMain.on('welcome-complete', () => {
  if (welcomeWindow) {
    welcomeWindow.close();
    welcomeWindow = null;
  }
  createAuthWindow();
});

// Авторизация
ipcMain.on('auth-login', async (event, credentials) => {
  try {
    const result = await api.login(credentials.username, credentials.password);
    if (result.success) {
      currentUser = result.user;
      
      // Сохраняем сессию
      const sessionPath = path.join(app.getPath('userData'), 'session.json');
      fs.writeFileSync(sessionPath, JSON.stringify({ userId: currentUser.id }));
      
      event.reply('auth-success', currentUser);
    }
  } catch (error) {
    event.reply('auth-error', error.message);
  }
});

// Регистрация
ipcMain.on('auth-register', async (event, userData) => {
  try {
    await api.register(userData.username, userData.email, userData.password);
    event.reply('register-success');
  } catch (error) {
    event.reply('register-error', error.message);
  }
});

// Пропустить авторизацию
ipcMain.on('auth-skip', () => {
  currentUser = { username: 'Guest', email: null, id: null };
  
  // Сохраняем гостевую сессию
  const sessionPath = path.join(app.getPath('userData'), 'session.json');
  fs.writeFileSync(sessionPath, JSON.stringify({ guest: true }));
  
  if (authWindow) {
    authWindow.close();
    authWindow = null;
  }
  createWindow();
});

// Завершение авторизации
ipcMain.on('auth-complete', (event, user) => {
  currentUser = user;
  
  // Сохраняем сессию
  const sessionPath = path.join(app.getPath('userData'), 'session.json');
  fs.writeFileSync(sessionPath, JSON.stringify({ userId: user.id }));
  
  if (authWindow) {
    authWindow.close();
    authWindow = null;
  }
  createWindow();
});

// Выход из аккаунта
ipcMain.on('logout', () => {
  currentUser = null;
  const sessionPath = path.join(app.getPath('userData'), 'session.json');
  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
  }
  
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  
  createAuthWindow();
});

// Загрузка игры пользователем
ipcMain.on('upload-game', (event, gameData) => {
  if (!currentUser || currentUser.username === 'Guest') {
    event.reply('upload-error', 'Войдите в аккаунт для загрузки игр');
    return;
  }

  const { dialog } = require('electron');
  
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Выберите папку с игрой'
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const gamePath = result.filePaths[0];
      const gamesDbPath = path.join(app.getPath('userData'), 'games-db.json');
      
      let gamesDb = [];
      if (fs.existsSync(gamesDbPath)) {
        gamesDb = JSON.parse(fs.readFileSync(gamesDbPath, 'utf8'));
      }
      
      const newGame = {
        id: `game_${Date.now()}`,
        title: gameData.title,
        size: gameData.size,
        icon: gameData.icon,
        path: gamePath,
        uploadedBy: currentUser.username,
        uploadDate: new Date().toISOString()
      };
      
      gamesDb.push(newGame);
      fs.writeFileSync(gamesDbPath, JSON.stringify(gamesDb, null, 2));
      
      event.reply('game-uploaded', newGame);
    }
  });
});

// Получить текущего пользователя
ipcMain.on('get-current-user', async (event) => {
  if (currentUser && currentUser.id) {
    try {
      currentUser = await api.getUser(currentUser.id);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }
  event.reply('current-user', currentUser);
});

// Получить магазин
ipcMain.on('get-shop', async (event) => {
  try {
    const items = await api.getShop();
    const userItems = currentUser && currentUser.id ? await api.getUserItems(currentUser.id) : [];
    event.reply('shop-data', { items, userItems });
  } catch (error) {
    event.reply('shop-error', error.message);
  }
});

// Купить предмет
ipcMain.on('buy-item', async (event, itemId) => {
  if (!currentUser || !currentUser.id) {
    event.reply('buy-error', 'Войдите в аккаунт');
    return;
  }

  try {
    const result = await api.buyItem(currentUser.id, itemId);
    if (result.success) {
      currentUser = await api.getUser(currentUser.id);
      event.reply('buy-success', result.item);
      event.reply('current-user', currentUser);
    }
  } catch (error) {
    event.reply('buy-error', error.message);
  }
});

// Применить кастомизацию
ipcMain.on('apply-customization', async (event, data) => {
  if (!currentUser || !currentUser.id) return;
  
  try {
    const result = await api.updateCustomization(currentUser.id, data.field, data.value);
    currentUser = result.user;
    event.reply('current-user', currentUser);
  } catch (error) {
    console.error('Error applying customization:', error);
  }
});

// Получить список всех игр
ipcMain.on('get-games', (event) => {
  const gamesDbPath = path.join(app.getPath('userData'), 'games-db.json');
  let gamesDb = [];
  
  if (fs.existsSync(gamesDbPath)) {
    gamesDb = JSON.parse(fs.readFileSync(gamesDbPath, 'utf8'));
  }
  
  event.reply('games-list', gamesDb);
});
