// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Анимация появления элементов при скролле
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.feature-card, .download-card, .about-content').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'all 0.6s ease-out';
  observer.observe(el);
});

// Обновление статистики (можно подключить к API)
async function updateStats() {
  try {
    const response = await fetch('http://localhost:3000/api/stats');
    const stats = await response.json();
    
    document.querySelector('.stat-number:nth-child(1)').textContent = stats.totalUsers + '+';
    document.querySelector('.stat-number:nth-child(2)').textContent = stats.totalGames + '+';
    document.querySelector('.stat-number:nth-child(3)').textContent = stats.totalDownloads + '+';
  } catch (error) {
    console.log('Stats API not available');
  }
}

// updateStats(); // Раскомментируй когда сервер запущен
