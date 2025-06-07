// Popup script for AI Studio System Prompt Automation
document.addEventListener('DOMContentLoaded', async function() {
    // DOM elements
    const enableToggle = document.getElementById('enableToggle');
    const systemPromptTextarea = document.getElementById('systemPrompt');
    const saveBtn = document.getElementById('saveBtn');
    const insertBtn = document.getElementById('insertBtn');
    const resetBtn = document.getElementById('resetBtn');
    const statusMessage = document.getElementById('statusMessage');
    const wordCount = document.getElementById('wordCount');
    const domainIndicator = document.getElementById('domainIndicator');
    const domainText = document.getElementById('domainText');
    const helpLink = document.getElementById('helpLink');
    const helpModal = document.getElementById('helpModal');
    const closeModal = document.getElementById('closeModal');
    const groundingToggle = document.getElementById('groundingToggle');
    const groundingStatusText = document.getElementById('groundingStatusText');
    const urlContextToggle = document.getElementById('urlContextToggle');
    const urlContextStatusText = document.getElementById('urlContextStatusText');
    const thinkingBudgetToggle = document.getElementById('thinkingBudgetToggle');
    const thinkingBudgetStatusText = document.getElementById('thinkingBudgetStatusText');
    
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
            const result = await chrome.storage.sync.get(['enabled', 'systemPrompt', 'groundingPreference', 'urlContextPreference', 'thinkingBudgetEnabled']);

            enableToggle.checked = result.enabled !== false; // Default to true
            systemPromptTextarea.value = result.systemPrompt || defaultPrompt;
            groundingToggle.checked = result.groundingPreference !== false; // Default to true
            urlContextToggle.checked = result.urlContextPreference !== false; // Default to true
            thinkingBudgetToggle.checked = result.thinkingBudgetEnabled === true; // Default to false
            updateWordCount();
            await updateGroundingStatusDisplay();
            await updateUrlContextStatusDisplay();
            await updateThinkingBudgetStatusDisplay();

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
                systemPrompt: systemPromptTextarea.value.trim(),
                groundingPreference: groundingToggle.checked,
                urlContextPreference: urlContextToggle.checked,
                thinkingBudgetEnabled: thinkingBudgetToggle.checked
            };

            await chrome.storage.sync.set(settings);
            
            // Notify content script of changes
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.url && tab.url.includes('aistudio.google.com')) {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateSettings',
                        enabled: settings.enabled,
                        systemPrompt: settings.systemPrompt,
                        // Also send grounding preference if it changed
                        // This message is generic 'updateSettings', so content script might need to handle individual parts
                        // Or we send a specific message for grounding
                    });

                    // Send specific message for grounding update
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateGroundingSetting',
                        preference: settings.groundingPreference
                    });

                    // Send specific message for URL context update
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateUrlContextSetting',
                        preference: settings.urlContextPreference
                    });

                    // Send specific message for thinking budget update
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateThinkingBudgetSetting',
                        enabled: settings.thinkingBudgetEnabled
                    });
                }
            } catch (error) {
                // Content script might not be loaded, that's okay
                console.log('Content script not available:', error);
            }
            
            showStatus('Settings saved successfully!', 'success');
            await updateGroundingStatusDisplay();
            await updateUrlContextStatusDisplay();
            await updateThinkingBudgetStatusDisplay();
            
        } catch (error) {
            console.error('Error saving settings:', error);
            showStatus('Error saving settings', 'error');
        }
    }

    // Update Grounding Status Display
    async function updateGroundingStatusDisplay() {
        if (!groundingStatusText) return; // Element might not be ready

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('aistudio.google.com')) {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'getGroundingStatus' });
                if (response && response.success) {
                    if (response.found) {
                        groundingStatusText.textContent = response.isEnabled ? 'Enabled on page' : 'Disabled on page';
                        // Optionally, sync toggle if page state is different from stored pref
                        // This could happen if something else changes it on the page
                        // For now, we let the user's stored preference be the driver via saveSettings
                        // groundingToggle.checked = response.isEnabled;
                    } else {
                        groundingStatusText.textContent = 'Button not found';
                    }
                } else {
                    groundingStatusText.textContent = 'Error getting status';
                    console.warn('Error or no response from getGroundingStatus:', response);
                }
            } else {
                groundingStatusText.textContent = 'N/A (not AI Studio)';
            }
        } catch (error) {
            console.error('Error updating grounding status display:', error);
            groundingStatusText.textContent = 'Error';
        }
    }

    // Update URL Context Status Display
    async function updateUrlContextStatusDisplay() {
        if (!urlContextStatusText) return;

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('aistudio.google.com')) {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'getUrlContextStatus' });
                if (response && response.success) {
                    if (response.found) {
                        urlContextStatusText.textContent = response.isEnabled ? 'Enabled on page' : 'Disabled on page';
                    } else {
                        urlContextStatusText.textContent = 'Button not found';
                    }
                } else {
                    urlContextStatusText.textContent = 'Error getting status';
                    console.warn('Error or no response from getUrlContextStatus:', response);
                }
            } else {
                urlContextStatusText.textContent = 'N/A (not AI Studio)';
            }
        } catch (error) {
            console.error('Error updating URL context status display:', error);
            urlContextStatusText.textContent = 'Error';
        }
    }

    // Update Thinking Budget Status Display
    async function updateThinkingBudgetStatusDisplay() {
        if (!thinkingBudgetStatusText) return;

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('aistudio.google.com')) {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'getThinkingBudgetStatus' });
                if (response && response.success) {
                    if (response.found) {
                        thinkingBudgetStatusText.textContent = response.isManual ? 'Manual mode on page' : 'Auto mode on page';
                    } else {
                        thinkingBudgetStatusText.textContent = 'Button not found';
                    }
                } else {
                    thinkingBudgetStatusText.textContent = 'Error getting status';
                    console.warn('Error or no response from getThinkingBudgetStatus:', response);
                }
            } else {
                thinkingBudgetStatusText.textContent = 'N/A (not AI Studio)';
            }
        } catch (error) {
            console.error('Error updating thinking budget status display:', error);
            thinkingBudgetStatusText.textContent = 'Error';
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
        updateWordCount();
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
    
    // Update word count
    function updateWordCount() {
        const text = systemPromptTextarea.value.trim();
        let count = 0;
        if (text) {
            const words = text.match(/\S+/g); // Match non-whitespace sequences
            count = words ? words.length : 0;
        }
        wordCount.textContent = count.toLocaleString();
        
        // Color coding for word count
        if (count > 400) { // e.g., > 400 words is too long
            wordCount.style.color = '#dc3545'; // Red
        } else if (count > 200) { // e.g., > 200 words is long
            wordCount.style.color = '#ffc107'; // Yellow
        } else {
            wordCount.style.color = '#666'; // Default
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
                await updateGroundingStatusDisplay();
                await updateUrlContextStatusDisplay();
                await updateThinkingBudgetStatusDisplay();
            } else {
                domainIndicator.className = 'status-indicator inactive';
                domainText.textContent = 'Not on AI Studio';
                insertBtn.disabled = true;
                if (groundingStatusText) groundingStatusText.textContent = 'N/A';
                if (urlContextStatusText) urlContextStatusText.textContent = 'N/A';
                if (thinkingBudgetStatusText) thinkingBudgetStatusText.textContent = 'N/A';
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
    groundingToggle.addEventListener('change', saveSettings);
    urlContextToggle.addEventListener('change', saveSettings);
    thinkingBudgetToggle.addEventListener('change', saveSettings);
    systemPromptTextarea.addEventListener('input', updateWordCount);
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
    await loadSettings(); // This will call both status display updaters
    await checkDomain();    // This will also call both status display updaters if on AI Studio
    
    // Update domain status when tab changes
    chrome.tabs.onActivated.addListener(checkDomain);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete') {
            checkDomain();
        }
    });
});
