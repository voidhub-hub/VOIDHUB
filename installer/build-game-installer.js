const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Создает exe-инсталлятор для игры
 * @param {Object} gameConfig - Конфигурация игры
 */
function buildGameInstaller(gameConfig) {
  const {
    gameId,
    gameName,
    gameVersion = '1.0.0',
    gameExe,
    sourceDir,
    outputDir = './installers'
  } = gameConfig;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outFile = path.join(outputDir, `${gameId}_Setup.exe`);
  
  // Создаем временный license.txt если его нет
  const licenseFile = path.join(__dirname, 'license.txt');
  if (!fs.existsSync(licenseFile)) {
    fs.writeFileSync(licenseFile, 'Лицензионное соглашение\n\nИспользуйте на свой риск.');
  }

  const nsiScript = path.join(__dirname, 'installer.nsi');
  const makensis = 'D:\\games\\NSIS\\makensis.exe';
  
  const command = `"${makensis}" /DGAME_ID="${gameId}" /DGAME_NAME="${gameName}" /DGAME_VERSION="${gameVersion}" /DGAME_EXE="${gameExe}" /DSOURCE_DIR="${sourceDir}" /DOUT_FILE="${outFile}" "${nsiScript}"`;
  
  console.log(`Создание инсталлятора для ${gameName}...`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Ошибка: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`✓ Инсталлятор создан: ${outFile}`);
    console.log(stdout);
  });
}

// Пример использования
if (require.main === module) {
  const exampleGame = {
    gameId: 'cyberpunk_adventure',
    gameName: 'Cyberpunk Adventure',
    gameVersion: '1.0.0',
    gameExe: 'game.exe',
    sourceDir: 'C:\\Games\\CyberpunkAdventure',
    outputDir: './installers'
  };
  
  buildGameInstaller(exampleGame);
}

module.exports = { buildGameInstaller };
