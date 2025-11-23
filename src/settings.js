const { ipcRenderer } = require('electron');
const api = require('./api');

let currentUser = null;
let settings = null;

// Загрузка настроек
async function loadSettings() {
  currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = 'auth.html';
    return;
  }

  try {
    settings = await api.getSettings(currentUser.id);
    
    document.getElementById('theme-select').value = settings.theme;
    document.getElementById('notifications-enabled').checked = settings.notifications_enabled === 1;
    document.getElementById('auto-update').checked = settings.auto_update === 1;
    document.getElementById('download-path').value = settings.download_path || '';
    document.getElementById('language-select').value = settings.language;
    
    // Применяем тему
    applyTheme(settings.theme);
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error);
  }
}

// Применение темы
function applyTheme(theme) {
  document.body.className = theme === 'light' ? 'light-theme' : '';
}

// Сохранение настроек
document.getElementById('save-settings-btn').addEventListener('click', async () => {
  const newSettings = {
    theme: document.getElementById('theme-select').value,
    notifications_enabled: document.getElementById('notifications-enabled').checked ? 1 : 0,
    auto_update: document.getElementById('auto-update').checked ? 1 : 0,
    download_path: document.getElementById('download-path').value,
    language: document.getElementById('language-select').value
  };

  try {
    await api.updateSettings(currentUser.id, newSettings);
    applyTheme(newSettings.theme);
    alert('Настройки сохранены!');
  } catch (error) {
    alert('Ошибка сохранения настроек');
  }
});

// Проверка обновлений
document.getElementById('check-updates-btn').addEventListener('click', async () => {
  try {
    const versionInfo = await api.checkForUpdates();
    const currentVersion = require('../package.json').version;
    
    if (versionInfo.version !== currentVersion) {
      const update = confirm(`Доступна новая версия ${versionInfo.version}!\n\nИзменения:\n${versionInfo.changelog.join('\n')}\n\nСкачать?`);
      if (update) {
        require('electron').shell.openExternal(versionInfo.downloadUrl);
      }
    } else {
      alert('У вас установлена последняя версия!');
    }
  } catch (error) {
    alert('Ошибка проверки обновлений');
  }
});

// Выбор папки
document.getElementById('browse-folder-btn').addEventListener('click', async () => {
  const result = await ipcRenderer.invoke('select-folder');
  if (result) {
    document.getElementById('download-path').value = result;
  }
});

// Назад
document.getElementById('back-btn').addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Изменение темы в реальном времени
document.getElementById('theme-select').addEventListener('change', (e) => {
  applyTheme(e.target.value);
});

loadSettings();
