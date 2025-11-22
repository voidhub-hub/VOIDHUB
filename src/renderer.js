const { ipcRenderer } = require('electron');

// Управление окном
document.getElementById('minimize').addEventListener('click', () => {
  ipcRenderer.send('window-minimize');
});

document.getElementById('maximize').addEventListener('click', () => {
  ipcRenderer.send('window-maximize');
});

document.getElementById('close').addEventListener('click', () => {
  ipcRenderer.send('window-close');
});

// Навигация
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    item.classList.add('active');
    document.getElementById(page).classList.add('active');
  });
});

// Примеры игр
const games = [
  { id: 'game1', title: 'Cyberpunk Adventure', size: '45 GB', icon: '🎯', installed: false },
  { id: 'game2', title: 'Space Shooter', size: '12 GB', icon: '🚀', installed: false },
  { id: 'game3', title: 'Fantasy RPG', size: '67 GB', icon: '⚔️', installed: false },
  { id: 'game4', title: 'Racing Legends', size: '28 GB', icon: '🏎️', installed: false },
  { id: 'game5', title: 'Horror Mansion', size: '34 GB', icon: '👻', installed: false },
  { id: 'game6', title: 'Strategy Empire', size: '19 GB', icon: '🏰', installed: false }
];

let installedGames = [];
let downloadingGames = {};

function renderGames(containerId, gamesList) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  gamesList.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    const isInstalled = installedGames.includes(game.id);
    const isDownloading = downloadingGames[game.id];
    
    let buttonText = 'Установить';
    let buttonClass = '';
    
    if (isInstalled) {
      buttonText = 'Играть';
      buttonClass = 'installed';
    } else if (isDownloading) {
      buttonText = `Установка... ${isDownloading}%`;
      buttonClass = 'installing';
    }
    
    card.innerHTML = `
      <div class="game-image">${game.icon}</div>
      <div class="game-info">
        <div class="game-title">${game.title}</div>
        <div class="game-size">${game.size}</div>
        <button class="game-btn ${buttonClass}" data-game-id="${game.id}">
          ${buttonText}
        </button>
        ${isDownloading ? `
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${isDownloading}%"></div>
          </div>
        ` : ''}
      </div>
    `;
    
    const button = card.querySelector('.game-btn');
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      handleGameAction(game, isInstalled);
    });
    
    container.appendChild(card);
  });
}

function handleGameAction(game, isInstalled) {
  if (isInstalled) {
    ipcRenderer.send('launch-game', game.id);
  } else if (!downloadingGames[game.id]) {
    ipcRenderer.send('install-game', game);
  }
}

// Обработка установки
ipcRenderer.on('install-progress', (event, data) => {
  downloadingGames[data.gameId] = data.progress;
  renderGames('store-games', games);
  updateDownloadsList();
});

ipcRenderer.on('install-complete', (event, data) => {
  delete downloadingGames[data.gameId];
  installedGames.push(data.gameId);
  renderGames('store-games', games);
  renderGames('library-games', games.filter(g => installedGames.includes(g.id)));
  updateDownloadsList();
});

ipcRenderer.on('game-launched', (event, gameId) => {
  console.log(`Игра ${gameId} запущена`);
});

function updateDownloadsList() {
  const container = document.getElementById('downloads-list');
  
  if (Object.keys(downloadingGames).length === 0) {
    container.innerHTML = '<p style="color: #aaa;">Нет активных загрузок</p>';
    return;
  }
  
  container.innerHTML = '';
  Object.entries(downloadingGames).forEach(([gameId, progress]) => {
    const game = games.find(g => g.id === gameId);
    const item = document.createElement('div');
    item.className = 'download-item';
    item.innerHTML = `
      <div class="download-name">${game.title}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
      <div style="margin-top: 8px; color: #aaa;">${progress}% - ${game.size}</div>
    `;
    container.appendChild(item);
  });
}

// Получить текущего пользователя
let currentUser = null;
ipcRenderer.send('get-current-user');

ipcRenderer.on('current-user', (event, user) => {
  currentUser = user;
  updateUserInfo();
});

function updateUserInfo() {
  const userInfo = document.getElementById('user-info');
  if (currentUser) {
    userInfo.textContent = currentUser.username;
  }
}

// Меню пользователя
function toggleUserMenu() {
  const dropdown = document.getElementById('user-dropdown');
  dropdown.classList.toggle('show');
}

// Закрыть меню при клике вне его
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('user-dropdown');
  const userInfo = document.getElementById('user-info');
  
  if (!dropdown.contains(e.target) && e.target !== userInfo) {
    dropdown.classList.remove('show');
  }
});

function goToProfile() {
  document.querySelector('[data-page="profile"]').click();
  document.getElementById('user-dropdown').classList.remove('show');
}

function goToShop() {
  document.querySelector('[data-page="shop"]').click();
  document.getElementById('user-dropdown').classList.remove('show');
}

function logout() {
  if (confirm('Вы уверены, что хотите выйти?')) {
    ipcRenderer.send('logout');
  }
  document.getElementById('user-dropdown').classList.remove('show');
}

// Загрузка игры
document.getElementById('upload-btn').addEventListener('click', () => {
  const title = document.getElementById('upload-title').value;
  const size = document.getElementById('upload-size').value;
  const icon = document.getElementById('upload-icon').value || '🎮';
  
  if (!title || !size) {
    alert('Заполните все поля');
    return;
  }
  
  ipcRenderer.send('upload-game', { title, size, icon });
});

ipcRenderer.on('upload-error', (event, message) => {
  alert(message);
});

ipcRenderer.on('game-uploaded', (event, game) => {
  alert(`Игра "${game.title}" успешно загружена!`);
  document.getElementById('upload-title').value = '';
  document.getElementById('upload-size').value = '';
  document.getElementById('upload-icon').value = '';
  
  // Обновляем список игр
  ipcRenderer.send('get-games');
});

ipcRenderer.on('games-list', (event, gamesDb) => {
  const allGames = [...games, ...gamesDb];
  renderGames('store-games', allGames);
});

// Инициализация
ipcRenderer.send('get-games');
renderGames('store-games', games);
renderGames('library-games', []);
updateDownloadsList();


// Профиль
function updateProfile() {
  if (!currentUser || !currentUser.id) return;
  
  document.getElementById('profile-username').textContent = currentUser.username;
  document.getElementById('level-badge').textContent = currentUser.level;
  document.getElementById('user-xp').textContent = currentUser.xp;
  document.getElementById('user-coins').textContent = currentUser.coins;
  document.getElementById('shop-coins').textContent = currentUser.coins;
  document.getElementById('profile-avatar').textContent = currentUser.avatar;
  
  // XP бар
  const xpForNextLevel = currentUser.level * 100;
  const xpPercent = (currentUser.xp / xpForNextLevel) * 100;
  document.getElementById('xp-fill').style.width = xpPercent + '%';
  document.getElementById('xp-text').textContent = `${currentUser.xp} / ${xpForNextLevel}`;
  
  // Применяем кастомизацию
  const avatarFrame = document.getElementById('avatar-frame');
  avatarFrame.className = 'avatar-frame ' + currentUser.avatar_frame;
  
  const profileHeader = document.getElementById('profile-header');
  profileHeader.className = 'profile-header ' + currentUser.profile_bg;
}

ipcRenderer.on('current-user', (event, user) => {
  currentUser = user;
  updateUserInfo();
  updateProfile();
});

// Магазин
let shopItems = [];
let userItems = [];

ipcRenderer.on('shop-data', (event, data) => {
  shopItems = data.items;
  userItems = data.userItems;
  renderShop();
});

function renderShop(filter = 'all') {
  const container = document.getElementById('shop-grid');
  container.innerHTML = '';
  
  const filtered = filter === 'all' ? shopItems : shopItems.filter(item => item.type === filter);
  
  filtered.forEach(item => {
    const owned = userItems.find(ui => ui.id === item.id);
    const equipped = (item.type === 'frame' && currentUser.avatar_frame === item.data) ||
                     (item.type === 'background' && currentUser.profile_bg === item.data);
    
    const card = document.createElement('div');
    card.className = 'shop-item';
    
    let previewClass = '';
    if (item.type === 'frame') {
      previewClass = 'avatar-frame ' + item.data;
    }
    
    let buttonText = `Купить за ${item.price} 🪙`;
    let buttonClass = 'shop-buy-btn';
    
    if (equipped) {
      buttonText = 'Надето';
      buttonClass = 'shop-buy-btn equipped';
    } else if (owned) {
      buttonText = 'Надеть';
      buttonClass = 'shop-buy-btn owned';
    }
    
    card.innerHTML = `
      <div class="shop-item-preview ${previewClass}">
        ${item.type === 'frame' ? '🎮' : '🎨'}
      </div>
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-price">${item.price} 🪙</div>
      <button class="${buttonClass}" data-item-id="${item.id}" data-owned="${!!owned}" data-equipped="${equipped}">
        ${buttonText}
      </button>
    `;
    
    const button = card.querySelector('button');
    button.addEventListener('click', () => handleShopAction(item, owned, equipped));
    
    container.appendChild(card);
  });
}

function handleShopAction(item, owned, equipped) {
  if (equipped) return;
  
  if (owned) {
    // Надеть
    const field = item.type === 'frame' ? 'avatar_frame' : 'profile_bg';
    ipcRenderer.send('apply-customization', { field, value: item.data });
  } else {
    // Купить
    ipcRenderer.send('buy-item', item.id);
  }
}

function filterShop(type) {
  document.querySelectorAll('.shop-tab').forEach(tab => tab.classList.remove('active'));
  event.target.classList.add('active');
  renderShop(type);
}

ipcRenderer.on('buy-success', (event, item) => {
  ipcRenderer.send('get-shop');
  alert(`Куплено: ${item.name}!`);
});

ipcRenderer.on('buy-error', (event, message) => {
  alert(message);
});

// Загружаем магазин при открытии страницы
document.querySelector('[data-page="shop"]').addEventListener('click', () => {
  ipcRenderer.send('get-shop');
});

document.querySelector('[data-page="profile"]').addEventListener('click', () => {
  ipcRenderer.send('get-current-user');
});


// Достижения
const achievements = [
  { id: 1, name: 'Первые шаги', desc: 'Зарегистрируйтесь в системе', icon: '🎯', reward: '+50 XP', condition: 'register' },
  { id: 2, name: 'Новичок', desc: 'Достигните 5 уровня', icon: '⭐', reward: '+100 монет', condition: 'level_5' },
  { id: 3, name: 'Опытный', desc: 'Достигните 10 уровня', icon: '🌟', reward: '+200 монет', condition: 'level_10' },
  { id: 4, name: 'Мастер', desc: 'Достигните 20 уровня', icon: '💫', reward: '+500 монет', condition: 'level_20' },
  { id: 5, name: 'Коллекционер', desc: 'Установите 5 игр', icon: '🎮', reward: '+150 XP', condition: 'games_5' },
  { id: 6, name: 'Библиотекарь', desc: 'Установите 10 игр', icon: '📚', reward: '+300 XP', condition: 'games_10' },
  { id: 7, name: 'Щедрый', desc: 'Загрузите свою первую игру', icon: '🎁', reward: '+200 XP', condition: 'upload_1' },
  { id: 8, name: 'Издатель', desc: 'Загрузите 5 игр', icon: '📤', reward: '+500 монет', condition: 'upload_5' },
  { id: 9, name: 'Модник', desc: 'Купите первый предмет в магазине', icon: '🛍️', reward: '+100 XP', condition: 'shop_1' },
  { id: 10, name: 'Стилист', desc: 'Купите 5 предметов', icon: '✨', reward: '+300 монет', condition: 'shop_5' },
  { id: 11, name: 'Богач', desc: 'Накопите 1000 монет', icon: '💰', reward: '+500 XP', condition: 'coins_1000' },
  { id: 12, name: 'Легенда', desc: 'Достигните 50 уровня', icon: '👑', reward: '+1000 монет', condition: 'level_50' }
];

function renderAchievements() {
  const container = document.getElementById('achievements-grid');
  container.innerHTML = '';
  
  let unlockedCount = 0;
  
  achievements.forEach(ach => {
    const unlocked = checkAchievement(ach.condition);
    if (unlocked) unlockedCount++;
    
    const card = document.createElement('div');
    card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;
    
    card.innerHTML = `
      <div class="achievement-icon">${ach.icon}</div>
      <div class="achievement-info">
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-desc">${ach.desc}</div>
        <div class="achievement-reward">${ach.reward}</div>
        ${unlocked ? '<div class="achievement-date">✓ Разблокировано</div>' : ''}
      </div>
    `;
    
    container.appendChild(card);
  });
  
  document.getElementById('unlocked-count').textContent = unlockedCount;
  document.getElementById('total-achievements').textContent = achievements.length;
  
  const progress = (unlockedCount / achievements.length) * 100;
  document.getElementById('achievements-progress').style.width = progress + '%';
}

function checkAchievement(condition) {
  if (!currentUser || !currentUser.id) return false;
  
  const [type, value] = condition.split('_');
  
  switch(type) {
    case 'register':
      return true;
    case 'level':
      return currentUser.level >= parseInt(value);
    case 'coins':
      return currentUser.coins >= parseInt(value);
    default:
      return false;
  }
}

// Уведомления
function showNotification(title, message) {
  const notif = document.createElement('div');
  notif.className = 'notification';
  notif.innerHTML = `
    <div class="notification-title">${title}</div>
    <div class="notification-message">${message}</div>
  `;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideInRight 0.5s reverse';
    setTimeout(() => notif.remove(), 500);
  }, 3000);
}

// Сообщество
document.querySelector('[data-page="community"]').addEventListener('click', async () => {
  try {
    const stats = await fetch('http://localhost:3000/api/stats').then(r => r.json());
    document.getElementById('total-users').textContent = stats.totalUsers;
    document.getElementById('total-games').textContent = stats.totalGames;
    document.getElementById('total-downloads').textContent = stats.totalDownloads;
    document.getElementById('online-users').textContent = stats.onlineUsers;
    
    const leaderboard = await fetch('http://localhost:3000/api/leaderboard').then(r => r.json());
    renderLeaderboard(leaderboard);
    
    const activity = await fetch('http://localhost:3000/api/activity').then(r => r.json());
    renderGlobalActivity(activity);
  } catch (error) {
    console.error('Error loading community:', error);
  }
});

function renderLeaderboard(users) {
  const container = document.getElementById('leaderboard-list');
  container.innerHTML = '';
  
  users.forEach((user, index) => {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    
    let rankClass = '';
    if (index === 0) rankClass = 'gold';
    else if (index === 1) rankClass = 'silver';
    else if (index === 2) rankClass = 'bronze';
    
    item.innerHTML = `
      <div class="leaderboard-rank ${rankClass}">#${index + 1}</div>
      <div class="leaderboard-avatar">${user.avatar}</div>
      <div class="leaderboard-info">
        <div class="leaderboard-name">${user.username}</div>
        <div class="leaderboard-stats">${user.xp} XP • ${user.coins} монет</div>
      </div>
      <div class="leaderboard-level">Ур. ${user.level}</div>
    `;
    
    container.appendChild(item);
  });
}

function renderGlobalActivity(activities) {
  const container = document.getElementById('global-activity');
  container.innerHTML = '';
  
  activities.forEach(act => {
    const item = document.createElement('div');
    item.className = 'activity-feed-item';
    
    let icon = '📰';
    if (act.action.includes('Загрузил')) icon = '📤';
    if (act.action.includes('Скачал')) icon = '📥';
    if (act.action.includes('Достиг')) icon = '⭐';
    
    const timeAgo = getTimeAgo(new Date(act.created_at));
    
    item.innerHTML = `
      <div class="activity-icon">${icon}</div>
      <div class="activity-text">
        <span class="activity-user">${act.username}</span> ${act.action}
        <div class="activity-time">${timeAgo}</div>
      </div>
    `;
    
    container.appendChild(item);
  });
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'только что';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' мин назад';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' ч назад';
  return Math.floor(seconds / 86400) + ' дн назад';
}

// Достижения
document.querySelector('[data-page="achievements"]').addEventListener('click', () => {
  renderAchievements();
});

// Проверка новых достижений
ipcRenderer.on('current-user', (event, user) => {
  if (user && user.id) {
    const oldLevel = currentUser ? currentUser.level : 0;
    currentUser = user;
    
    if (oldLevel > 0 && user.level > oldLevel) {
      showNotification('🎉 Новый уровень!', `Вы достигли ${user.level} уровня!`);
    }
    
    updateUserInfo();
    updateProfile();
  }
});
