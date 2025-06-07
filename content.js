// Content script for AI Studio System Prompt Automation
(function() {
    'use strict';
    
    let isEnabled = true;
    let systemPrompt = '';
    let hasInserted = false;
    
    // Load settings from storage
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['enabled', 'systemPrompt']);
            isEnabled = result.enabled !== false; // Default to true
            systemPrompt = result.systemPrompt || getDefaultPrompt();
        } catch (error) {
            console.error('Error loading settings:', error);
            isEnabled = true;
            systemPrompt = getDefaultPrompt();
        }
    }
    
    // Default system prompt
    function getDefaultPrompt() {
        return `You are a helpful AI assistant. Please provide accurate, helpful, and well-structured responses.

Key guidelines:
- Be clear and concise in your explanations
- Provide examples when helpful
- Ask clarifying questions if the request is ambiguous
- Maintain a professional and friendly tone`;
    }
    
    // Find the target textarea
    function findSystemInstructionsTextarea() {
        const textareas = document.querySelectorAll('textarea[aria-label*="System instructions"], textarea[aria-label*="system instructions"]');
        
        // Also check for common variations
        if (textareas.length === 0) {
            const allTextareas = document.querySelectorAll('textarea');
            for (const textarea of allTextareas) {
                const ariaLabel = textarea.getAttribute('aria-label') || '';
                const placeholder = textarea.getAttribute('placeholder') || '';
                const id = textarea.getAttribute('id') || '';
                
                if (ariaLabel.toLowerCase().includes('system') || 
                    placeholder.toLowerCase().includes('system') ||
                    id.toLowerCase().includes('system')) {
                    return textarea;
                }
            }
        }
        
        return textareas[0] || null;
    }
    
    // Check if textarea is empty or only contains whitespace
    function isTextareaEmpty(textarea) {
        return !textarea.value || textarea.value.trim() === '';
    }
    
    // Insert system prompt into textarea
    function insertSystemPrompt(textarea) {
        if (!isEnabled || !systemPrompt || hasInserted) {
            return false;
        }
        
        if (!isTextareaEmpty(textarea)) {
            console.log('AI Studio Automation: Textarea already contains content, skipping insertion');
            return false;
        }
        
        try {
            // Set the value
            textarea.value = systemPrompt;
            
            // Trigger input events to ensure the application recognizes the change
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Focus and blur to ensure proper state
            textarea.focus();
            textarea.blur();
            
            hasInserted = true;
            showNotification('System prompt inserted successfully!');
            
            console.log('AI Studio Automation: System prompt inserted');
            return true;
        } catch (error) {
            console.error('Error inserting system prompt:', error);
            return false;
        }
    }
    
    // Show notification
    function showNotification(message) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Main function to check and insert prompt
    async function checkAndInsert() {
        await loadSettings();
        
        if (!isEnabled) {
            return;
        }
        
        const textarea = findSystemInstructionsTextarea();
        if (textarea) {
            insertSystemPrompt(textarea);
        }
    }
    
    // Observer to watch for DOM changes
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldCheck = true;
                }
            });
            
            if (shouldCheck) {
                setTimeout(checkAndInsert, 500); // Small delay to ensure elements are ready
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        return observer;
    }
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateSettings') {
            isEnabled = request.enabled;
            systemPrompt = request.systemPrompt;
            hasInserted = false; // Reset insertion flag when settings change
            sendResponse({ success: true });
        } else if (request.action === 'insertNow') {
            loadSettings().then(() => {
                const textarea = findSystemInstructionsTextarea();
                if (textarea) {
                    hasInserted = false; // Allow manual insertion
                    const success = insertSystemPrompt(textarea);
                    sendResponse({ success, found: true });
                } else {
                    sendResponse({ success: false, found: false });
                }
            });
            return true; // Keep message channel open for async response
        }
    });
    
    // Initialize
    function init() {
        console.log('AI Studio System Prompt Automation: Content script loaded');
        
        // Initial check
        setTimeout(checkAndInsert, 1000);
        
        // Setup observer for dynamic content
        setupObserver();
        
        // Check periodically for new textareas (fallback)
        setInterval(() => {
            if (!hasInserted) {
                checkAndInsert();
            }
        }, 5000);
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
