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
  updateUserCustomization
};
