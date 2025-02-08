// darkmode/darkmode.js
class DarkModeSystem {
    constructor() {
        this.state = {
            darkMode: false,
            storageKey: 'darkModeState'
        };
        
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        // Setup toggle button
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleDarkMode());
        }

        // Load initial state
        chrome.storage.local.get(['darkModeState'], (result) => {
            this.state.darkMode = result.darkModeState || false;
            this.applyTheme();
        });
    }

    toggleDarkMode() {
        this.state.darkMode = !this.state.darkMode;
        this.applyTheme();
        this.saveState();
    }

    applyTheme() {
        document.body.classList.toggle('dark', this.state.darkMode);
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.state.darkMode ? '☀️' : '🌙';
        }
    }

    saveState() {
        chrome.storage.local.set({ 
            darkModeState: this.state.darkMode 
        });
    }
}

// Initialize the dark mode system
const darkMode = new DarkModeSystem();