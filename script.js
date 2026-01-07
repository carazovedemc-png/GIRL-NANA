// Конфигурация
const MODEL_UID = '23b3b5d1c1d54783bf189da609ffcace';
let iframe = null;
let viewer = null;
let autoRotate = false;

// Инициализация 3D просмотрщика
function initViewer() {
    const container = document.getElementById('viewer-container');
    
    // Создаем iframe для Sketchfab Viewer
    iframe = document.createElement('iframe');
    iframe.id = 'sketchfab-viewer';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.allow = 'autoplay; fullscreen; xr-spatial-tracking';
    iframe.allowfullscreen = true;
    iframe.mozallowfullscreen = true;
    iframe.webkitallowfullscreen = true;
    
    // Собираем URL с параметрами
    const baseUrl = `https://sketchfab.com/models/${MODEL_UID}/embed`;
    const params = new URLSearchParams({
        ui_controls: 0,
        ui_infos: 0,
        ui_stop: 0,
        ui_inspector: 0,
        ui_watermark: 0,
        ui_help: 0,
        autostart: 1,
        preload: 1,
        camera: 0,
        transparent: 0,
        autospin: 0.2
    });
    
    iframe.src = `${baseUrl}?${params.toString()}`;
    
    // Очищаем контейнер и добавляем iframe
    container.innerHTML = '';
    container.appendChild(iframe);
    
    // Скрываем загрузку
    document.querySelector('.loading').style.display = 'none';
}

// Управление кнопками
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация
    initViewer();
    
    // Кнопка сброса вида
    document.getElementById('reset-view').addEventListener('click', function() {
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'viewerReset'
            }, '*');
        }
    });
    
    // Кнопка авто-вращения
    document.getElementById('auto-rotate').addEventListener('click', function() {
        autoRotate = !autoRotate;
        const btn = document.getElementById('auto-rotate');
        
        if (autoRotate) {
            btn.innerHTML = '⏸️ Остановить вращение';
            iframe.contentWindow.postMessage({
                type: 'viewerSetAutospin',
                value: 0.5
            }, '*');
        } else {
            btn.innerHTML = '🔄 Авто-вращение';
            iframe.contentWindow.postMessage({
                type: 'viewerSetAutospin',
                value: 0
            }, '*');
        }
    });
    
    // Кнопка полного экрана
    document.getElementById('fullscreen').addEventListener('click', function() {
        const container = document.getElementById('viewer-container');
        
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });
    
    // Обработка сообщений от Sketchfab
    window.addEventListener('message', function(event) {
        if (event.source !== iframe.contentWindow) return;
        
        const message = event.data;
        console.log('Message from viewer:', message);
    });
    
    // Обновление кнопки при выходе из полноэкранного режима
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    
    function updateFullscreenButton() {
        const btn = document.getElementById('fullscreen');
        if (document.fullscreenElement) {
            btn.innerHTML = '📱 Обычный экран';
        } else {
            btn.innerHTML = '📺 Полный экран';
        }
    }
});