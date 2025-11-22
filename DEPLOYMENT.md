# Деплой VoidHub

## Шаг 1: Создать GitHub репозиторий

1. Иди на https://github.com/new
2. Название: `voidhub`
3. Описание: `Свободная платформа для игр`
4. Public
5. Create repository

## Шаг 2: Загрузить код

```bash
cd "D:\games\project\exe приложуха"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/voidhub.git
git push -u origin main
```

## Шаг 3: Создать Release с установщиком

1. Собери приложение:
```bash
npm run build
```

2. Иди на GitHub → Releases → Create a new release
3. Tag: `v1.0.0`
4. Title: `VoidHub v1.0.0`
5. Загрузи файл: `dist/VoidHub-Setup.exe`
6. Publish release

**Прямая ссылка будет:**
```
https://github.com/yourusername/voidhub/releases/download/v1.0.0/VoidHub-Setup.exe
```

## Шаг 4: Настроить GitHub Pages

1. Создай папку `docs/` в корне проекта
2. Скопируй туда файлы из `website/`:
```bash
mkdir docs
copy website\* docs\
```

3. GitHub → Settings → Pages
4. Source: Deploy from a branch
5. Branch: main → /docs
6. Save

**Сайт будет доступен:**
```
https://yourusername.github.io/voidhub/
```

## Шаг 5: Обновить ссылки на сайте

В `docs/index.html` замени:
```html
<!-- Было -->
<a href="releases/VoidHub-Setup.exe">

<!-- Стало -->
<a href="https://github.com/yourusername/voidhub/releases/download/v1.0.0/VoidHub-Setup.exe">
```

## Шаг 6: Купить домен (опционально)

### Namecheap (дешево)
1. https://www.namecheap.com/
2. Найди домен: `voidhub.xyz` (~$1-2/год)
3. Купи

### Привязать к GitHub Pages
1. GitHub → Settings → Pages → Custom domain
2. Введи: `voidhub.xyz`
3. Save

4. Namecheap → Domain List → Manage → Advanced DNS
5. Добавь записи:
```
Type: A Record
Host: @
Value: 185.199.108.153

Type: A Record
Host: @
Value: 185.199.109.153

Type: A Record
Host: @
Value: 185.199.110.153

Type: A Record
Host: @
Value: 185.199.111.153

Type: CNAME Record
Host: www
Value: yourusername.github.io
```

6. Жди 5-30 минут

## Альтернатива: Vercel (ПРОЩЕ)

1. https://vercel.com/signup
2. Import Git Repository
3. Выбери репозиторий voidhub
4. Root Directory: `website`
5. Deploy

**Готово!** Сайт на `voidhub.vercel.app`

### Привязать домен к Vercel
1. Vercel → Settings → Domains
2. Add Domain: `voidhub.xyz`
3. Следуй инструкциям

## Структура для деплоя

```
voidhub/
├── docs/              # Сайт (для GitHub Pages)
│   ├── index.html
│   ├── style.css
│   └── script.js
├── src/               # Исходники приложения
├── server/            # Сервер
├── installer/         # Инсталлятор
├── package.json
└── README.md
```

## Автоматизация (GitHub Actions)

Создай `.github/workflows/release.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: softprops/action-gh-release@v1
        with:
          files: dist/VoidHub-Setup.exe
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Теперь при создании тега автоматически:**
1. Соберется приложение
2. Создастся Release
3. Загрузится установщик

## Чеклист перед релизом

- [ ] Собрать приложение (`npm run build`)
- [ ] Создать GitHub репозиторий
- [ ] Загрузить код
- [ ] Создать Release с .exe
- [ ] Настроить GitHub Pages
- [ ] Обновить ссылки на сайте
- [ ] (Опционально) Купить домен
- [ ] Протестировать скачивание
- [ ] Запустить сервер на хостинге

## Хостинг для сервера

### Бесплатные варианты:
1. **Railway.app** - 500 часов/месяц бесплатно
2. **Render.com** - бесплатный tier
3. **Fly.io** - бесплатный tier

### Деплой сервера на Railway:
1. https://railway.app/
2. New Project → Deploy from GitHub
3. Выбери репозиторий
4. Root Directory: `server`
5. Deploy

**Обновить API URL в клиенте:**
```javascript
// src/api.js
const API_URL = 'https://voidhub-production.up.railway.app/api';
```

## Готово! 🚀

Теперь у тебя:
- ✅ Сайт на GitHub Pages
- ✅ Прямая ссылка на скачивание
- ✅ Автоматические релизы
- ✅ (Опционально) Свой домен
