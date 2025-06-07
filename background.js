// Background script for AI Studio System Prompt Automation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('AI Studio System Prompt Automation installed');
        
        // Set default settings
        const defaultSettings = {
            enabled: true,
            systemPrompt: `You are a helpful AI assistant. Please provide accurate, helpful, and well-structured responses.

Key guidelines:
- Be clear and concise in your explanations
- Provide examples when helpful
- Ask clarifying questions if the request is ambiguous
- Maintain a professional and friendly tone`
        };
        
        chrome.storage.sync.set(defaultSettings).catch(console.error);
        
        // Show welcome notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'AI Studio Automation Installed',
            message: 'Extension is ready! Visit aistudio.google.com to get started.'
        }).catch(console.error);
        
    } else if (details.reason === 'update') {
        console.log('AI Studio System Prompt Automation updated');
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This will open the popup, but we can add additional logic here if needed
    console.log('Extension icon clicked on tab:', tab.url);
});

// Listen for tab updates to manage extension state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        if (tab.url.includes('aistudio.google.com')) {
            // Enable extension icon when on AI Studio
            chrome.action.enable(tabId);
            chrome.action.setBadgeText({ text: '', tabId: tabId });
        } else {
            // Keep extension enabled but show it's not active
            chrome.action.enable(tabId);
        }
    }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showNotification') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: request.title || 'AI Studio Automation',
            message: request.message
        }).catch(console.error);
        
        sendResponse({ success: true });
    }
    
    return false; // Don't keep message channel open
});

// Clean up old notifications
chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.notifications.clear(notificationId);
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        console.log('Settings changed:', changes);
        
        // Notify all AI Studio tabs about the changes
        chrome.tabs.query({ url: 'https://aistudio.google.com/*' }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateSettings',
                    enabled: changes.enabled?.newValue,
                    systemPrompt: changes.systemPrompt?.newValue
                }).catch(() => {
                    // Content script might not be loaded, ignore error
                });
            });
        });
    }
});

// Error handling
chrome.runtime.onSuspend.addListener(() => {
    console.log('AI Studio System Prompt Automation suspended');
});

chrome.runtime.onStartup.addListener(() => {
    console.log('AI Studio System Prompt Automation started');
});
