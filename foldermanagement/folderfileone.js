// Custom Modal Management
class CustomModal {
    static show(message, type = 'info', onConfirm = null, onCancel = null) {
        const existingModal = document.getElementById('customModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'customModal';
        modal.className = 'modal';

        modal.innerHTML = `
            <div class="modal-content">
                <h3>${type === 'warning' ? 'Warning' : 'Confirmation'}</h3>
                <p>${message}</p>
                <div class="modal-buttons">
                    <button class="cancel-button">Cancel</button>
                    <button class="create-button">Confirm</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const confirmBtn = modal.querySelector('.create-button');
        const cancelBtn = modal.querySelector('.cancel-button');

        confirmBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            modal.remove();
        });

        cancelBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
            modal.remove();
        });

        modal.style.display = 'block';
    }
}

// Folder Management Class
class FolderManager {
    constructor() {
        this.folders = [];
        this.currentPath = ['Root'];
        this.initializeElements();
        this.loadFromLocalStorage();
        this.renderFolders();
    }

    initializeElements() {
        // Main elements
        this.folderGrid = document.getElementById('folderGrid');
        this.folderPath = document.getElementById('folderPath');
        this.backButton = document.getElementById('backButton');
        this.createFolderBtn = document.getElementById('createFolderBtn');
        this.folderModal = document.getElementById('folderModal');
        this.folderNameInput = document.getElementById('folderName');
        this.folderCountDisplay = document.getElementById('folderCount');
        this.folderTagsInput = document.getElementById('folderTags');

        // Event listeners
        this.backButton.addEventListener('click', () => this.navigateBack());
        this.createFolderBtn?.addEventListener('click', () => this.openNewFolderModal());
    }

    loadFromLocalStorage() {
        const savedFolders = localStorage.getItem('folders');
        if (savedFolders) {
            this.folders = JSON.parse(savedFolders);
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('folders', JSON.stringify(this.folders));
        this.updateFolderCount();
    }

    updateFolderCount() {
        const mainFolderCount = this.folders.filter(f => f.level === 1).length;
        if (this.folderCountDisplay) {
            this.folderCountDisplay.textContent = mainFolderCount;
        }
    }

    getCurrentFolders() {
        const currentPathString = this.currentPath.join('/');
        return this.folders.filter(f => f.parentPath === currentPathString);
    }

    renderFilteredFolders(folders) {
        this.folderGrid.innerHTML = '';

        // Add create folder button
        const createFolderBtn = document.createElement('button');
        createFolderBtn.className = 'create-folder-btn';
        createFolderBtn.innerHTML = `
            <svg class="folder-plus-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-7l-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-9v9" />
                <path d="M16 13h-8" />
            </svg>
            <span class="create-text">Create New Folder</span>
        `;
        createFolderBtn.addEventListener('click', () => this.openNewFolderModal());
        this.folderGrid.appendChild(createFolderBtn);

        folders.forEach(folder => {
            const folderCard = this.createFolderCard(folder);
            this.folderGrid.appendChild(folderCard);
        });
    }

    renderFolders() {
        this.folderGrid.innerHTML = '';

        // Add create folder button
        const createFolderBtn = document.createElement('button');
        createFolderBtn.className = 'create-folder-btn';
        createFolderBtn.innerHTML = `
            <svg class="folder-plus-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-7l-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-9v9" />
                <path d="M16 13h-8" />
            </svg>
            <span class="create-text">Create New Folder</span>
        `;
        createFolderBtn.addEventListener('click', () => this.openNewFolderModal());
        this.folderGrid.appendChild(createFolderBtn);

        // Find and render folders at current path
        const currentPathString = this.currentPath.join('/');
        const currentFolders = this.folders.filter(f => f.parentPath === currentPathString);

        currentFolders.forEach(folder => {
            const folderCard = this.createFolderCard(folder);
            this.folderGrid.appendChild(folderCard);
        });

        // Update path display
        this.folderPath.textContent = this.currentPath.join(' / ');

        // Show/hide back button
        this.backButton.style.display = this.currentPath.length > 1 ? 'flex' : 'none';
    }

    createFolderCard(folder) {
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.setAttribute('data-level', folder.level);

        let tagsHtml = '';
        if (folder.level === 1 && folder.tags && folder.tags.length > 0) {
            tagsHtml = `
                <div class="folder-tags">
                    ${folder.tags.map(tag => `<span class="folder-tag">${tag}</span>`).join('')}
                </div>
            `;
        }

        card.innerHTML = `
            <div class="main-folder-label">${folder.level === 1 ? 'Main Folder' : ''}</div>
            <svg class="folder-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <div class="folder-name">${folder.name}</div>
            ${tagsHtml}
            <div class="folder-count">${folder.urls ? folder.urls.length : 0} URLs</div>
            <div class="folder-actions">
                <button class="action-btn delete-btn" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                </button>
            </div>
        `;

        // Event listeners
        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteFolder(folder);
        });

        card.addEventListener('click', () => this.openFolder(folder));

        return card;
    }

    openFolder(folder) {
        this.currentPath.push(folder.name);
        this.renderFolders();
    }

    navigateBack() {
        if (this.currentPath.length > 1) {
            this.currentPath.pop();
            this.renderFolders();
        }
    }

    openNewFolderModal() {
        if (this.currentPath.length >= 4) {
            CustomModal.show('Cannot create subfolders at this level');
            return;
        }

        const mainFolderCount = this.folders.filter(f => f.level === 1).length;
        if (this.currentPath.length === 1 && mainFolderCount >= 10) {
            CustomModal.show('You have reached the maximum number of main folders');
            return;
        }

        this.folderModal.style.display = 'block';
        this.folderNameInput.value = '';
        if (this.folderTagsInput) this.folderTagsInput.value = '';

        this.folderNameInput.focus();
    }

    createFolder() {
        const folderName = this.folderNameInput.value.trim();
        const folderTagsInput = document.getElementById('folderTags');

        if (!folderName) {
            CustomModal.show('Please enter a folder name');
            return;
        }

        // Check for duplicate names at current path
        const currentPathString = this.currentPath.join('/');
        const isDuplicate = this.folders.some(f =>
            f.parentPath === currentPathString && f.name.toLowerCase() === folderName.toLowerCase()
        );

        if (isDuplicate) {
            CustomModal.show('A folder with this name already exists');
            return;
        }

        // Get tags if it's a main folder (level 1)
        let tags = [];
        if (this.currentPath.length === 1 && folderTagsInput) {
            tags = folderTagsInput.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
        }

        const newFolder = {
            name: folderName,
            parentPath: this.currentPath.join('/'),
            level: this.currentPath.length,
            urls: [],
            tags: this.currentPath.length === 1 ? tags : undefined
        };

        this.folders.push(newFolder);
        this.folderModal.style.display = 'none';

        // Clear inputs
        this.folderNameInput.value = '';
        if (folderTagsInput) folderTagsInput.value = '';

        this.saveToLocalStorage();
        this.renderFolders();
    }

    deleteFolder(folder) {
        CustomModal.show(
            `Are you sure you want to delete the folder "${folder.name}"?`,
            'warning',
            () => {
                const folderPath = `${folder.parentPath}/${folder.name}`;
                this.folders = this.folders.filter(f => {
                    if (f === folder) return false;
                    if (f.parentPath && folderPath && f.parentPath.startsWith(folderPath)) {
                        return false;
                    }
                    return true;
                });
                this.saveToLocalStorage();
                this.renderFolders();
            }
        );
    }
}

// Modal helper functions
function closeModal() {
    document.getElementById('folderModal').style.display = 'none';
}

function createFolder() {
    if (window.folderManager) {
        window.folderManager.createFolder();
    }
}

// Initialize managers when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.folderManager = new FolderManager();
    window.tagManager = new TagManager();  // Initialize TagManager
});