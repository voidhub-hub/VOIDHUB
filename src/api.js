const API_URL = 'http://localhost:3000/api';

async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка запроса');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Авторизация
async function register(username, email, password) {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });
}

async function login(username, password) {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

// Пользователи
async function getUser(userId) {
  return apiRequest(`/user/${userId}`);
}

async function getUserActivity(userId) {
  return apiRequest(`/user/${userId}/activity`);
}

async function updateCustomization(userId, field, value) {
  return apiRequest(`/user/${userId}/customize`, {
    method: 'POST',
    body: JSON.stringify({ field, value })
  });
}

// Игры
async function getGames() {
  return apiRequest('/games');
}

async function uploadGame(gameData) {
  return apiRequest('/games', {
    method: 'POST',
    body: JSON.stringify(gameData)
  });
}

async function downloadGame(gameId, userId) {
  return apiRequest(`/games/${gameId}/download`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}

// Магазин
async function getShop() {
  return apiRequest('/shop');
}

async function getUserItems(userId) {
  return apiRequest(`/user/${userId}/items`);
}

async function buyItem(userId, itemId) {
  return apiRequest('/shop/buy', {
    method: 'POST',
    body: JSON.stringify({ userId, itemId })
  });
}

module.exports = {
  register,
  login,
  getUser,
  getUserActivity,
  updateCustomization,
  getGames,
  uploadGame,
  downloadGame,
  getShop,
  getUserItems,
  buyItem
};
