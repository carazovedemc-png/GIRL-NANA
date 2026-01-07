// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// Устанавливаем цвет фона Telegram
tg.setHeaderColor('#667eea');
tg.setBackgroundColor('#667eea');

// Получаем информацию о пользователе
const user = tg.initDataUnsafe.user;
if (user) {
    // Можно персонализировать приветствие
    console.log('Пользователь:', user);
}

// Обработка кнопки "Назад" в Telegram
tg.BackButton.show();
tg.BackButton.onClick(function() {
    tg.close();
});

// Отправка данных в бота (если нужно)
function sendDataToBot(data) {
    tg.sendData(JSON.stringify(data));
}

// Обработка закрытия приложения
tg.onEvent('viewportChanged', function() {
    console.log('Viewport changed');
});

// Показываем основное содержимое после загрузки
document.addEventListener('DOMContentLoaded', function() {
    document.body.style.opacity = '1';
});