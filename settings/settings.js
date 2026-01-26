const appConfig = [
    { name: 'ChatGPT', icon: '../assets/icons/openai-svgrepo-com.svg' },
    { name: 'Gemini', icon: '../assets/icons/google-gemini-icon.svg' },
    { name: 'Drive', icon: '../assets/icons/google-drive-svgrepo-com.svg' },
    { name: 'Mail', icon: '../assets/icons/google-mail-svgrepo-com.svg' },
    { name: 'Translate', icon: '../assets/icons/google-translate-svgrepo-com.svg' },
    { name: 'Search', icon: '../assets/icons/search-4-svgrepo-com.svg' },
    { name: 'Telegram', icon: '../assets/icons/telegram-svgrepo-com.svg' },
    { name: 'WhatsApp', icon: '../assets/icons/whatsapp-svgrepo-com.svg' },
    { name: 'Notion', icon: '../assets/icons/notion-svgrepo-com.svg' },
    { name: 'Keep', icon: '../assets/icons/google-keep.svg' }
];

const sizeConfig = {
    small: { width: '248px' },
    medium: { width: '340px' },
    large: { width: '540px' }
};

const shapeConfig = {
    circle: '50%',
    rounded: '8px',
    square: '0px'
};

// Default State
let state = {
    theme: 'dark',
    islandSize: 'medium',
    iconShape: 'rounded',
    showLabels: true
};

function init() {
    // Load from storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['theme', 'islandSize', 'iconShape', 'showLabels'], (items) => {
            if (items.theme) state.theme = items.theme;
            if (items.islandSize) state.islandSize = items.islandSize;
            if (items.iconShape) state.iconShape = items.iconShape;
            if (items.showLabels !== undefined) state.showLabels = items.showLabels;

            updateUI();
        });
    } else {
        // Fallback for local testing if no extension API
        updateUI();
    }

    bindEvents();
}

function save() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set(state);
    }
}

function updateUI() {
    // Update Active Buttons
    updateOptionGroup('themeOptions', state.theme);
    updateOptionGroup('sizeOptions', state.islandSize);
    updateOptionGroup('shapeOptions', state.iconShape);

    // Update Toggle
    const toggle = document.getElementById('labelsToggle').querySelector('.toggle-switch');
    if (state.showLabels) toggle.classList.add('checked');
    else toggle.classList.remove('checked');

    // Render Preview
    renderPreview();
}

function updateOptionGroup(id, value) {
    const group = document.getElementById(id);
    const btns = group.querySelectorAll('.option-btn');
    btns.forEach(btn => {
        if (btn.dataset.value === value) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function renderPreview() {
    const previewIsland = document.getElementById('previewIsland');
    const previewApps = document.getElementById('previewApps');

    // 1. Theme Styles
    let isDark = state.theme === 'dark';
    if (state.theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
        previewIsland.classList.remove('island-light');
    } else {
        previewIsland.classList.add('island-light');
    }

    // 2. Width
    const width = sizeConfig[state.islandSize].width;
    previewIsland.style.width = width;

    // 3. Height (Labels)
    previewIsland.style.height = state.showLabels ? '96px' : '64px';

    // 4. Shape
    const radius = shapeConfig[state.iconShape];

    // 5. Render Apps
    previewApps.innerHTML = '';
    appConfig.forEach(app => {
        const item = document.createElement('div');
        item.className = 'app-item';

        const iconBox = document.createElement('div');
        iconBox.className = 'app-icon';
        iconBox.style.borderRadius = radius;

        const img = document.createElement('img');
        img.src = app.icon;

        iconBox.appendChild(img);
        item.appendChild(iconBox);

        if (state.showLabels) {
            const label = document.createElement('div');
            label.className = 'app-label';
            label.textContent = app.name;
            item.appendChild(label);
        }

        previewApps.appendChild(item);
    });
}

function bindEvents() {
    // Option Buttons
    ['themeOptions', 'sizeOptions', 'shapeOptions'].forEach(id => {
        const group = document.getElementById(id);
        group.addEventListener('click', (e) => {
            const btn = e.target.closest('.option-btn');
            if (btn) {
                const val = btn.dataset.value;
                if (id === 'themeOptions') state.theme = val;
                if (id === 'sizeOptions') state.islandSize = val;
                if (id === 'shapeOptions') state.iconShape = val;

                save();
                updateUI();
            }
        });
    });

    // Toggle
    document.getElementById('labelsToggle').addEventListener('click', () => {
        state.showLabels = !state.showLabels;
        save();
        updateUI();
    });

    // Close
    document.getElementById('closeBtn').addEventListener('click', () => {
        window.parent.postMessage({ action: 'close_sidebar' }, '*');
    });
}

// Run
document.addEventListener('DOMContentLoaded', init);
