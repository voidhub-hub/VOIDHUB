const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'gameplatform.db');
  db = new Database(dbPath);

  // Таблица пользователей
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 100,
      avatar TEXT DEFAULT '🎮',
      avatar_frame TEXT DEFAULT 'default',
      profile_bg TEXT DEFAULT 'default',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица игр
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      size TEXT NOT NULL,
      icon TEXT DEFAULT '🎮',
      path TEXT,
      uploaded_by TEXT NOT NULL,
      downloads INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица активности (для начисления XP)
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      xp_earned INTEGER DEFAULT 0,
      coins_earned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Таблица покупок в магазине
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      data TEXT NOT NULL
    )
  `);

  // Таблица купленных предметов
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (item_id) REFERENCES shop_items(id)
    )
  `);

  // Таблица избранного
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (game_id) REFERENCES games(id)
    )
  `);

  // Таблица истории скачиваний
  db.exec(`
    CREATE TABLE IF NOT EXISTS download_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (game_id) REFERENCES games(id)
    )
  `);

  // Таблица настроек пользователя
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      theme TEXT DEFAULT 'dark',
      notifications_enabled INTEGER DEFAULT 1,
      auto_update INTEGER DEFAULT 1,
      download_path TEXT,
      language TEXT DEFAULT 'ru',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Таблица уведомлений
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Добавляем предметы в магазин если их нет
  const itemsCount = db.prepare('SELECT COUNT(*) as count FROM shop_items').get();
  if (itemsCount.count === 0) {
    const insertItem = db.prepare('INSERT INTO shop_items (type, name, price, data) VALUES (?, ?, ?, ?)');
    
    // Рамки для аватара
    insertItem.run('frame', 'Золотая рамка', 500, 'gold');
    insertItem.run('frame', 'Алмазная рамка', 1000, 'diamond');
    insertItem.run('frame', 'Радужная рамка', 1500, 'rainbow');
    insertItem.run('frame', 'Огненная рамка', 2000, 'fire');
    
    // Фоны профиля
    insertItem.run('background', 'Космос', 300, 'space');
    insertItem.run('background', 'Неон', 400, 'neon');
    insertItem.run('background', 'Киберпанк', 600, 'cyberpunk');
    insertItem.run('background', 'Природа', 250, 'nature');
  }

  return db;
}

function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db;
}

// Функции для работы с пользователями
function createUser(username, email, password) {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
  return stmt.run(username, email, password);
}

function getUserByUsername(username) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
}

function getUserById(id) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function addXP(userId, amount, action) {
  const db = getDatabase();
  const user = getUserById(userId);
  
  const newXP = user.xp + amount;
  const xpForNextLevel = user.level * 100;
  let newLevel = user.level;
  let finalXP = newXP;
  
  if (newXP >= xpForNextLevel) {
    newLevel++;
    finalXP = newXP - xpForNextLevel;
  }
  
  db.prepare('UPDATE users SET xp = ?, level = ? WHERE id = ?').run(finalXP, newLevel, userId);
  db.prepare('INSERT INTO activity (user_id, action, xp_earned) VALUES (?, ?, ?)').run(userId, action, amount);
  
  return { level: newLevel, xp: finalXP };
}

function addCoins(userId, amount, action) {
  const db = getDatabase();
  const user = getUserById(userId);
  const newCoins = user.coins + amount;
  
  db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(newCoins, userId);
  db.prepare('INSERT INTO activity (user_id, action, coins_earned) VALUES (?, ?, ?)').run(userId, action, amount);
  
  return newCoins;
}

function purchaseItem(userId, itemId) {
  const db = getDatabase();
  const user = getUserById(userId);
  const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(itemId);
  
  if (!item) return { success: false, message: 'Предмет не найден' };
  if (user.coins < item.price) return { success: false, message: 'Недостаточно монет' };
  
  // Проверяем, не куплен ли уже
  const owned = db.prepare('SELECT * FROM user_items WHERE user_id = ? AND item_id = ?').get(userId, itemId);
  if (owned) return { success: false, message: 'Уже куплено' };
  
  db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(user.coins - item.price, userId);
  db.prepare('INSERT INTO user_items (user_id, item_id) VALUES (?, ?)').run(userId, itemId);
  
  return { success: true, item };
}

function getUserItems(userId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT shop_items.* FROM user_items 
    JOIN shop_items ON user_items.item_id = shop_items.id 
    WHERE user_items.user_id = ?
  `).all(userId);
}

function getShopItems() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM shop_items').all();
}

function updateUserCustomization(userId, field, value) {
  const db = getDatabase();
  const validFields = ['avatar', 'avatar_frame', 'profile_bg'];
  if (!validFields.includes(field)) return false;
  
  db.prepare(`UPDATE users SET ${field} = ? WHERE id = ?`).run(value, userId);
  return true;
}

// Избранное
function addToFavorites(userId, gameId) {
  const db = getDatabase();
  const exists = db.prepare('SELECT * FROM favorites WHERE user_id = ? AND game_id = ?').get(userId, gameId);
  if (exists) return false;
  db.prepare('INSERT INTO favorites (user_id, game_id) VALUES (?, ?)').run(userId, gameId);
  return true;
}

function removeFromFavorites(userId, gameId) {
  const db = getDatabase();
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND game_id = ?').run(userId, gameId);
  return true;
}

function getFavorites(userId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT games.* FROM favorites 
    JOIN games ON favorites.game_id = games.id 
    WHERE favorites.user_id = ?
    ORDER BY favorites.added_at DESC
  `).all(userId);
}

// История скачиваний
function addToDownloadHistory(userId, gameId) {
  const db = getDatabase();
  db.prepare('INSERT INTO download_history (user_id, game_id) VALUES (?, ?)').run(userId, gameId);
  db.prepare('UPDATE games SET downloads = downloads + 1 WHERE id = ?').run(gameId);
  return true;
}

function getDownloadHistory(userId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT games.*, download_history.downloaded_at 
    FROM download_history 
    JOIN games ON download_history.game_id = games.id 
    WHERE download_history.user_id = ?
    ORDER BY download_history.downloaded_at DESC
  `).all(userId);
}

// Настройки
function getUserSettings(userId) {
  const db = getDatabase();
  let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
  if (!settings) {
    db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);
    settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
  }
  return settings;
}

function updateUserSettings(userId, settings) {
  const db = getDatabase();
  const fields = Object.keys(settings).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(settings), userId];
  db.prepare(`UPDATE user_settings SET ${fields} WHERE user_id = ?`).run(...values);
  return true;
}

// Уведомления
function createNotification(userId, title, message, type = 'info') {
  const db = getDatabase();
  db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(userId, title, message, type);
  return true;
}

function getNotifications(userId, unreadOnly = false) {
  const db = getDatabase();
  const query = unreadOnly 
    ? 'SELECT * FROM notifications WHERE user_id = ? AND read = 0 ORDER BY created_at DESC'
    : 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50';
  return db.prepare(query).all(userId);
}

function markNotificationRead(notificationId) {
  const db = getDatabase();
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(notificationId);
  return true;
}

function markAllNotificationsRead(userId) {
  const db = getDatabase();
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
  return true;
}

// Статистика
function getUserStats(userId) {
  const db = getDatabase();
  const user = getUserById(userId);
  const gamesUploaded = db.prepare('SELECT COUNT(*) as count FROM games WHERE uploaded_by = ?').get(user.username);
  const gamesDownloaded = db.prepare('SELECT COUNT(*) as count FROM download_history WHERE user_id = ?').get(userId);
  const totalXP = db.prepare('SELECT SUM(xp_earned) as total FROM activity WHERE user_id = ?').get(userId);
  const totalCoinsEarned = db.prepare('SELECT SUM(coins_earned) as total FROM activity WHERE user_id = ?').get(userId);
  const favoritesCount = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?').get(userId);
  
  return {
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    gamesUploaded: gamesUploaded.count,
    gamesDownloaded: gamesDownloaded.count,
    totalXPEarned: totalXP.total || 0,
    totalCoinsEarned: totalCoinsEarned.total || 0,
    favoritesCount: favoritesCount.count
  };
}

module.exports = {
  initDatabase,
  getDatabase,
  createUser,
  getUserByUsername,
  getUserById,
  addXP,
  addCoins,
  purchaseItem,
  getUserItems,
  getShopItems,
  updateUserCustomization,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  addToDownloadHistory,
  getDownloadHistory,
  getUserSettings,
  updateUserSettings,
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUserStats
};
