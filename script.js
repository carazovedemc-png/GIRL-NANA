// Основные переменные
let currentPage = 'home';
let bannerInterval = null;
let currentBannerIndex = 0;
let activeFilters = {
    weight: [],
    sport: []
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Инициализируем Telegram Auth
        await window.TelegramAuth.init();
        
        // Инициализируем кэш изображений
        if ('caches' in window) {
            await ImageCache.preloadImages();
        }
        
        // Показываем анимацию приветствия
        window.TelegramAuth.showWelcomeAnimation();
        
        // Инициализируем приложение
        initializeApp();
        setupEventListeners();
        
        // Устанавливаем активную страницу
        setTimeout(() => {
            switchPage('home');
            document.getElementById('loader').style.display = 'none';
        }, 500);
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        // В случае ошибки все равно продолжаем
        initializeApp();
        setupEventListeners();
        switchPage('home');
        document.getElementById('loader').style.display = 'none';
    }
});

function initializeApp() {
    // Загружаем конфигурацию
    loadAppConfig();
    
    // Загружаем контент
    setTimeout(() => {
        loadBanners();
        loadUpcomingFights();
        loadFightArchive();
        loadFighters();
        updateProfileDisplay();
        setupProfileButtons();
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

function loadBanners() {
    const container = document.querySelector('.banner-container');
    if (!container) return;
    
    const activeBanners = APP_CONFIG.banners.filter(banner => banner.active);
    if (activeBanners.length === 0) return;
    
    // Создаем слайдер
    const slider = document.createElement('div');
    slider.className = 'banner-slider';
    
    // Создаем баннеры
    activeBanners.forEach((banner, index) => {
        const bannerElement = document.createElement('div');
        bannerElement.className = 'banner';
        bannerElement.innerHTML = `
            <img src="${banner.imageUrl}" alt="Баннер ${index + 1}" 
                 onerror="this.src='https://via.placeholder.com/800x400/333/fff?text=EFC+Баннер'">
        `;
        
        if (banner.link && banner.link !== '#') {
            bannerElement.addEventListener('click', () => {
                if (banner.link.startsWith('http')) {
                    window.open(banner.link, '_blank');
                }
            });
        }
        
        slider.appendChild(bannerElement);
    });
    
    // Создаем точки навигации
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'banner-dots';
    
    activeBanners.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `banner-dot ${index === 0 ? 'active' : ''}`;
        dot.dataset.index = index;
        dot.addEventListener('click', () => {
            currentBannerIndex = index;
            updateBannerSlider();
        });
        dotsContainer.appendChild(dot);
    });
    
    // Очищаем и добавляем элементы
    container.innerHTML = '';
    container.appendChild(slider);
    container.appendChild(dotsContainer);
    
    // Устанавливаем начальную позицию
    updateBannerSlider();
    
    // Запускаем автопрокрутку
    startBannerAutoScroll();
}

function updateBannerSlider() {
    const slider = document.querySelector('.banner-slider');
    const dots = document.querySelectorAll('.banner-dot');
    
    if (slider) {
        slider.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
    }
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentBannerIndex);
    });
}

function startBannerAutoScroll() {
    if (bannerInterval) clearInterval(bannerInterval);
    
    bannerInterval = setInterval(() => {
        const totalBanners = APP_CONFIG.banners.filter(b => b.active).length;
        if (totalBanners > 1) {
            currentBannerIndex = (currentBannerIndex + 1) % totalBanners;
            updateBannerSlider();
        }
    }, 5000);
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
        
        // Кэшируем изображение
        let thumbnailUrl = video.thumbnail;
        if ('caches' in window) {
            ImageCache.cacheImage(video.thumbnail).then(url => {
                const img = videoCard.querySelector('.video-thumbnail');
                if (img) img.src = url;
            });
        }
        
        videoCard.innerHTML = `
            <img src="${thumbnailUrl}" alt="${video.title}" class="video-thumbnail" 
                 onerror="this.src='https://via.placeholder.com/400x225/333/fff?text=Бой'">
            <h3>${video.title}</h3>
            <p class="video-description">${video.description}</p>
            <div class="video-date">${video.date}</div>
        `;
        
        videoCard.addEventListener('click', function() {
            if (video.videoUrl) {
                window.open(video.videoUrl, '_blank');
            }
        });
        
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
            card.dataset.weight = fighter.weight_class.toLowerCase().replace(' ', '_');
            card.dataset.sport = fighter.sport.toLowerCase();
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
                    card.dataset.weight = category.id;
                    card.dataset.sport = fighter.sport.toLowerCase();
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
                    card.dataset.weight = fighter.weight_class.toLowerCase().replace(' ', '_');
                    card.dataset.sport = category.id;
                    container.appendChild(card);
                });
            });
        }
    }
    
    // Применяем текущие фильтры
    applyFiltersToFighters();
}

function createFighterCard(fighter) {
    const card = document.createElement('div');
    card.className = 'fighter-card';
    
    // Кэшируем изображение
    let photoUrl = fighter.photo;
    if ('caches' in window) {
        ImageCache.cacheImage(fighter.photo).then(url => {
            const img = card.querySelector('img');
            if (img) {
                img.src = url;
                img.classList.add('img-cached');
            }
        });
    }
    
    card.innerHTML = `
        <div class="fighter-photo">
            <img src="${photoUrl}" alt="${fighter.name}" 
                 onerror="this.src='https://via.placeholder.com/70/333/FFFFFF?text=${fighter.name.charAt(0)}'"
                 loading="lazy">
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
    
    // Обработчик клика на карточку бойца
    card.addEventListener('click', function() {
        if (fighter.link && fighter.link.trim() !== '') {
            window.open(fighter.link, '_blank');
        } else {
            showNotification('Нет данных о бойце');
        }
    });
    
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
            
            // Добавляем значок
            const userIdNum = parseInt(auth.getUserId());
            let badgeType = '';
            
            if (APP_CONFIG.admins.includes(userIdNum)) {
                badgeType = 'admin';
            } else if (APP_CONFIG.trainers.includes(userIdNum)) {
                badgeType = 'trainer';
            } else if (APP_CONFIG.contracts[auth.getUserId()]) {
                badgeType = 'fighter';
            }
            
            if (badgeType) {
                // Удаляем старый значок если есть
                const oldBadge = document.getElementById('user-profile-badge');
                if (oldBadge) oldBadge.remove();
                
                const badgeContainer = document.createElement('div');
                badgeContainer.id = 'user-profile-badge';
                badgeContainer.className = 'user-badge-container';
                
                const badge = document.createElement('div');
                badge.className = `user-badge badge-${badgeType}`;
                
                let icon = '';
                switch(badgeType) {
                    case 'admin':
                        icon = '<svg class="badge-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12,2L4,5V11.09C4,16.14 7.41,20.85 12,22C16.59,20.85 20,16.14 20,11.09V5L12,2Z"/></svg>';
                        break;
                    case 'fighter':
                        icon = '<svg class="badge-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,5C13.66,5 15,6.34 15,8C15,9.66 13.66,11 12,11C10.34,11 9,9.66 9,8C9,6.34 10.34,5 12,5M18,13.66C18,15.5 16.5,17 14.66,17H9.34C7.5,17 6,15.5 6,13.66V12H18V13.66Z"/></svg>';
                        break;
                    case 'trainer':
                        icon = '<svg class="badge-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z"/></svg>';
                        break;
                }
                
                badge.innerHTML = icon;
                badgeContainer.appendChild(badge);
                
                // Добавляем рядом с аватаркой
                const avatarContainer = document.querySelector('.avatar-container');
                if (avatarContainer) {
                    avatarContainer.appendChild(badgeContainer);
                }
            }
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
    const userIdNum = parseInt(userId);
    
    // Мои билеты
    document.getElementById('my-tickets-btn').addEventListener('click', showMyTickets);
    
    // Мои бои - с проверкой контракта
    document.getElementById('my-fights-btn').addEventListener('click', function() {
        if (APP_CONFIG.contracts[userId] || APP_CONFIG.admins.includes(userIdNum) || APP_CONFIG.trainers.includes(userIdNum)) {
            showMyFightsModal();
        } else {
            showNotification('У вас не подписан контракт для участия в боях');
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
        if (APP_CONFIG.admins.includes(userIdNum)) {
            adminBtn.style.display = 'flex';
            adminBtn.addEventListener('click', showAdminPanel);
        } else {
            adminBtn.style.display = 'none';
        }
    }
}

function showMyTickets() {
    const modal = createModal('Мои билеты', 'ticket-alt');
    
    const tickets = JSON.parse(localStorage.getItem('efc_tickets') || '[]');
    
    let ticketsHTML = '';
    if (tickets.length === 0) {
        ticketsHTML = `
            <div class="no-fights">
                <i class="fas fa-ticket-alt" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>У вас пока нет купленных билетов</p>
            </div>
        `;
    } else {
        ticketsHTML = '<div class="fights-list-container">';
        tickets.forEach((ticket, index) => {
            ticketsHTML += `
                <div class="fight-item">
                    <h3>Билет #${index + 1}</h3>
                    <div class="fight-details">
                        <i class="fas fa-users"></i>
                        <span>${ticket.fighters || 'Бой'}</span>
                    </div>
                    <div class="fight-details">
                        <i class="far fa-calendar"></i>
                        <span>${ticket.date || 'Не указано'} ${ticket.time || ''}</span>
                    </div>
                    <div class="fight-details">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${ticket.place || 'Не указано'}</span>
                    </div>
                    <div class="fight-details">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Цена: ${ticket.price || 0} руб.</span>
                    </div>
                    <div class="fight-details">
                        <i class="far fa-clock"></i>
                        <span>Куплен: ${ticket.purchaseDate || 'Неизвестно'}</span>
                    </div>
                </div>
            `;
        });
        ticketsHTML += '</div>';
    }
    
    modal.innerHTML += `
        <div class="modal-body">
            ${ticketsHTML}
            <div class="form-buttons">
                ${tickets.length > 0 ? `
                    <button class="btn-secondary" id="clear-tickets-btn">
                        <i class="fas fa-trash"></i> Очистить все билеты
                    </button>
                ` : ''}
                <button class="btn-primary" id="close-modal-btn">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showModal(modal);
    
    // Очистка билетов
    if (tickets.length > 0) {
        modal.querySelector('#clear-tickets-btn').addEventListener('click', function() {
            if (confirm('Удалить все билеты?')) {
                localStorage.removeItem('efc_tickets');
                closeModal(modal);
                showNotification('Все билеты удалены');
            }
        });
    }
    
    // Закрытие модалки
    modal.querySelector('#close-modal-btn').addEventListener('click', () => closeModal(modal));
}

function showMyFightsModal() {
    const modal = createModal('Мои бои', 'fist-raised');
    
    const userId = window.TelegramAuth.getUserId();
    const fights = APP_CONFIG.userFights[userId] || [];
    
    let fightsHTML = '';
    if (fights.length === 0) {
        fightsHTML = `
            <div class="no-fights">
                <i class="fas fa-fist-raised" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>У вас пока нет запланированных боев</p>
            </div>
        `;
    } else {
        fightsHTML = '<div class="fights-list-container">';
        fights.forEach(fight => {
            let statusText = '';
            let statusClass = '';
            
            if (fight.status === 'upcoming') {
                statusText = 'Предстоящий';
                statusClass = 'upcoming';
            } else if (fight.status === 'completed') {
                statusText = 'Завершен';
                statusClass = 'completed';
            } else {
                statusText = 'Отменен';
                statusClass = 'cancelled';
            }
            
            fightsHTML += `
                <div class="fight-item">
                    <h3>Против: ${fight.opponent}</h3>
                    <div class="fight-details">
                        <i class="far fa-calendar"></i>
                        <span>${fight.date} ${fight.time}</span>
                    </div>
                    <div class="fight-details">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${fight.place}</span>
                    </div>
                    <div class="fight-details">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Гонорар: ${fight.reward} руб.</span>
                    </div>
                    <div class="fight-status ${statusClass}">${statusText}</div>
                </div>
            `;
        });
        fightsHTML += '</div>';
    }
    
    modal.innerHTML += `
        <div class="modal-body">
            ${fightsHTML}
            <div class="form-buttons">
                <button class="btn-primary" id="close-modal-btn">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showModal(modal);
    
    // Закрытие модалки
    modal.querySelector('#close-modal-btn').addEventListener('click', () => closeModal(modal));
}

function showApplicationForm() {
    const modal = createModal('Анкета для участия', 'edit');
    
    modal.innerHTML += `
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
                <label>Выберите тип тренировок *</label>
                <select id="app-training" class="form-input" required>
                    <option value="">Выберите тип тренировок</option>
                    ${APP_CONFIG.trainingTypes.map(type => 
                        `<option value="${type.id}">${type.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Состояние здоровья *</label>
                <textarea id="app-health" class="form-textarea" placeholder="Хронические заболевания, травмы..." required></textarea>
            </div>
            
            <div class="form-group">
                <label>Опыт в единоборствах</label>
                <textarea id="app-experience" class="form-textarea" placeholder="Опыт тренировок, соревнования..."></textarea>
            </div>
            
            <div class="form-buttons">
                <button class="btn-primary" id="submit-application-btn">
                    <i class="fas fa-paper-plane"></i> Отправить анкету в Telegram
                </button>
                <button class="btn-secondary" id="close-form-btn">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showModal(modal);
    
    // Отправка анкеты
    modal.querySelector('#submit-application-btn').addEventListener('click', function() {
        const fullName = document.getElementById('app-fullname').value;
        const birthDate = document.getElementById('app-birthdate').value;
        const contact = document.getElementById('app-contact').value;
        const training = document.getElementById('app-training').value;
        const height = document.getElementById('app-height').value;
        const weight = document.getElementById('app-weight').value;
        const health = document.getElementById('app-health').value;
        const experience = document.getElementById('app-experience').value;
        
        if (!fullName || !birthDate || !contact || !training || !height || !weight || !health) {
            showNotification('Заполните обязательные поля!');
            return;
        }
        
        const trainingName = APP_CONFIG.trainingTypes.find(t => t.id === training)?.name || training;
        
        const message = `📋 НОВАЯ АНКЕТА EFC™\n\n👤 ФИО: ${fullName}\n📅 Дата рождения: ${birthDate}\n📞 Телефон: ${contact}\n📏 Рост: ${height} см\n⚖️ Вес: ${weight} кг\n🥋 Тип тренировок: ${trainingName}\n❤️ Здоровье: ${health}\n🥊 Опыт: ${experience || 'Не указан'}\n\n👤 Пользователь: ${window.TelegramAuth.getUserName()}\n🆔 ID: ${window.TelegramAuth.getUserId()}`;
        const encodedMessage = encodeURIComponent(message);
        const telegramUrl = `https://t.me/EDEM_CR?text=${encodedMessage}`;
        
        window.open(telegramUrl, '_blank');
        
        // Сохраняем анкету в истории
        const applications = JSON.parse(localStorage.getItem('efc_applications') || '[]');
        applications.push({
            fullName,
            birthDate,
            contact,
            training,
            height,
            weight,
            health,
            experience,
            date: new Date().toISOString(),
            userId: window.TelegramAuth.getUserId()
        });
        localStorage.setItem('efc_applications', JSON.stringify(applications));
        
        closeModal(modal);
        showNotification('✅ Анкета сформирована! Откройте Telegram для отправки.');
    });
    
    // Закрытие формы
    modal.querySelector('#close-form-btn').addEventListener('click', () => closeModal(modal));
}

function showAdminPanel() {
    const modal = createModal('ADMIN PANEL', 'crown');
    
    const tickets = JSON.parse(localStorage.getItem('efc_tickets') || '[]');
    const applications = JSON.parse(localStorage.getItem('efc_applications') || '[]');
    
    modal.innerHTML += `
        <div class="modal-body">
            <div style="margin-bottom: 25px;">
                <h3 style="color: white; margin-bottom: 15px;">Статистика</h3>
                <div class="admin-stats-grid">
                    <div class="admin-stat-card">
                        <div class="admin-stat-value">${tickets.length}</div>
                        <div class="admin-stat-label">Билетов продано</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-value">${applications.length}</div>
                        <div class="admin-stat-label">Анкет получено</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-value">${APP_CONFIG.upcomingFights.length}</div>
                        <div class="admin-stat-label">Предстоящих боев</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-value">${Object.keys(APP_CONFIG.fighters).length}</div>
                        <div class="admin-stat-label">Бойцов в базе</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h3 style="color: white; margin-bottom: 15px;">Управление</h3>
                <div class="admin-actions">
                    <button class="admin-action-btn" id="manage-fighters-btn">
                        <i class="fas fa-users"></i>
                        <span>Управление бойцами</span>
                    </button>
                    <button class="admin-action-btn" id="manage-fights-btn">
                        <i class="fas fa-fist-raised"></i>
                        <span>Управление боями</span>
                    </button>
                    <button class="admin-action-btn" id="manage-banners-btn">
                        <i class="fas fa-images"></i>
                        <span>Управление баннерами</span>
                    </button>
                    <button class="admin-action-btn" id="view-applications-btn">
                        <i class="fas fa-file-alt"></i>
                        <span>Просмотр анкет (${applications.length})</span>
                    </button>
                    <button class="admin-action-btn" id="view-tickets-btn">
                        <i class="fas fa-ticket-alt"></i>
                        <span>Просмотр билетов (${tickets.length})</span>
                    </button>
                    <button class="admin-action-btn" id="export-data-btn">
                        <i class="fas fa-download"></i>
                        <span>Экспорт данных</span>
                    </button>
                    <button class="admin-action-btn" id="clear-cache-btn">
                        <i class="fas fa-trash"></i>
                        <span>Очистить кэш изображений</span>
                    </button>
                </div>
            </div>
            
            <div class="form-buttons">
                <button class="btn-secondary" id="clear-all-data-btn">
                    <i class="fas fa-trash"></i> Очистить все данные
                </button>
                <button class="btn-primary" id="close-admin-btn">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showModal(modal);
    
    // Обработчики кнопок админ-панели
    modal.querySelector('#manage-fighters-btn').addEventListener('click', () => {
        showNotification('Управление бойцами - в разработке');
    });
    
    modal.querySelector('#manage-fights-btn').addEventListener('click', () => {
        showNotification('Управление боями - в разработке');
    });
    
    modal.querySelector('#manage-banners-btn').addEventListener('click', () => {
        showNotification('Управление баннерами - в разработке');
    });
    
    modal.querySelector('#view-applications-btn').addEventListener('click', () => {
        showApplicationsList(applications);
    });
    
    modal.querySelector('#view-tickets-btn').addEventListener('click', () => {
        showTicketsList(tickets);
    });
    
    modal.querySelector('#export-data-btn').addEventListener('click', () => {
        exportAdminData(tickets, applications);
    });
    
    modal.querySelector('#clear-cache-btn').addEventListener('click', () => {
        if (confirm('Очистить кэш изображений?')) {
            ImageCache.clearCache();
            showNotification('Кэш изображений очищен');
        }
    });
    
    // Очистка данных
    modal.querySelector('#clear-all-data-btn').addEventListener('click', function() {
        if (confirm('УДАЛИТЬ ВСЕ ДАННЫЕ?\n\nВсе билеты и анкеты будут удалены.')) {
            localStorage.removeItem('efc_tickets');
            localStorage.removeItem('efc_applications');
            closeModal(modal);
            showNotification('Все данные удалены');
        }
    });
    
    modal.querySelector('#close-admin-btn').addEventListener('click', () => closeModal(modal));
}

function showApplicationsList(applications) {
    const modal = createModal('Анкеты пользователей', 'file-alt');
    
    let applicationsHTML = '';
    if (applications.length === 0) {
        applicationsHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 20px;">Анкет нет</p>';
    } else {
        applicationsHTML = '<div style="max-height: 400px; overflow-y: auto;">';
        applications.forEach((app, index) => {
            const trainingName = APP_CONFIG.trainingTypes.find(t => t.id === app.training)?.name || app.training;
            applicationsHTML += `
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <strong style="color: white;">${app.fullName}</strong>
                        <span style="color: #4ECDC4; font-size: 0.9rem;">#${index + 1}</span>
                    </div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">
                        <p><i class="fas fa-phone"></i> ${app.contact}</p>
                        <p><i class="fas fa-birthday-cake"></i> ${app.birthDate}</p>
                        <p><i class="fas fa-ruler-vertical"></i> ${app.height} см / ${app.weight} кг</p>
                        <p><i class="fas fa-dumbbell"></i> ${trainingName}</p>
                        <p><i class="far fa-calendar"></i> ${new Date(app.date).toLocaleDateString('ru-RU')}</p>
                    </div>
                </div>
            `;
        });
        applicationsHTML += '</div>';
    }
    
    modal.innerHTML += `
        <div class="modal-body">
            ${applicationsHTML}
            <div class="form-buttons">
                <button class="btn-primary" id="close-modal-btn">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showModal(modal);
    
    modal.querySelector('#close-modal-btn').addEventListener('click', () => closeModal(modal));
}

function showTicketsList(tickets) {
    const modal = createModal('Проданные билеты', 'ticket-alt');
    
    let ticketsHTML = '';
    if (tickets.length === 0) {
        ticketsHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 20px;">Билетов нет</p>';
    } else {
        const totalRevenue = tickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);
        
        ticketsHTML = `
            <div style="margin-bottom: 15px; padding: 10px; background: rgba(78, 205, 196, 0.1); border-radius: 10px;">
                <p style="text-align: center; color: #4ECDC4; font-weight: bold;">
                    Общая выручка: ${totalRevenue} руб.
                </p>
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
        `;
        
        tickets.forEach((ticket, index) => {
            ticketsHTML += `
                <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <strong style="color: white;">Билет #${index + 1}</strong>
                        <span style="color: #FF6B6B; font-weight: bold;">${ticket.price || 0} руб.</span>
                    </div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">
                        <p><i class="fas fa-users"></i> ${ticket.fighters || 'Бой'}</p>
                        <p><i class="far fa-calendar"></i> ${ticket.date || 'Не указано'} ${ticket.time || ''}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${ticket.place || 'Не указано'}</p>
                        <p><i class="far fa-clock"></i> Куплен: ${ticket.purchaseDate || 'Неизвестно'}</p>
                    </div>
                </div>
            `;
        });
        ticketsHTML += '</div>';
    }
    
    modal.innerHTML += `
        <div class="modal-body">
            ${ticketsHTML}
            <div class="form-buttons">
                <button class="btn-primary" id="close-modal-btn">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showModal(modal);
    
    modal.querySelector('#close-modal-btn').addEventListener('click', () => closeModal(modal));
}

function exportAdminData(tickets, applications) {
    const data = {
        tickets,
        applications,
        exportDate: new Date().toISOString(),
        stats: {
            totalTickets: tickets.length,
            totalApplications: applications.length,
            totalRevenue: tickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0)
        }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `efc-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Данные экспортированы');
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
    
    // Покупка билетов
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('buy-ticket-btn') || 
            e.target.closest('.buy-ticket-btn')) {
            const btn = e.target.classList.contains('buy-ticket-btn') ? e.target : e.target.closest('.buy-ticket-btn');
            const fightId = btn.getAttribute('data-fight-id');
            buyTicket(fightId);
        }
    });
    
    // Кнопка фильтра на странице бойцов
    const filterBtn = document.getElementById('open-filter-modal-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', showFilterModal);
    }
}

function showFilterModal() {
    const modal = createModal('Фильтр бойцов', 'filter');
    
    modal.innerHTML += `
        <div class="modal-body">
            <div class="filter-section">
                <h3>Весовая категория</h3>
                <div class="filter-group">
                    <div class="filter-option ${activeFilters.weight.includes('light') ? 'active' : ''}">
                        <input type="checkbox" id="weight-light" ${activeFilters.weight.includes('light') ? 'checked' : ''}>
                        <label for="weight-light">Легкий вес</label>
                    </div>
                    <div class="filter-option ${activeFilters.weight.includes('middle') ? 'active' : ''}">
                        <input type="checkbox" id="weight-middle" ${activeFilters.weight.includes('middle') ? 'checked' : ''}>
                        <label for="weight-middle">Средний вес</label>
                    </div>
                    <div class="filter-option ${activeFilters.weight.includes('heavy') ? 'active' : ''}">
                        <input type="checkbox" id="weight-heavy" ${activeFilters.weight.includes('heavy') ? 'checked' : ''}>
                        <label for="weight-heavy">Тяжелый вес</label>
                    </div>
                    <div class="filter-option ${activeFilters.weight.includes('super_heavy') ? 'active' : ''}">
                        <input type="checkbox" id="weight-super_heavy" ${activeFilters.weight.includes('super_heavy') ? 'checked' : ''}>
                        <label for="weight-super_heavy">Супертяжелый вес</label>
                    </div>
                </div>
            </div>
            
            <div class="filter-section">
                <h3>Вид спорта</h3>
                <div class="filter-group">
                    <div class="filter-option ${activeFilters.sport.includes('mma') ? 'active' : ''}">
                        <input type="checkbox" id="sport-mma" ${activeFilters.sport.includes('mma') ? 'checked' : ''}>
                        <label for="sport-mma">MMA</label>
                    </div>
                    <div class="filter-option ${activeFilters.sport.includes('boxing') ? 'active' : ''}">
                        <input type="checkbox" id="sport-boxing" ${activeFilters.sport.includes('boxing') ? 'checked' : ''}>
                        <label for="sport-boxing">Бокс</label>
                    </div>
                    <div class="filter-option ${activeFilters.sport.includes('wrestling') ? 'active' : ''}">
                        <input type="checkbox" id="sport-wrestling" ${activeFilters.sport.includes('wrestling') ? 'checked' : ''}>
                        <label for="sport-wrestling">Борьба</label>
                    </div>
                    <div class="filter-option ${activeFilters.sport.includes('hosting') ? 'active' : ''}">
                        <input type="checkbox" id="sport-hosting" ${activeFilters.sport.includes('hosting') ? 'checked' : ''}>
                        <label for="sport-hosting">Хостинг</label>
                    </div>
                </div>
            </div>
            
            <div class="form-buttons">
                <button class="btn-primary" id="apply-filters-btn">
                    <i class="fas fa-check"></i> Применить
                </button>
                <button class="btn-secondary" id="reset-filters-btn">
                    <i class="fas fa-times"></i> Сбросить
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    showModal(modal);
    
    // Обработчики чекбоксов
    modal.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                const checkbox = this.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                this.classList.toggle('active');
            }
        });
    });
    
    // Применить фильтры
    modal.querySelector('#apply-filters-btn').addEventListener('click', function() {
        const selectedWeights = [];
        const selectedSports = [];
        
        modal.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            if (checkbox.id.startsWith('weight-')) {
                selectedWeights.push(checkbox.id.replace('weight-', ''));
            } else if (checkbox.id.startsWith('sport-')) {
                selectedSports.push(checkbox.id.replace('sport-', ''));
            }
        });
        
        activeFilters.weight = selectedWeights;
        activeFilters.sport = selectedSports;
        
        applyFiltersToFighters();
        closeModal(modal);
        showNotification('Фильтры применены');
    });
    
    // Сбросить фильтры
    modal.querySelector('#reset-filters-btn').addEventListener('click', function() {
        activeFilters.weight = [];
        activeFilters.sport = [];
        
        modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        modal.querySelectorAll('.filter-option').forEach(option => {
            option.classList.remove('active');
        });
        
        applyFiltersToFighters();
        showNotification('Фильтры сброшены');
    });
}

function applyFiltersToFighters() {
    const fighters = document.querySelectorAll('.fighter-card');
    let visibleCount = 0;
    
    fighters.forEach(fighter => {
        const fighterWeight = fighter.dataset.weight;
        const fighterSport = fighter.dataset.sport;
        
        let weightMatch = activeFilters.weight.length === 0 || activeFilters.weight.includes(fighterWeight);
        let sportMatch = activeFilters.sport.length === 0 || activeFilters.sport.includes(fighterSport);
        
        if (weightMatch && sportMatch) {
            fighter.style.display = 'flex';
            visibleCount++;
            
            // Анимация появления
            fighter.style.animation = `cardAppear 0.4s ease-out ${visibleCount * 0.05}s both`;
        } else {
            fighter.style.display = 'none';
        }
    });
    
    // Если нет бойцов по фильтру
    if (visibleCount === 0 && fighters.length > 0) {
        const container = document.getElementById('fighters-container');
        if (container && !container.querySelector('.no-fighters-message')) {
            const message = document.createElement('div');
            message.className = 'no-fighters-message';
            message.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.6);">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>Бойцов по выбранным фильтрам не найдено</p>
                    <button class="btn-secondary" id="reset-filter-btn" style="margin-top: 20px;">
                        <i class="fas fa-times"></i> Сбросить фильтры
                    </button>
                </div>
            `;
            container.appendChild(message);
            
            message.querySelector('#reset-filter-btn').addEventListener('click', () => {
                activeFilters.weight = [];
                activeFilters.sport = [];
                applyFiltersToFighters();
                message.remove();
            });
        }
    } else {
        const message = container?.querySelector('.no-fighters-message');
        if (message) message.remove();
    }
}

function buyTicket(fightId) {
    const fight = APP_CONFIG.upcomingFights.find(f => f.id == fightId);
    if (!fight) return;
    
    // Сохраняем билет в localStorage
    const tickets = JSON.parse(localStorage.getItem('efc_tickets') || '[]');
    const ticket = {
        id: Date.now(),
        fightId: fight.id,
        fighters: fight.fighters,
        date: fight.date,
        time: fight.time,
        place: fight.place,
        price: fight.ticketPrice,
        purchaseDate: new Date().toLocaleDateString('ru-RU')
    };
    
    tickets.push(ticket);
    localStorage.setItem('efc_tickets', JSON.stringify(tickets));
    
    // Формируем сообщение для Telegram
    const message = `🎫 ПОКУПКА БИЛЕТА EFC™\n\n🥊 Бой: ${fight.fighters.join(' vs ')}\n📅 Дата: ${fight.date}\n🕒 Время: ${fight.time}\n📍 Место: ${fight.place}\n💰 Цена: ${fight.ticketPrice} руб.\n\n👤 Покупатель: ${window.TelegramAuth.getUserName()}\n🆔 ID: ${window.TelegramAuth.getUserId()}\n\n✅ Билет успешно забронирован в приложении!`;
    const encodedMessage = encodeURIComponent(message);
    const telegramUrl = `https://t.me/EDEM_CR?text=${encodedMessage}`;
    
    window.open(telegramUrl, '_blank');
    showNotification('✅ Билет куплен! Откройте Telegram для подтверждения.');
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
        setTimeout(() => loadFighters(), 100);
    } else if (page === 'home') {
        setTimeout(() => loadBanners(), 100);
    }
}

// Вспомогательные функции
function createModal(title, icon) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-${icon}"></i> ${title}</h2>
                <button class="modal-close">&times;</button>
            </div>
    `;
    
    modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
    
    return modal;
}

function showModal(modal) {
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.add('closing');
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
        document.body.style.overflow = '';
    }, 300);
}

function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-text">${message}</div>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Показываем с анимацией
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Закрытие по клику
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    });
    
    // Автозакрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }
    }, 5000);
}

// Устанавливаем активную кнопку при загрузке
document.querySelector('.nav-btn[data-page="home"]').classList.add('active');