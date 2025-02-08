// State Management
const state = {
    darkMode: false,
    dropdownActive: false,
    activeModal: null,
    activeSection: 'allLinks',
    counts: {
        allLinks: 0,
        groupLayout: 0,
        schedule: 0,
        savedWindows: 0,
        workspaces: 0
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadStoredData();
});

// App Initialization
function initializeApp() {
    // Load saved dark mode state
    chrome.storage.local.get(['darkMode'], (result) => {
        state.darkMode = result.darkMode || false;
        applyDarkModeState();
    });

    // Initialize counters
    updateAllCounts();
}

// Event Listeners Setup
function setupEventListeners() {
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Dropdown toggle
    document.getElementById('addNewLink').addEventListener('click', toggleDropdown);
    
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => handleNavigation(e.currentTarget));
    });
    
    // Dropdown items
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            handleDropdownAction(action);
            toggleDropdown();
        });
    });

    // Modal close buttons
    document.querySelectorAll('.close-modal, .cancel-button').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Save buttons
    setupSaveHandlers();

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.add-link-container')) {
            closeDropdown();
        }
    });
}

// Navigation Handler
function handleNavigation(navItem) {
    // Remove active class from all items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    navItem.classList.add('active');
    
    // Update active section
    state.activeSection = navItem.dataset.section;
    
    // Load section content
    loadSectionContent(state.activeSection);
}

// Load Section Content
function loadSectionContent(section) {
    const contentContainer = document.querySelector('.dynamic-content');
    chrome.storage.local.get([section], (result) => {
        const items = result[section] || [];
        renderSectionContent(contentContainer, section, items);
    });
}

// Render Section Content
function renderSectionContent(container, section, items) {
    container.innerHTML = ''; // Clear existing content
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No ${section} added yet</p>
                <button class="add-new-btn" data-section="${section}">Add Your First ${section}</button>
            </div>
        `;
        return;
    }

    // Create appropriate content based on section
    switch (section) {
        case 'allLinks':
            renderLinks(container, items);
            break;
        case 'groupLayout':
            renderGroups(container, items);
            break;
        // Add other section renders as needed
    }
}

// Save Handlers Setup
function setupSaveHandlers() {
    // All Links Save Handler
    setupModalSave('allLinksModal', () => {
        const linkData = {
            title: document.getElementById('linkTitle').value,
            url: document.getElementById('linkUrl').value,
            description: document.getElementById('linkDescription').value,
            tags: document.getElementById('linkTags').value.split(',').map(tag => tag.trim()),
            icon: document.getElementById('linkIcon').value || '🔗'
        };
        saveItem('allLinks', linkData);
    });

    // Group Layout Save Handler
    setupModalSave('groupLayoutModal', () => {
        const groupData = {
            name: document.getElementById('groupName').value,
            description: document.getElementById('groupDescription').value,
            icon: document.getElementById('groupIcon').value || '📁',
            color: document.getElementById('groupColor').value
        };
        saveItem('groupLayout', groupData);
    });

    // Schedule Save Handler
    setupModalSave('scheduleModal', () => {
        const scheduleData = {
            title: document.getElementById('scheduleTitle').value,
            time: document.getElementById('scheduleTime').value,
            repeat: document.getElementById('scheduleRepeat').value,
            links: getScheduleLinks()
        };
        saveItem('schedule', scheduleData);
    });
}

// Save Item to Storage
function saveItem(section, data) {
    chrome.storage.local.get([section], (result) => {
        const items = result[section] || [];
        const newItem = {
            ...data,
            id: Date.now(),
            createdAt: new Date().toISOString()
        };
        
        items.push(newItem);
        
        const saveData = {};
        saveData[section] = items;
        
        chrome.storage.local.set(saveData, () => {
            updateCount(section, items.length);
            loadSectionContent(section);
            closeAllModals();
            clearFormInputs(section);
        });
    });
}

// Update Counts
function updateAllCounts() {
    const sections = ['allLinks', 'groupLayout', 'schedule', 'savedWindows', 'workspaces'];
    sections.forEach(section => {
        chrome.storage.local.get([section], (result) => {
            const count = (result[section] || []).length;
            updateCount(section, count);
        });
    });
}

// Update Single Count
function updateCount(section, count) {
    state.counts[section] = count;
    const countElement = document.getElementById(`${section}Count`);
    if (countElement) {
        countElement.textContent = count;
    }
}

// Modal Handlers
function setupModalSave(modalId, saveFunction) {
    const modal = document.getElementById(modalId);
    const saveButton = modal.querySelector('.save-button');
    saveButton.addEventListener('click', saveFunction);
}

// Toggle Dropdown
function toggleDropdown(e) {
    if (e) e.stopPropagation();
    const dropdownMenu = document.getElementById('addOptionsMenu');
    state.dropdownActive = !state.dropdownActive;
    dropdownMenu.classList.toggle('active', state.dropdownActive);
}

// Close Dropdown
function closeDropdown() {
    const dropdownMenu = document.getElementById('addOptionsMenu');
    state.dropdownActive = false;
    dropdownMenu.classList.remove('active');
}

// Handle Dropdown Actions
function handleDropdownAction(action) {
    closeAllModals();
    
    const modalMap = {
        addLink: 'allLinksModal',
        addGroup: 'groupLayoutModal',
        saveSession: 'savedWindowsModal'
    };
    
    const modalId = modalMap[action];
    if (modalId) {
        document.getElementById(modalId).classList.add('active');
        state.activeModal = modalId;
    }
}

// Close All Modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    state.activeModal = null;
}

// Clear Form Inputs
function clearFormInputs(section) {
    const modal = document.getElementById(`${section}Modal`);
    if (modal) {
        modal.querySelectorAll('input, textarea, select').forEach(input => {
            input.value = '';
        });
    }
}

// Search Functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    chrome.storage.local.get([state.activeSection], (result) => {
        const items = result[state.activeSection] || [];
        const filteredItems = items.filter(item => 
            (item.title || item.name || '').toLowerCase().includes(searchTerm) ||
            (item.description || '').toLowerCase().includes(searchTerm)
        );
        
        const contentContainer = document.querySelector('.dynamic-content');
        renderSectionContent(contentContainer, state.activeSection, filteredItems);
    });
}

// Dark Mode Toggle
function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    applyDarkModeState();
    chrome.storage.local.set({ darkMode: state.darkMode });
}

// Apply Dark Mode State
function applyDarkModeState() {
    document.body.classList.toggle('dark', state.darkMode);
    document.getElementById('darkModeToggle').textContent = state.darkMode ? '☀️' : '🌙';
}

// Helper function for getting schedule links
function getScheduleLinks() {
    const linksContainer = document.getElementById('scheduleLinks');
    const linkInputs = linksContainer.querySelectorAll('input[type="url"]');
    return Array.from(linkInputs).map(input => input.value).filter(url => url);
}

// Load Stored Data
function loadStoredData() {
    const sections = ['allLinks', 'groupLayout', 'schedule', 'savedWindows', 'workspaces'];
    sections.forEach(section => {
        chrome.storage.local.get([section], (result) => {
            if (result[section]) {
                updateCount(section, result[section].length);
            }
        });
    });
    
    // Load initial section content
    loadSectionContent(state.activeSection);
}

// Add this function to your first file's code
function renderLinks(container, items) {
    container.innerHTML = ''; // Clear previous content
    
    items.forEach(item => {
        const linkElement = document.createElement('div');
        linkElement.className = 'link-item';
        linkElement.innerHTML = `
            <div class="link-icon">${item.icon || '🔗'}</div>
            <div class="link-content">
                <a href="${item.url}" target="_blank" class="link-title">${item.title}</a>
                <div class="link-meta">
                    <span class="link-url">${item.url}</span>
                    <span class="link-date">${new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                ${item.description ? `<p class="link-description">${item.description}</p>` : ''}
                ${item.tags.length ? `<div class="link-tags">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
            </div>
        `;
        container.appendChild(linkElement);
    });
}

// Placeholder function for rendering groups - implement this
function renderGroups(container, items) {
    container.innerHTML = '<p>Group layout rendering is not yet implemented.</p>';
    // Implement your group layout rendering logic here
    // Example:
    /*
    items.forEach(item => {
        const groupElement = document.createElement('div');
        groupElement.className = 'group-item';
        groupElement.textContent = item.name;
        container.appendChild(groupElement);
    });
    */
}