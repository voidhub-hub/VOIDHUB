# Создание exe-инсталляторов для игр

## Требования

1. Установите NSIS (Nullsoft Scriptable Install System):
   - Скачайте с https://nsis.sourceforge.io/Download
   - Установите и добавьте в PATH

2. Проверьте установку:
```bash
makensis /VERSION
```

## Создание инсталлятора

### Способ 1: Через Node.js скрипт

```javascript
const { buildGameInstaller } = require('./build-game-installer');

buildGameInstaller({
  gameId: 'my_game',
  gameName: 'My Awesome Game',
  gameVersion: '1.0.0',
  gameExe: 'game.exe',
  sourceDir: 'C:\\Path\\To\\Game\\Files',
  outputDir: './installers'
});
```

### Способ 2: Напрямую через NSIS

```bash
makensis /DGAME_ID="my_game" /DGAME_NAME="My Game" /DGAME_VERSION="1.0.0" /DGAME_EXE="game.exe" /DSOURCE_DIR="C:\GameFiles" /DOUT_FILE="MyGame_Setup.exe" installer.nsi
```

## Структура файлов игры

```
GameFiles/
├── game.exe          (главный исполняемый файл)
├── data/             (ресурсы игры)
├── config.ini        (настройки)
└── readme.txt        (инструкции)
```

## Кастомизация инсталлятора

Замените файлы в папке `installer/`:
- `header.bmp` - заголовок (150x57 px)
- `welcome.bmp` - приветственный экран (164x314 px)
- `icon.ico` - иконка приложения (256x256 px)
- `license.txt` - лицензионное соглашение

## Возможности инсталлятора

- ✓ Красивый интерфейс
- ✓ Выбор папки установки
- ✓ Создание ярлыков (рабочий стол + меню Пуск)
- ✓ Запись в реестр Windows
- ✓ Деинсталлятор
- ✓ Отображение в "Программы и компоненты"
- ✓ Автозапуск после установки
