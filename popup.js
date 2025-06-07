// Popup script for AI Studio System Prompt Automation
document.addEventListener('DOMContentLoaded', async function() {
    // DOM elements
    const enableToggle = document.getElementById('enableToggle');
    const systemPromptTextarea = document.getElementById('systemPrompt');
    const saveBtn = document.getElementById('saveBtn');
    const insertBtn = document.getElementById('insertBtn');
    const resetBtn = document.getElementById('resetBtn');
    const statusMessage = document.getElementById('statusMessage');
    const charCount = document.getElementById('charCount');
    const domainIndicator = document.getElementById('domainIndicator');
    const domainText = document.getElementById('domainText');
    const helpLink = document.getElementById('helpLink');
    const helpModal = document.getElementById('helpModal');
    const closeModal = document.getElementById('closeModal');
    
    // Default system prompt
    const defaultPrompt = `You are a helpful AI assistant. Please provide accurate, helpful, and well-structured responses.

Key guidelines:
- Be clear and concise in your explanations
- Provide examples when helpful
- Ask clarifying questions if the request is ambiguous
- Maintain a professional and friendly tone`;
    
    // Load settings from storage
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['enabled', 'systemPrompt']);
            
            enableToggle.checked = result.enabled !== false; // Default to true
            systemPromptTextarea.value = result.systemPrompt || defaultPrompt;
            updateCharCount();
            
        } catch (error) {
            console.error('Error loading settings:', error);
            showStatus('Error loading settings', 'error');
        }
    }
    
    // Save settings to storage
    async function saveSettings() {
        try {
            const settings = {
                enabled: enableToggle.checked,
                systemPrompt: systemPromptTextarea.value.trim()
            };
            
            await chrome.storage.sync.set(settings);
            
            // Notify content script of changes
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.url && tab.url.includes('aistudio.google.com')) {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateSettings',
                        enabled: settings.enabled,
                        systemPrompt: settings.systemPrompt
                    });
                }
            } catch (error) {
                // Content script might not be loaded, that's okay
                console.log('Content script not available:', error);
            }
            
            showStatus('Settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            showStatus('Error saving settings', 'error');
        }
    }
    
    // Insert prompt now
    async function insertPromptNow() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url || !tab.url.includes('aistudio.google.com')) {
                showStatus('Please navigate to aistudio.google.com first', 'error');
                return;
            }
            
            insertBtn.disabled = true;
            insertBtn.textContent = 'Inserting...';
            
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'insertNow'
            });
            
            if (response.success) {
                showStatus('System prompt inserted successfully!', 'success');
            } else if (!response.found) {
                showStatus('System instructions textarea not found on this page', 'error');
            } else {
                showStatus('Failed to insert prompt (textarea may not be empty)', 'error');
            }
            
        } catch (error) {
            console.error('Error inserting prompt:', error);
            showStatus('Error: Make sure you\'re on aistudio.google.com', 'error');
        } finally {
            insertBtn.disabled = false;
            insertBtn.textContent = 'Insert Now';
        }
    }
    
    // Reset to default prompt
    function resetToDefault() {
        systemPromptTextarea.value = defaultPrompt;
        updateCharCount();
        showStatus('Reset to default prompt', 'info');
    }
    
    // Show status message
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 3000);
    }
    
    // Update character count
    function updateCharCount() {
        const count = systemPromptTextarea.value.length;
        charCount.textContent = count.toLocaleString();
        
        // Color coding for length
        if (count > 2000) {
            charCount.style.color = '#dc3545';
        } else if (count > 1000) {
            charCount.style.color = '#ffc107';
        } else {
            charCount.style.color = '#666';
        }
    }
    
    // Check current domain
    async function checkDomain() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab && tab.url && tab.url.includes('aistudio.google.com')) {
                domainIndicator.className = 'status-indicator active';
                domainText.textContent = 'Active on AI Studio';
                insertBtn.disabled = false;
            } else {
                domainIndicator.className = 'status-indicator inactive';
                domainText.textContent = 'Not on AI Studio';
                insertBtn.disabled = true;
            }
        } catch (error) {
            domainIndicator.className = 'status-indicator inactive';
            domainText.textContent = 'Unable to check domain';
            insertBtn.disabled = true;
        }
    }
    
    // Show/hide help modal
    function showHelpModal() {
        helpModal.classList.remove('hidden');
    }
    
    function hideHelpModal() {
        console.log('hideHelpModal function called.');
        if (helpModal) {
            helpModal.classList.add('hidden');
            console.log('helpModal classes after attempting to hide:', helpModal.className);
        } else {
            console.error('Error: helpModal element not found in hideHelpModal!');
        }
    }
    
    // Event listeners
    enableToggle.addEventListener('change', saveSettings);
    systemPromptTextarea.addEventListener('input', updateCharCount);
    saveBtn.addEventListener('click', saveSettings);
    insertBtn.addEventListener('click', insertPromptNow);
    resetBtn.addEventListener('click', resetToDefault);
    helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        showHelpModal();
    });
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            console.log('Close button clicked!');
            hideHelpModal();
        });
    } else {
        console.error('Error: closeModal element not found!');
    }
    
    // Close modal when clicking outside
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            hideHelpModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveSettings();
        }
        
        // Escape to close modal
        if (e.key === 'Escape' && !helpModal.classList.contains('hidden')) {
            hideHelpModal();
        }
    });
    
    // Auto-save when typing (debounced)
    let saveTimeout;
    systemPromptTextarea.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveSettings, 1000); // Auto-save after 1 second of no typing
    });
    
    // Initialize
    await loadSettings();
    await checkDomain();
    
    // Update domain status when tab changes
    chrome.tabs.onActivated.addListener(checkDomain);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
            checkDomain();
        }
    });
});
