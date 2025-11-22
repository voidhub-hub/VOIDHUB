const { buildGameInstaller } = require('./build-game-installer');

// Пример 1: Cyberpunk Adventure
buildGameInstaller({
  gameId: 'cyberpunk_adventure',
  gameName: 'Cyberpunk Adventure',
  gameVersion: '1.0.0',
  gameExe: 'game.exe',
  sourceDir: 'C:\\Games\\CyberpunkAdventure',
  outputDir: './installers'
});

// Пример 2: Space Shooter
buildGameInstaller({
  gameId: 'space_shooter',
  gameName: 'Space Shooter',
  gameVersion: '2.1.0',
  gameExe: 'shooter.exe',
  sourceDir: 'C:\\Games\\SpaceShooter',
  outputDir: './installers'
});

// Пример 3: Fantasy RPG
buildGameInstaller({
  gameId: 'fantasy_rpg',
  gameName: 'Fantasy RPG',
  gameVersion: '1.5.2',
  gameExe: 'rpg.exe',
  sourceDir: 'C:\\Games\\FantasyRPG',
  outputDir: './installers'
});

console.log('\n✓ Все инсталляторы будут созданы в папке ./installers/');
console.log('Убедитесь, что NSIS установлен и добавлен в PATH');
