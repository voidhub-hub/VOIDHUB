const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Инициализация БД
const db = new Database(path.join(__dirname, 'gameplatform.db'));

// Создание таблиц
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

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    size TEXT NOT NULL,
    icon TEXT DEFAULT '🎮',
    download_url TEXT,
    uploaded_by TEXT NOT NULL,
    downloads INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

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

db.exec(`
  CREATE TABLE IF NOT EXISTS shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    data TEXT NOT NULL
  )
`);

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

// Добавляем предметы в магазин
const itemsCount = db.prepare('SELECT COUNT(*) as count FROM shop_items').get();
if (itemsCount.count === 0) {
  const insertItem = db.prepare('INSERT INTO shop_items (type, name, price, data) VALUES (?, ?, ?, ?)');
  insertItem.run('frame', 'Золотая рамка', 500, 'gold');
  insertItem.run('frame', 'Алмазная рамка', 1000, 'diamond');
  insertItem.run('frame', 'Радужная рамка', 1500, 'rainbow');
  insertItem.run('frame', 'Огненная рамка', 2000, 'fire');
  insertItem.run('background', 'Космос', 300, 'space');
  insertItem.run('background', 'Неон', 400, 'neon');
  insertItem.run('background', 'Киберпанк', 600, 'cyberpunk');
  insertItem.run('background', 'Природа', 250, 'nature');
}

// API Routes

// Регистрация
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(username, email, password);
    res.json({ success: true, userId: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      res.status(400).json({ success: false, message: 'Username или Email уже занят' });
    } else {
      res.status(500).json({ success: false, message: 'Ошибка регистрации' });
    }
  }
});

// Вход
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?')
    .get(username, username, password);
  
  if (user) {
    // Начисляем XP за вход
    addXP(user.id, 10, 'Вход в систему');
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    res.json({ success: true, user: updatedUser });
  } else {
    res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
  }
});

// Получить пользователя
app.get('/api/user/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'Пользователь не найден' });
  }
});

// Получить все игры
app.get('/api/games', (req, res) => {
  const games = db.prepare('SELECT * FROM games ORDER BY created_at DESC').all();
  res.json(games);
});

// Загрузить игру
app.post('/api/games', (req, res) => {
  const { title, size, icon, download_url, uploaded_by } = req.body;
  
  try {
    const stmt = db.prepare('INSERT INTO games (title, size, icon, download_url, uploaded_by) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(title, size, icon, download_url, uploaded_by);
    
    // Начисляем награду за загрузку
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(uploaded_by);
    if (user) {
      addXP(user.id, 50, `Загрузил игру: ${title}`);
      addCoins(user.id, 100, `Загрузил игру: ${title}`);
    }
    
    res.json({ success: true, gameId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Ошибка загрузки игры' });
  }
});

// Скачать игру (увеличить счетчик)
app.post('/api/games/:id/download', (req, res) => {
  const { userId } = req.body;
  
  db.prepare('UPDATE games SET downloads = downloads + 1 WHERE id = ?').run(req.params.id);
  
  if (userId) {
    addXP(userId, 5, 'Скачал игру');
  }
  
  res.json({ success: true });
});

// Получить магазин
app.get('/api/shop', (req, res) => {
  const items = db.prepare('SELECT * FROM shop_items').all();
  res.json(items);
});

// Получить купленные предметы пользователя
app.get('/api/user/:id/items', (req, res) => {
  const items = db.prepare(`
    SELECT shop_items.* FROM user_items 
    JOIN shop_items ON user_items.item_id = shop_items.id 
    WHERE user_items.user_id = ?
  `).all(req.params.id);
  res.json(items);
});

// Купить предмет
app.post('/api/shop/buy', (req, res) => {
  const { userId, itemId } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(itemId);
  
  if (!item) {
    return res.status(404).json({ success: false, message: 'Предмет не найден' });
  }
  
  if (user.coins < item.price) {
    return res.status(400).json({ success: false, message: 'Недостаточно монет' });
  }
  
  const owned = db.prepare('SELECT * FROM user_items WHERE user_id = ? AND item_id = ?').get(userId, itemId);
  if (owned) {
    return res.status(400).json({ success: false, message: 'Уже куплено' });
  }
  
  db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(user.coins - item.price, userId);
  db.prepare('INSERT INTO user_items (user_id, item_id) VALUES (?, ?)').run(userId, itemId);
  
  res.json({ success: true, item });
});

// Применить кастомизацию
app.post('/api/user/:id/customize', (req, res) => {
  const { field, value } = req.body;
  const validFields = ['avatar', 'avatar_frame', 'profile_bg'];
  
  if (!validFields.includes(field)) {
    return res.status(400).json({ success: false, message: 'Неверное поле' });
  }
  
  db.prepare(`UPDATE users SET ${field} = ? WHERE id = ?`).run(value, req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json({ success: true, user });
});

// Получить активность пользователя
app.get('/api/user/:id/activity', (req, res) => {
  const activity = db.prepare('SELECT * FROM activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 10')
    .all(req.params.id);
  res.json(activity);
});

// Вспомогательные функции
function addXP(userId, amount, action) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  const newXP = user.xp + amount;
  const xpForNextLevel = user.level * 100;
  let newLevel = user.level;
  let finalXP = newXP;
  
  if (newXP >= xpForNextLevel) {
    newLevel++;
    finalXP = newXP - xpForNextLevel;
    // Награда за новый уровень
    addCoins(userId, newLevel * 50, `Достиг уровня ${newLevel}`);
  }
  
  db.prepare('UPDATE users SET xp = ?, level = ? WHERE id = ?').run(finalXP, newLevel, userId);
  db.prepare('INSERT INTO activity (user_id, action, xp_earned) VALUES (?, ?, ?)').run(userId, action, amount);
}

function addCoins(userId, amount, action) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const newCoins = user.coins + amount;
  
  db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(newCoins, userId);
  db.prepare('INSERT INTO activity (user_id, action, coins_earned) VALUES (?, ?, ?)').run(userId, action, amount);
}

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 База данных: ${path.join(__dirname, 'gameplatform.db')}`);
});


// Статистика
app.get('/api/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalGames = db.prepare('SELECT COUNT(*) as count FROM games').get().count;
  const totalDownloads = db.prepare('SELECT SUM(downloads) as total FROM games').get().total || 0;
  
  res.json({
    totalUsers,
    totalGames,
    totalDownloads,
    onlineUsers: Math.floor(totalUsers * 0.3) // Симуляция онлайна
  });
});

// Таблица лидеров
app.get('/api/leaderboard', (req, res) => {
  const users = db.prepare('SELECT username, avatar, level, xp, coins FROM users ORDER BY level DESC, xp DESC LIMIT 10').all();
  res.json(users);
});

// Глобальная активность
app.get('/api/activity', (req, res) => {
  const activity = db.prepare(`
    SELECT activity.*, users.username 
    FROM activity 
    JOIN users ON activity.user_id = users.id 
    ORDER BY activity.created_at DESC 
    LIMIT 20
  `).all();
  res.json(activity);
});
