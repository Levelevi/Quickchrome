class TagManager {
    constructor() {
        this.activeFilters = new Set();
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.tagFilterBtn = document.getElementById('tagFilterBtn');
        this.activeTagsContainer = document.getElementById('activeTagsContainer');
        
        // Make sure elements exist
        if (!this.tagFilterBtn || !this.activeTagsContainer) {
            console.error('Required elements not found for TagManager');
            return;
        }
    }

    setupEventListeners() {
        if (this.tagFilterBtn) {
            this.tagFilterBtn.addEventListener('click', () => this.openTagModal());
        }
    }

    getAllTags() {
        const tagsSet = new Set();
        if (window.folderManager && window.folderManager.folders) {
            window.folderManager.folders
                .filter(folder => folder.level === 1)
                .forEach(folder => {
                    if (folder.tags && Array.isArray(folder.tags)) {
                        folder.tags.forEach(tag => tagsSet.add(tag));
                    }
                });
        }
        return Array.from(tagsSet).sort();
    }

    openTagModal() {
        const existingModal = document.getElementById('tagFilterModal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'tagFilterModal';
        modal.className = 'modal';

        const tags = this.getAllTags();
        const tagChips = tags.length > 0 
            ? tags.map(tag => `
                <div class="tag-chip ${this.activeFilters.has(tag) ? 'selected' : ''}" 
                     data-tag="${tag}">
                    ${tag}
                </div>
            `).join('')
            : '<div class="no-tags-message">No tags found. Create folders with tags first.</div>';

        modal.innerHTML = `
            <div class="modal-content">
                <h2>Filter by Tags</h2>
                <div class="search-tags">
                    <input type="text" id="tagSearch" placeholder="Search tags..." />
                </div>
                <div class="tags-container">
                    ${tagChips}
                </div>
                <div class="modal-buttons">
                    <button class="cancel-button">Cancel</button>
                    <button class="create-button">Apply Filters</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        // Setup search functionality
        const searchInput = modal.querySelector('#tagSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const chips = modal.querySelectorAll('.tag-chip');
                chips.forEach(chip => {
                    const tagText = chip.textContent.toLowerCase().trim();
                    chip.style.display = tagText.includes(searchTerm) ? 'block' : 'none';
                });
            });
        }

        // Setup tag selection
        const tagChipElements = modal.querySelectorAll('.tag-chip');
        tagChipElements.forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('selected');
            });
        });

        // Setup buttons
        const applyBtn = modal.querySelector('.create-button');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const selectedTags = Array.from(modal.querySelectorAll('.tag-chip.selected'))
                    .map(chip => chip.dataset.tag);
                this.activeFilters = new Set(selectedTags);
                this.updateActiveTagsDisplay();
                this.applyFilters();
                modal.remove();
            });
        }

        const cancelBtn = modal.querySelector('.cancel-button');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
    }

    updateActiveTagsDisplay() {
        if (!this.activeTagsContainer) return;
        
        this.activeTagsContainer.innerHTML = '';
        
        if (this.activeFilters.size === 0) return;

        Array.from(this.activeFilters).forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'active-tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="remove-tag">×</span>
            `;

            const removeBtn = tagElement.querySelector('.remove-tag');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    this.activeFilters.delete(tag);
                    this.updateActiveTagsDisplay();
                    this.applyFilters();
                });
            }

            this.activeTagsContainer.appendChild(tagElement);
        });
    }

    applyFilters() {
        if (!window.folderManager) return;

        // Get current folders at this path level
        const currentFolders = window.folderManager.getCurrentFolders();
        
        // If no active filters, show all folders
        if (this.activeFilters.size === 0) {
            window.folderManager.renderFolders();
            return;
        }

        // Filter folders based on active tags
        const filteredFolders = currentFolders.filter(folder => {
            if (!folder.tags) return false;
            return Array.from(this.activeFilters)
                .every(tag => folder.tags.includes(tag));
        });

        // Use the FolderManager's render method to display filtered folders
        window.folderManager.renderFilteredFolders(filteredFolders);
    }
}

// Helper function to close tag modal
function closeTagModal() {
    const modal = document.getElementById('tagFilterModal');
    if (modal) modal.remove();
}

// Helper function to apply tag filter
function applyTagFilter() {
    if (window.tagManager) {
        window.tagManager.applyFilters();
    }
}