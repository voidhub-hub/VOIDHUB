const { buildGameInstaller } = require('./installer/build-game-installer');
const path = require('path');

// Тестовая сборка инсталлятора для демо-игры
const demoGame = {
  gameId: 'demo_game',
  gameName: 'Demo Game',
  gameVersion: '1.0.0',
  gameExe: 'game.exe',
  sourceDir: path.join(__dirname, 'demo-game'),
  outputDir: path.join(__dirname, 'installers')
};

console.log('Создание тестового инсталлятора...');
console.log('Игра:', demoGame.gameName);
console.log('Исходная папка:', demoGame.sourceDir);
console.log('Выходная папка:', demoGame.outputDir);
console.log('');

buildGameInstaller(demoGame);
