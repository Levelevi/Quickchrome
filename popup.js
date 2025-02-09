// Add this function to your code
function renderSectionContent(container, section, items) {
    if (!container) {
        console.error('Container not found for section:', section);
        return;
    }

    console.log(`Rendering section: ${section} with items:`, items);

    switch (section) {
        case 'allLinks':
            renderLinks(container, items);
            break;
            
        case 'groupLayout':
            renderGroups(container, items);
            break;
            
        case 'schedule':
            renderSchedules(container, items);
            break;
            
        case 'savedWindows':
            renderSavedWindows(container, items);
            break;
            
        case 'workspaces':
            renderWorkspaces(container, items);
            break;
            
        default:
            console.error('Unknown section:', section);
            container.innerHTML = '<p>Section not implemented</p>';
    }
}

// For testing purposes, add these placeholder renderers
function renderGroups(container, items) {
    container.innerHTML = '<p>Groups section - Implementation pending</p>';
}

function renderSchedules(container, items) {
    container.innerHTML = '<p>Schedules section - Implementation pending</p>';
}

function renderSavedWindows(container, items) {
    container.innerHTML = '<p>Saved Windows section - Implementation pending</p>';
}

function renderWorkspaces(container, items) {
    container.innerHTML = '<p>Workspaces section - Implementation pending</p>';
}

// Add this test function to verify everything is connected
function testRendering() {
    console.log('Testing rendering system...');
    
    // Test container existence
    const container = document.querySelector('.dynamic-content');
    console.log('Container found:', container);
    
    // Test data loading
    chrome.storage.local.get(['allLinks'], (result) => {
        console.log('Loaded data:', result);
        if (result.allLinks) {
            console.log('Number of links:', result.allLinks.length);
        } else {
            console.log('No links found in storage');
        }
    });
}

// Call the test function after DOM loads
document.addEventListener('DOMContentLoaded', testRendering);


// State Management
const state = {
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

// Style definitions
const style = document.createElement('style');
style.textContent = `
.links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 16px;
    padding: 16px;
    width: 100%;
    min-height: 100%;
}

.link-item {
    background-color: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 8px;
    transition: background-color 0.2s;
}

.link-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.icon-wrapper {
    position: relative;
    width: 48px;
    height: 48px;
}

.icon-button {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: none;
    background-color: #303134;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
}

.icon-button:hover {
    background-color: #3c4043;
}

.icon-button img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
}

.shortcut-label {
    color: #e8eaed;
    font-size: 12px;
    text-align: center;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.menu-button {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: none;
    background-color: #3c4043;
    color: #e8eaed;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
}

.link-item:hover .menu-button {
    opacity: 1;
}

.context-menu {
    position: fixed;
    background: #303134;
    border: 1px solid #5f6368;
    border-radius: 4px;
    padding: 4px 0;
    min-width: 120px;
    z-index: 1000;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.context-menu-item {
    padding: 8px 16px;
    cursor: pointer;
    color: #e8eaed;
    display: flex;
    align-items: center;
    gap: 8px;
}

.context-menu-item:hover {
    background-color: #3c4043;
}

.edit-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #303134;
    border: 1px solid #5f6368;
    border-radius: 8px;
    padding: 16px;
    z-index: 1001;
    width: 300px;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
}

.edit-modal input {
    width: 100%;
    margin: 8px 0;
    padding: 8px;
    background: #202124;
    border: 1px solid #5f6368;
    border-radius: 4px;
    color: #e8eaed;
}

.edit-modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
}

.edit-modal button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: #3c4043;
    color: #e8eaed;
}

.edit-modal button.save {
    background: #8ab4f8;
    color: #202124;
}

.shortcuts-container {
    width: 100%;
    height: 100%;
    background-color: transparent;
    overflow-y: auto;
}

.empty-state {
    padding: 24px;
    text-align: center;
    color: #9aa0a6;
}`;

// Apply the styles
document.head.appendChild(style);

// Context menu handling
let activeContextMenu = null;
let activeEditModal = null;

function showContextMenu(e, item) {
    e.preventDefault();
    hideContextMenu();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;

    menu.innerHTML = `
        <div class="context-menu-item" data-action="edit">
            <span>✏️</span> Edit
        </div>
        <div class="context-menu-item" data-action="delete">
            <span>🗑️</span> Delete
        </div>
    `;

    menu.addEventListener('click', (event) => {
        const action = event.target.closest('.context-menu-item')?.dataset.action;
        if (action === 'edit') {
            showEditModal(item);
        } else if (action === 'delete') {
            deleteLink(item);
        }
        hideContextMenu();
    });

    document.body.appendChild(menu);
    activeContextMenu = menu;

    // Close context menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', hideContextMenu, { once: true });
    }, 0);
}

function hideContextMenu() {
    if (activeContextMenu) {
        activeContextMenu.remove();
        activeContextMenu = null;
    }
}

function showEditModal(item) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <h3 style="color: #e8eaed; margin: 0 0 16px 0;">Edit Link</h3>
        <input type="text" id="edit-title" placeholder="Title" value="${item.title}">
        <input type="url" id="edit-url" placeholder="URL" value="${item.url}">
        <div class="edit-modal-buttons">
            <button onclick="hideEditModal()">Cancel</button>
            <button class="save" onclick="saveEditedLink(this, '${item.url}')">Save</button>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    activeEditModal = { modal, overlay };

    // Close modal when clicking overlay
    overlay.addEventListener('click', hideEditModal);
}

function hideEditModal() {
    if (activeEditModal) {
        activeEditModal.modal.remove();
        activeEditModal.overlay.remove();
        activeEditModal = null;
    }
}

function saveEditedLink(button, originalUrl) { // Added the button parameter
    const titleInput = document.getElementById('edit-title');
    const urlInput = document.getElementById('edit-url');

    const newTitle = titleInput.value.trim();
    const newUrl = urlInput.value.trim();

    if (!newTitle || !newUrl) {
        alert('Please fill in both title and URL');
        return;
    }

     // Disable the save button
     button.disabled = true;
     button.textContent = 'Saving...';

    chrome.storage.local.get(['allLinks'], (result) => {
        const links = result.allLinks || [];
        const index = links.findIndex(link => link.url === originalUrl);

        if (index !== -1) {
            links[index] = { ...links[index], title: newTitle, url: newUrl };
            chrome.storage.local.set({ allLinks: links }, () => {
                 // Re-enable the save button and restore its text
                button.disabled = false;
                button.textContent = 'Save';
                hideEditModal();
                renderLinks(document.querySelector('.shortcuts-container'), links);
            });
        }
    });
}

function deleteLink(item) {
    if (!item || !item.url) {
        console.error('Invalid item to delete:', item);
        return;
    }

    if (confirm('Are you sure you want to delete this link?')) {
        chrome.storage.local.get(['allLinks'], (result) => {
            const links = result.allLinks || [];

            // Find the exact index of the item to delete
            const indexToDelete = links.findIndex(link =>
                link.url === item.url && link.title === item.title
            );

            if (indexToDelete === -1) {
                console.error('Link not found:', item);
                return;
            }

            // Create a new array without the deleted item
            const newLinks = [
                ...links.slice(0, indexToDelete),
                ...links.slice(indexToDelete + 1)
            ];

            // Save the updated links array
            chrome.storage.local.set({ allLinks: newLinks }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving updated links:', chrome.runtime.lastError);
                    return;
                }

                // Re-render only if save was successful
                const container = document.querySelector('.shortcuts-container');
                if (container) {
                    renderLinks(container, newLinks);
                }
            });
        });
    }
}

function renderLinks(container, items) {
    if (!container || !(container instanceof Element)) {
        console.error('Invalid container element:', container);
        return;
    }

    // Clear the container
    container.innerHTML = '';

    const shortcutsContainer = document.createElement('div');
    shortcutsContainer.className = 'shortcuts-container';

    if (!items || items.length === 0) {
        shortcutsContainer.innerHTML = `
            <div class="empty-state">
                <p>No saved links yet</p>
            </div>
        `;
        container.appendChild(shortcutsContainer);
        return;
    }

    const linksGrid = document.createElement('div');
    linksGrid.className = 'links-grid';

    items.forEach(item => {
        if (!item || !item.url || !item.title) {
            console.error('Invalid item:', item);
            return;
        }

        const linkElement = document.createElement('div');
        linkElement.className = 'link-item';

        let domain;
        try {
            domain = new URL(item.url).hostname;
        } catch (e) {
            console.error('Invalid URL:', item.url);
            domain = 'invalid-url';
        }

        linkElement.innerHTML = `
            <div class="icon-wrapper">
                <button class="icon-button">
                    <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64"
                         alt="${item.title}"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔗</text></svg>'">
                </button>
                <button class="menu-button">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                        <circle cx="8" cy="4" r="1"/>
                        <circle cx="8" cy="8" r="1"/>
                        <circle cx="8" cy="12" r="1"/>
                    </svg>
                </button>
            </div>
            <span class="shortcut-label" title="${item.title}">
                ${item.title.length > 10 ? item.title.substring(0, 10) + '...' : item.title}
            </span>
        `;

        // Add click handlers
        const iconButton = linkElement.querySelector('.icon-button');
        iconButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.linkWindowFeature) {
                window.linkWindowFeature.openWindow(item);
            } else {
                chrome.windows.create({ url: item.url });
            }
        });

        const menuButton = linkElement.querySelector('.menu-button');
        menuButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e, item);
        });

        linksGrid.appendChild(linkElement);
    });

    shortcutsContainer.appendChild(linksGrid);
    container.appendChild(shortcutsContainer);
}
// Helper function to verify data is being loaded correctly
function debugLinksData() {
    chrome.storage.local.get(['allLinks'], (result) => {
        console.log('Current links in storage:', result.allLinks);
    });
}

// Make functions globally available
window.hideEditModal = hideEditModal;
window.saveEditedLink = saveEditedLink;

// Call this function to check if data exists
debugLinksData();