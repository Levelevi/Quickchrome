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
    setupSaveHandlers();
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
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    navItem.classList.add('active');
    state.activeSection = navItem.dataset.section;
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
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No ${section} added yet</p>
                <button class="add-new-btn" data-section="${section}">Add Your First ${section}</button>
            </div>
        `;
        return;
    }

    switch (section) {
        case 'allLinks':
            renderLinks(container, items);
            break;
        case 'groupLayout':
            renderGroups(container, items);
            break;
    }
}

// Save Handlers Setup
function setupSaveHandlers() {
    // All Links Save Handler
    const allLinksModal = document.getElementById('allLinksModal');
    if (allLinksModal) {
        const saveButton = allLinksModal.querySelector('.save-button');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                // Get window settings from the feature if available
                const windowFeature = window.linkWindowFeature;
                const windowSettings = windowFeature ? windowFeature.getState() : null;

                const linkData = {
                    title: document.getElementById('linkTitle').value.trim(),
                    url: document.getElementById('linkUrl').value.trim(),
                    description: document.getElementById('linkDescription')?.value?.trim() || '',
                    tags: document.getElementById('linkTags')?.value?.split(',').map(tag => tag.trim()) || [],
                    icon: document.getElementById('linkIcon')?.value?.trim() || '🔗',
                    windowSettings: windowSettings
                };

                if (!linkData.title || !linkData.url) {
                    alert('Please enter both title and URL');
                    return;
                }

                // Ensure URL has protocol
                if (!linkData.url.startsWith('http://') && !linkData.url.startsWith('https://')) {
                    linkData.url = 'https://' + linkData.url;
                }

                saveItem('allLinks', linkData);
            });
        }
    }

    // Group Layout Save Handler
    setupModalSave('groupLayoutModal', () => {
        const groupData = {
            name: document.getElementById('groupName').value.trim(),
            description: document.getElementById('groupDescription').value.trim(),
            icon: document.getElementById('groupIcon').value.trim() || '📁',
            color: document.getElementById('groupColor').value.trim()
        };
        saveItem('groupLayout', groupData);
    });

    // Schedule Save Handler
    setupModalSave('scheduleModal', () => {
        const scheduleData = {
            title: document.getElementById('scheduleTitle').value.trim(),
            time: document.getElementById('scheduleTime').value.trim(),
            repeat: document.getElementById('scheduleRepeat').value.trim(),
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
    if (!modal) return;
    const saveButton = modal.querySelector('.save-button');
    if (!saveButton) return;
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
    
    loadSectionContent(state.activeSection);
}



function renderLinks(container, items) {
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No links added yet</p>
                <button class="add-new-btn" data-action="addLink">Add Your First Link</button>
            </div>
        `;
        
        const addButton = container.querySelector('.add-new-btn');
        if (addButton) {
            addButton.addEventListener('click', () => {
                handleDropdownAction('addLink');
            });
        }
        return;
    }

    items.forEach(item => {
        const linkElement = document.createElement('div');
        linkElement.className = 'link-item';
        
        // Format the URL for display
        const displayUrl = new URL(item.url).hostname;
        
        linkElement.innerHTML = `
            <div class="link-header">
                <div class="link-icon">${item.icon || '🔗'}</div>
                <div class="link-content">
                    <a href="#" class="link-title" title="${item.title}">${item.title}</a>
                    <div class="link-meta">
                        <span class="link-url" title="${item.url}">${displayUrl}</span>
                        <span class="link-date">${new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            
            ${item.tags && item.tags.length ? `
                <div class="link-tags">
                    ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="link-actions">
                <button class="action-button edit-link" title="Edit">✏️</button>
                <button class="action-button delete-link" title="Delete">🗑️</button>
            </div>
        `;

        // Add click handler for the entire item
        linkElement.addEventListener('click', (e) => {
            // Don't open the link if clicking on action buttons
            if (e.target.closest('.link-actions')) return;
            
            if (window.linkWindowFeature) {
                window.linkWindowFeature.openWindow(item);
            } else {
                chrome.windows.create({
                    url: item.url,
                    focused: true
                });
            }
        });

        // Add click handlers for action buttons
        const editButton = linkElement.querySelector('.edit-link');
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            // Edit functionality will be implemented later
            console.log('Edit link:', item);
        });

        const deleteButton = linkElement.querySelector('.delete-link');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this link?')) {
                chrome.storage.local.get(['allLinks'], (result) => {
                    const links = result.allLinks || [];
                    const newLinks = links.filter(link => link.id !== item.id);
                    chrome.storage.local.set({ allLinks: newLinks }, () => {
                        updateCount('allLinks', newLinks.length);
                        loadSectionContent('allLinks');
                    });
                });
            }
        });

        container.appendChild(linkElement);
    });
}