// Window Management Feature
window.linkWindowFeature = (() => {
    // Private state
    const state = {
        width: 50,
        height: 100,
        position: 'left',
        isDragging: false,
        isResizing: false,
        lastX: 0,
        lastY: 0,
        tileMode: false
    };

    // Track windows opened by the extension
    const managedWindows = new Set();

    // Initialize when DOM is ready
    function initialize() {
        // Get DOM elements
        const elements = {
            urlTitleInput: document.getElementById('linkTitle'),
            urlAddressInput: document.getElementById('linkUrl'),
            positionButtonGroup: document.getElementById('positionButtonGroup'),
            positionButtons: document.querySelectorAll('.position-button'),
            widthRangeInput: document.getElementById('widthRange'),
            widthNumberInput: document.getElementById('widthNumber'),
            heightRangeInput: document.getElementById('heightRange'),
            heightNumberInput: document.getElementById('heightNumber'),
            previewWindow: document.querySelector('.preview-window'),
            previewWorkspace: document.querySelector('.preview-workspace'),
            tileModeToggle: document.getElementById('tileMode'),
            fetchUrlButton: document.getElementById('fetchUrlButton') // New button
        };

        // Initialize window controls if elements exist
        if (elements.previewWindow && elements.previewWorkspace) {
            initializeWindowControls(elements);
        }

        // Add event listener to the "Fetch URL" button
        if (elements.fetchUrlButton) {
            elements.fetchUrlButton.addEventListener('click', fetchCurrentTabUrl);
        }
    }

    // Fetch the URL of the current active tab
    function fetchCurrentTabUrl() {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    const url = tabs[0].url;
                    const title = tabs[0].title || '';
                    const elements = {
                        urlTitleInput: document.getElementById('linkTitle'),
                        urlAddressInput: document.getElementById('linkUrl')
                    };

                    if (elements.urlAddressInput) {
                        elements.urlAddressInput.value = url;
                    }
                    if (elements.urlTitleInput && !elements.urlTitleInput.value) { // Only set title if title is not already set
                        elements.urlTitleInput.value = title;
                    }
                }
            });
        }
    }

    // Initialize window controls
    function initializeWindowControls(elements) {
        const {
            positionButtons,
            widthRangeInput,
            widthNumberInput,
            heightRangeInput,
            heightNumberInput,
            previewWindow,
            previewWorkspace,
            tileModeToggle
        } = elements;

        // Position buttons
        positionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                positionButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.position = btn.dataset.position;
                updatePreview(previewWindow, previewWorkspace);
            });
        });

        // Width controls
        widthRangeInput.setAttribute('max', 80); // Changed max value
        widthRangeInput.addEventListener('input', e => {
            state.width = Number(e.target.value);
            widthNumberInput.value = state.width;
            updatePreview(previewWindow, previewWorkspace);
        });

        widthNumberInput.addEventListener('input', e => {
            let value = Math.min(80, Math.max(25, Number(e.target.value)));  // Changed the condition
            state.width = value;
            widthRangeInput.value = value;
            updatePreview(previewWindow, previewWorkspace);
        });

        // Height controls
        heightRangeInput.addEventListener('input', e => {
            let value = Math.max(35, Number(e.target.value));
            state.height = value;
            heightNumberInput.value = state.height;
            updatePreview(previewWindow, previewWorkspace);
        });

        heightNumberInput.addEventListener('input', e => {
            let value = Math.min(100, Math.max(25, Number(e.target.value)));
            state.height = value;
            heightRangeInput.value = value;
            updatePreview(previewWindow, previewWorkspace);
        });

        // Window dragging
        const windowHeader = previewWindow.querySelector('.window-header');
        windowHeader.addEventListener('mousedown', e => startDragging(e, previewWindow));

        // Window resizing
        const resizeHandle = previewWindow.querySelector('.resize-handle');
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', e => startResizing(e, previewWindow));
        }

        // Global mouse events
        document.addEventListener('mousemove', e => handleMouseMove(e, previewWindow, previewWorkspace));
        document.addEventListener('mouseup', () => {
            state.isDragging = false;
            state.isResizing = false;
            previewWindow.classList.remove('active');
        });

        // Tile mode toggle
        if (tileModeToggle) {
            tileModeToggle.addEventListener('change', e => {
                state.tileMode = e.target.checked;
                toggleControlsBasedOnMode(elements);
            });
        }

        // Initial preview update
        updatePreview(previewWindow, previewWorkspace);
    }

    // Start dragging
    function startDragging(e, previewWindow) {
        state.isDragging = true;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        previewWindow.classList.add('active');
    }

    // Start resizing
    function startResizing(e, previewWindow) {
        e.stopPropagation();
        state.isResizing = true;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        previewWindow.classList.add('active');
    }

    // Handle mouse movement
    function handleMouseMove(e, previewWindow, previewWorkspace) {
        if (!state.isDragging && !state.isResizing) return;

        const workspaceRect = previewWorkspace.getBoundingClientRect();

        if (state.isDragging) {
            handleDragging(e, previewWindow, workspaceRect);
        }

        if (state.isResizing) {
            handleResizing(e, previewWindow, workspaceRect);
        }

        state.lastX = e.clientX;
        state.lastY = e.clientY;
    }

    // Handle dragging
    function handleDragging(e, previewWindow, workspaceRect) {
        const deltaX = e.clientX - state.lastX;
        const deltaY = e.clientY - state.lastY;

        const currentLeft = parseInt(previewWindow.style.left) || 0;
        const currentTop = parseInt(previewWindow.style.top) || 0;

        const newLeft = Math.max(0, Math.min(workspaceRect.width - previewWindow.offsetWidth, currentLeft + deltaX));
        const newTop = Math.max(0, Math.min(workspaceRect.height - previewWindow.offsetHeight, currentTop + deltaY));

        previewWindow.style.left = `${newLeft}px`;
        previewWindow.style.top = `${newTop}px`;

        state.position = newLeft < workspaceRect.width / 3 ? 'left' :
            newLeft > (workspaceRect.width * 2 / 3) ? 'right' : 'center';

        updatePositionButtons();
    }

    // Handle resizing
    function handleResizing(e, previewWindow, workspaceRect) {
        const deltaX = e.clientX - state.lastX;
        const deltaY = e.clientY - state.lastY;

        let newWidth = Math.max(25, Math.min(80, (previewWindow.offsetWidth + deltaX) / workspaceRect.width * 100)); //Changed the width of the box
        const newHeight = Math.max(25, Math.min(100, (previewWindow.offsetHeight + deltaY) / workspaceRect.height * 100));

        state.width = Math.round(newWidth);
        state.height = Math.round(newHeight);

        updateInputs();
        updatePreview(previewWindow, workspaceRect);
    }

    // Update preview
    function updatePreview(previewWindow, previewWorkspace) {
        if (!previewWindow || !previewWorkspace) return;

        if (state.tileMode) {
            previewWindow.style.width = '50%';
            previewWindow.style.height = '100%';
            previewWindow.style.left = '0';
            previewWindow.style.top = '0';
            return;
        }

        const workspaceRect = previewWorkspace.getBoundingClientRect();
        const windowWidth = (state.width / 100) * workspaceRect.width;
        const windowHeight = (state.height / 100) * workspaceRect.height;
        let leftPosition;

        switch (state.position) {
            case 'left':
                leftPosition = 0;
                break;
            case 'right':
                leftPosition = workspaceRect.width - windowWidth;
                break;
            case 'center':
                leftPosition = (workspaceRect.width - windowWidth) / 2;
                break;
        }

        previewWindow.style.width = `${windowWidth}px`;
        previewWindow.style.height = `${windowHeight}px`;
        previewWindow.style.left = `${leftPosition}px`;
        previewWindow.style.top = `${(workspaceRect.height - windowHeight) / 2}px`;
    }

    // Toggle controls based on mode
    function toggleControlsBasedOnMode(elements) {
        const {
            widthRangeInput,
            widthNumberInput,
            heightRangeInput,
            heightNumberInput,
            positionButtons,
            previewWindow,
            previewWorkspace
        } = elements;

        const controls = [
            widthRangeInput,
            widthNumberInput,
            heightRangeInput,
            heightNumberInput,
            ...(positionButtons || [])
        ];

        controls.forEach(control => {
            if (control) control.disabled = state.tileMode;
        });

        updatePreview(previewWindow, previewWorkspace);
    }

    // Update position buttons
    function updatePositionButtons() {
        document.querySelectorAll('.position-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.position === state.position);
        });
    }

    // Update inputs
    function updateInputs() {
        const widthRangeInput = document.getElementById('widthRange');
        const widthNumberInput = document.getElementById('widthNumber');
        const heightRangeInput = document.getElementById('heightRange');
        const heightNumberInput = document.getElementById('heightNumber');

        if (widthRangeInput) widthRangeInput.value = state.width;
        if (widthNumberInput) widthNumberInput.value = state.width;
        if (heightRangeInput) heightRangeInput.value = state.height;
        if (heightNumberInput) heightNumberInput.value = state.height;
    }

    // Get current screen metrics
    async function getCurrentScreen() {
        try {
            const displays = await chrome.system.display.getInfo();
            const primaryDisplay = displays.find(d => d.isPrimary) || displays[0];

            return {
                width: primaryDisplay.workArea.width,
                height: primaryDisplay.workArea.height,
                left: primaryDisplay.workArea.left,
                top: primaryDisplay.workArea.top,
                dpi: primaryDisplay.deviceScaleFactor
            };
        } catch (error) {
            console.error('Error getting screen metrics:', error);
            return {
                width: window.screen.availWidth,
                height: window.screen.availHeight,
                left: window.screen.availLeft,
                top: window.screen.availTop,
                dpi: 1
            };
        }
    }

    // Open window with settings
    async function openWindow(item) {
        try {
            const { windowSettings } = item;
            if (windowSettings) {
                state.width = windowSettings.width;
                state.height = windowSettings.height;
                state.position = windowSettings.position;
                state.tileMode = windowSettings.tileMode;

                updateInputs();
                const previewWindow = document.querySelector('.preview-window');
                const previewWorkspace = document.querySelector('.preview-workspace');
                if (previewWindow && previewWorkspace) {
                    updatePreview(previewWindow, previewWorkspace);
                }
                updatePositionButtons();
            }

            if (typeof chrome !== 'undefined' && chrome.windows) {
                if (state.tileMode) {
                    await tileWindows(item.url);
                } else {
                    await openCustomWindow(item.url);
                }
            }
        } catch (error) {
            console.error('Error opening window:', error);
            chrome.windows.create({
                url: item.url,
                focused: true
            });
        }
    }

    // Tile windows
    async function tileWindows(newWindowUrl) {
        try {
            const screen = await getCurrentScreen();
            const currentWindow = await chrome.windows.getCurrent();
            const exactHalfWidth = Math.floor(screen.width / 2);

            await chrome.windows.update(currentWindow.id, {
                state: 'normal',
                width: exactHalfWidth,
                height: screen.height,
                left: screen.left,
                top: screen.top
            });
            managedWindows.add(currentWindow.id);

            const newWindow = await chrome.windows.create({
                url: newWindowUrl,
                width: exactHalfWidth,
                height: screen.height,
                left: screen.left + exactHalfWidth,
                top: screen.top,
                focused: true,
                type: 'normal'
            });
            managedWindows.add(newWindow.id);

            setupWindowRemovalListener();
        } catch (error) {
            console.error('Error in tileWindows:', error);
            await chrome.windows.create({
                url: newWindowUrl,
                focused: true
            });
        }
    }

    // Open custom window
    async function openCustomWindow(url) {
        try {
            const screen = await getCurrentScreen();
            const currentWindow = await chrome.windows.getCurrent();

            const width = Math.round(screen.width * state.width / 100);
            const height = Math.round(screen.height * state.height / 100);

            let left;
            if (state.position === 'left') {
                left = screen.left;
            } else if (state.position === 'right') {
                left = screen.left + (screen.width - width);
            } else {
                left = screen.left + Math.round((screen.width - width) / 2);
            }

            const top = screen.top + Math.round((screen.height - height) / 2);

            await chrome.windows.update(currentWindow.id, {
                width: Math.round(screen.width * (100 - state.width) / 100),
                height: screen.height,
                top: screen.top,
                left: (state.position === 'left') ? screen.left + width : (state.position === 'right') ? screen.left : screen.left + Math.round(width / 2),
                state: 'normal'
            });
            managedWindows.add(currentWindow.id);

            const newWindow = await chrome.windows.create({
                url: url,
                type: 'normal',
                width: width,
                height: height,
                left: left,
                top: top,
                focused: true
            });
            // Continuing from the previous code...
            managedWindows.add(newWindow.id);
            setupWindowRemovalListener();

        } catch (error) {
            console.error('Error opening window:', error);
            await chrome.windows.create({
                url: url,
                focused: true
            });
        }
    }

    // Setup window removal listener
    function setupWindowRemovalListener() {
        chrome.windows.onRemoved.addListener(function windowRemovedListener(windowId) {
            if(managedWindows.has(windowId)) {
                managedWindows.delete(windowId);
                // Find the remaining window
                const remainingWindowId = Array.from(managedWindows)[0];
                if(remainingWindowId) {
                    chrome.windows.update(remainingWindowId, {
                        state: 'maximized'
                    });
                }
                managedWindows.clear();
                chrome.windows.onRemoved.removeListener(windowRemovedListener);
            }
        });
    }

    // Get current state
    function getState() {
        return {
            width: state.width,
            height: state.height,
            position: state.position,
            tileMode: state.tileMode
        };
    }

    // Public API
    return {
        initialize,
        getState,
        openWindow,
        tileWindows,
        openCustomWindow,
        updatePreview
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.linkWindowFeature.initialize();
});