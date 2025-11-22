const fs = require('fs');
const path = require('path');

/**
 * Создает базовые ассеты для инсталлятора (заглушки)
 */
function createInstallerAssets() {
  const assetsDir = __dirname;
  
  // Создаем текстовые заглушки для изображений
  const headerBmp = path.join(assetsDir, 'header.bmp');
  const welcomeBmp = path.join(assetsDir, 'welcome.bmp');
  const iconIco = path.join(assetsDir, 'icon.ico');
  
  console.log('Создание ассетов для инсталлятора...');
  console.log('Примечание: Замените эти файлы на реальные изображения:');
  console.log('- header.bmp (150x57 пикселей)');
  console.log('- welcome.bmp (164x314 пикселей)');
  console.log('- icon.ico (256x256 пикселей)');
  
  // Создаем пустые файлы-заглушки
  if (!fs.existsSync(headerBmp)) {
    fs.writeFileSync(headerBmp, '');
    console.log('✓ Создан header.bmp');
  }
  
  if (!fs.existsSync(welcomeBmp)) {
    fs.writeFileSync(welcomeBmp, '');
    console.log('✓ Создан welcome.bmp');
  }
  
  if (!fs.existsSync(iconIco)) {
    fs.writeFileSync(iconIco, '');
    console.log('✓ Создан icon.ico');
  }
}

if (require.main === module) {
  createInstallerAssets();
}

module.exports = { createInstallerAssets };
