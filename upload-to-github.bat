@echo off
set PATH=D:\games\Git\bin;%PATH%

echo Загрузка VoidHub на GitHub...
echo.

git init
git add .
git commit -m "Initial commit: VoidHub v1.0.0"
git branch -M main
git remote add origin https://github.com/voidhub-hub/VOIDHUB.git
git push -u origin main

echo.
echo Готово! Код загружен на GitHub
pause
