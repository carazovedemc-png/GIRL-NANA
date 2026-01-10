// Основные переменные
let currentPage = 'home';
let bannerInterval = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('loader').style.display = 'none';
    
    try {
        // Инициализируем Telegram Auth
        await window.TelegramAuth.init();
        
        // Показываем анимацию приветствия
        window.TelegramAuth.showWelcomeAnimation();
        
        // Обновляем профиль
        updateProfileDisplay();
        
        // Настраиваем кнопки профиля
        setupProfileButtons();
        
        // Инициализируем приложение
        initializeApp();
        setupEventListeners();
        
        // Устанавливаем активную страницу
        switchPage('home');
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        // В случае ошибки все равно продолжаем
        initializeApp();
        setupEventListeners();
        switchPage('home');
    }
});

function initializeApp() {
    // Загружаем конфигурацию
    loadAppConfig();
    
    // Загружаем контент
    setTimeout(() => {
        loadUpcomingFights();
        loadFightArchive();
        loadFighters();
    }, 100);
}

function loadAppConfig() {
    document.getElementById('app-title').textContent = APP_CONFIG.appName;
    const logoImg = document.getElementById('app-logo');
    logoImg.src = APP_CONFIG.logoUrl;
    logoImg.onerror = function() {
        this.src = 'https://via.placeholder.com/40/FF6B6B/FFFFFF?text=EFC';
    };
}

function loadUpcomingFights() {
    const container = document.querySelector('.fights-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    APP_CONFIG.upcomingFights.forEach(fight => {
        const fightCard = document.createElement('div');
        fightCard.className = 'fight-card';
        fightCard.innerHTML = `
            <h3>${fight.fighters.join(' vs ')}</h3>
            <p><i class="far fa-calendar"></i> ${fight.date} ${fight.time}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${fight.place}</p>
            <p><i class="fas fa-ticket-alt"></i> Билет: ${fight.ticketPrice} руб.</p>
            <button class="btn-primary buy-ticket-btn" data-fight-id="${fight.id}" style="margin-top: 10px;">
                Купить билет
            </button>
        `;
        container.appendChild(fightCard);
    });
}

function loadFightArchive() {
    const container = document.querySelector('.videos-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    APP_CONFIG.fightArchive.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail" 
                 onerror="this.src='https://via.placeholder.com/400x225/333/fff?text=Бой'">
            <h3>${video.title}</h3>
            <p class="video-description">${video.description}</p>
            <div class="video-date">${video.date}</div>
        `;
        container.appendChild(videoCard);
    });
}

function loadFighters() {
    const container = document.getElementById('fighters-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Сначала бойцы вне категорий
    if (APP_CONFIG.fighters.no_category) {
        APP_CONFIG.fighters.no_category.forEach(fighter => {
            const card = createFighterCard(fighter);
            card.dataset.category = 'no_category';
            container.appendChild(card);
        });
    }
    
    // Затем бойцы из категорий
    if (APP_CONFIG.fighters.categories) {
        // Весовые категории
        if (APP_CONFIG.fighters.categories.weight_classes) {
            APP_CONFIG.fighters.categories.weight_classes.forEach(category => {
                category.fighters.forEach(fighter => {
                    const card = createFighterCard(fighter);
                    card.dataset.category = category.id;
                    container.appendChild(card);
                });
            });
        }
        
        // Виды спорта
        if (APP_CONFIG.fighters.categories.sports) {
            APP_CONFIG.fighters.categories.sports.forEach(category => {
                category.fighters.forEach(fighter => {
                    const card = createFighterCard(fighter);
                    card.dataset.category = category.id;
                    container.appendChild(card);
                });
            });
        }
    }
}

function createFighterCard(fighter) {
    const card = document.createElement('div');
    card.className = 'fighter-card';
    
    card.innerHTML = `
        <div class="fighter-photo">
            <img src="${fighter.photo}" alt="${fighter.name}" 
                 onerror="this.src='https://via.placeholder.com/70/333/FFFFFF?text=${fighter.name.charAt(0)}'">
        </div>
        <div class="fighter-info">
            <div class="fighter-rank">${fighter.rank}</div>
            <div class="fighter-name">${fighter.name}</div>
            <div class="fighter-record">${fighter.record}</div>
            <div class="fighter-details">
                ${fighter.sport} • ${fighter.weight_class}
            </div>
        </div>
    `;
    
    return card;
}

function updateProfileDisplay() {
    const auth = window.TelegramAuth;
    const user = auth.getUser();
    
    if (user) {
        const userName = document.getElementById('user-name');
        const userId = document.getElementById('user-id');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userName) {
            userName.textContent = auth.getUserName();
        }
        
        if (userId) {
            userId.textContent = `ID: ${auth.getUserId()}`;
        }
        
        if (userAvatar) {
            const avatarUrl = auth.getUserAvatar();
            userAvatar.src = avatarUrl;
            userAvatar.onerror = function() {
                this.src = 'https://via.placeholder.com/100/FF6B6B/FFFFFF?text=' + 
                          (user.first_name?.charAt(0) || 'U');
            };
        }
    }
}

function setupProfileButtons() {
    const auth = window.TelegramAuth;
    const userId = auth.getUserId();
    
    // Мои билеты
    document.getElementById('my-tickets-btn').addEventListener('click', showMyTickets);
    
    // Мои бои
    document.getElementById('my-fights-btn').addEventListener('click', function() {
        if (APP_CONFIG.contracts[userId]) {
            if (APP_CONFIG.userFights && APP_CONFIG.userFights[userId]) {
                showMyFights();
            } else {
                alert('У вас пока нет запланированных боев');
            }
        } else {
            alert('У вас нет контракта с EFC™');
        }
    });
    
    // Анкета/Контракт
    const contractBtn = document.getElementById('contract-btn');
    if (contractBtn) {
        if (APP_CONFIG.contracts[userId]) {
            document.getElementById('contract-btn-title').textContent = 'Мой контракт';
            document.getElementById('contract-btn-subtitle').textContent = 'Просмотреть контракт';
            
            contractBtn.addEventListener('click', function() {
                window.open(APP_CONFIG.contracts[userId], '_blank');
            });
        } else {
            contractBtn.addEventListener('click', function() {
                showApplicationForm();
            });
        }
    }
    
    // Пользовательское соглашение
    document.getElementById('agreement-btn').addEventListener('click', function() {
        window.open(APP_CONFIG.agreementUrl, '_blank');
    });
    
    // Техподдержка
    document.getElementById('support-btn').addEventListener('click', function() {
        window.open(APP_CONFIG.supportUrl, '_blank');
    });
    
    // Админ панель
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        if (APP_CONFIG.admins.includes(parseInt(userId))) {
            adminBtn.style.display = 'flex';
            adminBtn.addEventListener('click', showAdminPanel);
        } else {
            adminBtn.style.display = 'none';
        }
    }
}

function showMyTickets() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    
    let ticketsHTML = '';
    if (tickets.length === 0) {
        ticketsHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 20px;">Билетов пока нет</p>';
    } else {
        ticketsHTML = tickets.map(ticket => `
            <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong style="color: white;">${ticket.fighters?.join(' vs ') || 'Бой'}</strong>
                    <span style="color: #4ECDC4; font-weight: bold;">${ticket.price || 0} руб.</span>
                </div>
                <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">
                    <p><i class="far fa-calendar"></i> ${ticket.date || 'Не указано'} ${ticket.time || ''}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${ticket.place || 'Не указано'}</p>
                </div>
            </div>
        `).join('');
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-ticket-alt"></i> Мои билеты</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${ticketsHTML}
                <div style="margin-top: 20px;">
                    <button class="btn-secondary" id="clear-tickets-btn">
                        <i class="fas fa-trash"></i> Очистить все билеты
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Очистка билетов
    modal.querySelector('#clear-tickets-btn').addEventListener('click', function() {
        if (confirm('Удалить все билеты?')) {
            localStorage.removeItem('tickets');
            modal.remove();
            alert('Билеты удалены');
        }
    });
    
    // Закрытие модалки
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function showMyFights() {
    const userId = window.TelegramAuth.getUserId();
    const fights = APP_CONFIG.userFights[userId] || [];
    
    let message = 'Ваши бои:\n\n';
    fights.forEach(fight => {
        message += `🥊 Против: ${fight.opponent}\n`;
        message += `📅 Дата: ${fight.date} ${fight.time}\n`;
        message += `📍 Место: ${fight.place}\n`;
        message += `💰 Гонорар: ${fight.reward} руб.\n`;
        message += `📊 Статус: ${fight.status === 'upcoming' ? 'Предстоящий' : 
                                  fight.status === 'completed' ? 'Завершен' : 'Отменен'}\n\n`;
    });
    
    alert(message);
}

function showApplicationForm() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-edit"></i> Анкета для участия</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p style="text-align: center; margin-bottom: 20px; color: rgba(255,255,255,0.7);">
                    Заполните анкету для участия в боях EFC™
                </p>
                
                <div class="form-group">
                    <label>ФИО *</label>
                    <input type="text" id="app-fullname" class="form-input" placeholder="Иванов Иван Иванович" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Дата рождения *</label>
                        <input type="date" id="app-birthdate" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label>Рост (см) *</label>
                        <input type="number" id="app-height" class="form-input" placeholder="180" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Вес (кг) *</label>
                        <input type="number" id="app-weight" class="form-input" placeholder="75" required>
                    </div>
                    <div class="form-group">
                        <label>Телефон *</label>
                        <input type="tel" id="app-contact" class="form-input" placeholder="+7 (999) 123-45-67" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Состояние здоровья *</label>
                    <textarea id="app-health" class="form-textarea" placeholder="Хронические заболевания, травмы..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label>Опыт в единоборствах</label>
                    <textarea id="app-experience" class="form-textarea" placeholder="Опыт тренировок, соревнования..."></textarea>
                </div>
                
                <div style="margin-top: 25px;">
                    <button class="btn-primary" id="submit-application-btn">
                        <i class="fas fa-paper-plane"></i> Отправить анкету в Telegram
                    </button>
                    <button class="btn-secondary" id="close-form-btn" style="margin-top: 10px;">
                        <i class="fas fa-times"></i> Закрыть
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#close-form-btn').addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Отправка анкеты
    modal.querySelector('#submit-application-btn').addEventListener('click', function() {
        const fullName = document.getElementById('app-fullname').value;
        const birthDate = document.getElementById('app-birthdate').value;
        const contact = document.getElementById('app-contact').value;
        
        if (!fullName || !birthDate || !contact) {
            alert('Заполните обязательные поля!');
            return;
        }
        
        const message = `📋 НОВАЯ АНКЕТА EFC™\n\n👤 ${fullName}\n📅 ${birthDate}\n📞 ${contact}`;
        const encodedMessage = encodeURIComponent(message);
        const telegramUrl = `https://t.me/EDEM_CR?text=${encodedMessage}`;
        
        window.open(telegramUrl, '_blank');
        modal.remove();
        alert('✅ Анкета сформирована! Откройте Telegram для отправки.');
    });
}

function showAdminPanel() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const applications = JSON.parse(localStorage.getItem('applications') || '[]');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-crown"></i> ADMIN PANEL</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 20px;">
                    <h3 style="color: white; margin-bottom: 15px;">Статистика</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 1.8rem; font-weight: bold; color: #FF6B6B;">${tickets.length}</div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">Билетов</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 1.8rem; font-weight: bold; color: #4ECDC4;">${applications.length}</div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">Анкет</div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <button class="btn-primary" id="clear-all-data-btn" style="margin-bottom: 10px;">
                        <i class="fas fa-trash"></i> Очистить все данные
                    </button>
                    <button class="btn-secondary" id="close-admin-btn">
                        <i class="fas fa-times"></i> Закрыть
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Очистка данных
    modal.querySelector('#clear-all-data-btn').addEventListener('click', function() {
        if (confirm('УДАЛИТЬ ВСЕ ДАННЫЕ?\n\nВсе билеты и анкеты будут удалены.')) {
            localStorage.clear();
            modal.remove();
            alert('Все данные удалены');
        }
    });
    
    modal.querySelector('#close-admin-btn').addEventListener('click', function() {
        modal.remove();
    });
    
    // Закрытие модалки
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function setupEventListeners() {
    // Навигация
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            switchPage(page);
        });
    });
    
    // Фильтр бойцов
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            filterFighters(category);
        });
    });
    
    // Покупка билетов
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('buy-ticket-btn')) {
            const fightId = e.target.getAttribute('data-fight-id');
            buyTicket(fightId);
        }
    });
}

function filterFighters(category) {
    const fighters = document.querySelectorAll('.fighter-card');
    
    fighters.forEach(fighter => {
        if (category === 'all' || fighter.dataset.category === category) {
            fighter.style.display = 'flex';
        } else {
            fighter.style.display = 'none';
        }
    });
}

function buyTicket(fightId) {
    const fight = APP_CONFIG.upcomingFights.find(f => f.id == fightId);
    if (!fight) return;
    
    const ticket = {
        id: Date.now(),
        fightId: fightId,
        fighters: fight.fighters,
        date: fight.date,
        time: fight.time,
        place: fight.place,
        price: fight.ticketPrice,
        purchaseDate: new Date().toLocaleDateString('ru-RU')
    };
    
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    tickets.push(ticket);
    localStorage.setItem('tickets', JSON.stringify(tickets));
    
    alert(`✅ Билет куплен! ${fight.ticketPrice} руб.`);
}

function switchPage(page) {
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.style.display = 'block';
        setTimeout(() => targetPage.classList.add('active'), 10);
    }
    
    currentPage = page;
    
    if (page === 'fighters') {
        loadFighters();
    }
}

// Устанавливаем активную кнопку при загрузке
document.querySelector('.nav-btn[data-page="home"]').classList.add('active');