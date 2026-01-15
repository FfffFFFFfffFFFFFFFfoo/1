// Общие функции для системы Умный дом

// Обновление даты и времени
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    const dateTimeStr = now.toLocaleDateString('ru-RU', options);
    
    // Обновляем на всех страницах где есть этот элемент
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeStr;
    }
    
    // Для страницы освещения
    const currentTimeElement = document.getElementById('currentTime');
    if (currentTimeElement) {
        currentTimeElement.textContent = now.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Инициализация всех переключателей
    initSwitches();
    
    // Загрузка сохраненных настроек
    loadSettings();
});

// Общие уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Сохранение настроек в localStorage
function saveSetting(key, value) {
    try {
        localStorage.setItem(`smart_home_${key}`, JSON.stringify(value));
    } catch (e) {
        console.error('Ошибка сохранения настроек:', e);
    }
}

// Загрузка настроек из localStorage
function loadSetting(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(`smart_home_${key}`);
        return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
        console.error('Ошибка загрузки настроек:', e);
        return defaultValue;
    }
}

// Инициализация всех переключателей
function initSwitches() {
    const switches = document.querySelectorAll('.form-check-input[type="checkbox"]');
    switches.forEach(switchElement => {
        switchElement.addEventListener('change', function() {
            const deviceId = this.id;
            const state = this.checked;
            
            // Сохраняем состояние
            saveSetting(deviceId, state);
            
            // Показываем уведомление
            const deviceName = this.closest('.device-control')?.querySelector('h6')?.textContent || 'Устройство';
            showNotification(`${deviceName}: ${state ? 'включено' : 'выключено'}`, 
                           state ? 'success' : 'warning');
        });
    });
}

// Загрузка всех сохраненных настроек
function loadSettings() {
    const switches = document.querySelectorAll('.form-check-input[type="checkbox"]');
    switches.forEach(switchElement => {
        const savedState = loadSetting(switchElement.id);
        if (savedState !== null) {
            switchElement.checked = savedState;
            
            // Активируем зависимые элементы
            if (switchElement.id.includes('Switch')) {
                const dependentElements = document.querySelectorAll(`[id*="${switchElement.id.replace('Switch', '')}"]`);
                dependentElements.forEach(element => {
                    if (element.type === 'range' || element.tagName === 'SELECT') {
                        element.disabled = !savedState;
                    }
                });
            }
        }
    });
}

// Проверка соединения
function checkConnection() {
    if (!navigator.onLine) {
        showNotification('Отсутствует подключение к интернету', 'danger');
        return false;
    }
    return true;
}

// Экспорт настроек
function exportSettings() {
    const settings = {};
    const switches = document.querySelectorAll('.form-check-input[type="checkbox"]');
    
    switches.forEach(switchElement => {
        settings[switchElement.id] = switchElement.checked;
    });
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'smart_home_settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Настройки экспортированы', 'success');
}

// Импорт настроек
function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const settings = JSON.parse(e.target.result);
            
            // Применяем настройки
            Object.keys(settings).forEach(key => {
                const element = document.getElementById(key);
                if (element && element.type === 'checkbox') {
                    element.checked = settings[key];
                    element.dispatchEvent(new Event('change'));
                }
            });
            
            showNotification('Настройки импортированы', 'success');
        } catch (error) {
            showNotification('Ошибка при импорте настроек', 'danger');
        }
    };
    reader.readAsText(file);
}

// Сброс всех настроек
function resetSettings() {
    if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
        localStorage.clear();
        location.reload();
    }
}
