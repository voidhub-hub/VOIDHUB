@echo off
set PATH=D:\games\NSIS\makensis.exe;%PATH%

echo Создание инсталлятора VoidHub...
echo.

D:\games\NSIS\makensis.exe /DGAME_ID="voidhub" /DGAME_NAME="VoidHub" /DGAME_VERSION="1.0.0" /DGAME_EXE="VoidHub.exe" /DSOURCE_DIR="D:\games\project\exe приложуха\dist" /DOUT_FILE="D:\games\project\exe приложуха\installers\VoidHub-Setup.exe" "D:\games\project\exe приложуха\installer\installer.nsi"

echo.
echo Готово! Инсталлятор: installers\VoidHub-Setup.exe
pause
