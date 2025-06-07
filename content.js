// Content script for AI Studio System Prompt Automation
(function() {
    'use strict';
    
    let isEnabled = true;
    let systemPrompt = '';
    let groundingPreference = true; // Default to true (enabled)
    let hasInserted = false;
    
    // Load settings from storage
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['enabled', 'systemPrompt', 'groundingPreference']);
            isEnabled = result.enabled !== false; // Default to true
            systemPrompt = result.systemPrompt || getDefaultPrompt();
            groundingPreference = result.groundingPreference !== false; // Default to true
        } catch (error) {
            console.error('Error loading settings:', error);
            isEnabled = true;
            systemPrompt = getDefaultPrompt();
            groundingPreference = true;
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
    
    // Main function to check and insert system prompt
    async function checkAndInsertSystemPrompt() {
        await loadSettings();
        
        if (!isEnabled) {
            return;
        }
        
        const textarea = findSystemInstructionsTextarea();
        if (textarea) {
            insertSystemPrompt(textarea);
        }
    }

    // --- Grounding Button Logic --- 
    const GROUNDING_BUTTON_SELECTOR = 'button[aria-label="Grounding with Google Search"]';

    function findGroundingButton() {
        return document.querySelector(GROUNDING_BUTTON_SELECTOR);
    }

    function getGroundingButtonState(button) {
        if (!button) return null;
        return button.getAttribute('aria-checked') === 'true';
    }

    async function setGroundingButtonState(button, desiredState) {
        if (!button) {
            console.warn('AI Studio Automation: Grounding button not found for setting state.');
            return false;
        }

        const currentState = getGroundingButtonState(button);
        console.log(`AI Studio Automation: Grounding button current state: ${currentState}, desired: ${desiredState}`);

        if (currentState === desiredState) {
            console.log('AI Studio Automation: Grounding button already in desired state.');
            return true; // Already in the desired state
        }

        try {
            // Click the button to toggle its state
            // AI Studio buttons often manage their aria-attributes internally upon click.
            button.click();
            
            // Short delay to allow DOM to update after click
            await new Promise(resolve => setTimeout(resolve, 150)); 

            const newStateAfterClick = getGroundingButtonState(button);
            if (newStateAfterClick === desiredState) {
                showNotification(`Google Search grounding ${desiredState ? 'enabled' : 'disabled'}.`);
                console.log(`AI Studio Automation: Grounding button state changed to ${desiredState} via click.`);
                return true;
            } else {
                // If clicking didn't achieve the desired state (e.g., it toggled, but not to the one we want, or didn't change)
                // This might happen if the button was already in a transient state or if our logic is off.
                // As a fallback, try directly setting aria-checked, though this is less reliable for complex components.
                console.warn(`AI Studio Automation: Clicking grounding button resulted in ${newStateAfterClick}, expected ${desiredState}. Attempting to set aria-checked directly.`);
                button.setAttribute('aria-checked', desiredState.toString());
                // Re-check after direct attribute setting
                await new Promise(resolve => setTimeout(resolve, 50));
                if (getGroundingButtonState(button) === desiredState) {
                    showNotification(`Google Search grounding ${desiredState ? 'enabled' : 'disabled'} (forced).`);
                    console.log(`AI Studio Automation: Grounding button state forced to ${desiredState} via aria-checked.`);
                    return true;
                } else {
                    console.error('AI Studio Automation: Failed to set grounding button to desired state after click and direct attribute setting.');
                    showNotification('Error changing grounding state.', 'error');
                    return false;
                }
            }
        } catch (error) {
            console.error('Error changing grounding button state:', error);
            showNotification('Error changing grounding state.', 'error');
            return false;
        }
    }

    async function applyGroundingPreference() {
        if (!isEnabled) return; // Assuming 'isEnabled' can globally control this feature too, or add a specific toggle for grounding feature itself.

        const button = findGroundingButton();
        if (button) {
            console.log('AI Studio Automation: Applying grounding preference. User wants:', groundingPreference);
            await setGroundingButtonState(button, groundingPreference);
        } else {
            console.log('AI Studio Automation: Grounding button not found on page load/update.');
        }
    }

    // --- End Grounding Button Logic ---

    // Combined function to apply all automations
    async function applyAllAutomation() {
        await loadSettings(); // Ensure settings are fresh
        if (!isEnabled) {
            console.log('AI Studio Automation: Automation is disabled.');
            return;
        }
        await checkAndInsertSystemPrompt();
        await applyGroundingPreference();
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
                setTimeout(applyAllAutomation, 500); // Small delay to ensure elements are ready
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
            // No need to return true, as sendResponse is synchronous here.
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
            }).catch(error => {
                console.error('AI Studio Automation: Error during insertNow:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep message channel open for async response
        } else if (request.action === 'updateGroundingSetting') {
            groundingPreference = request.preference;
            console.log('AI Studio Automation: Received grounding preference update from popup:', groundingPreference);
            applyGroundingPreference().then(() => {
                sendResponse({ success: true });
            }).catch(error => {
                console.error('AI Studio Automation: Error during updateGroundingSetting:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true; // Async response
        } else if (request.action === 'getGroundingStatus') {
            const button = findGroundingButton();
            if (button) {
                const status = getGroundingButtonState(button);
                sendResponse({ success: true, found: true, isEnabled: status });
            } else {
                sendResponse({ success: false, found: false });
            }
            // No need to return true if sendResponse is called synchronously within all branches.
            // However, if any path could be async, it's safer to return true.
            // For this specific case, it's synchronous, but to be safe with potential future changes:
            return true; 
        }
        // If no action matches, and you're not sending a response asynchronously,
        // you might not need to return true. But if any path is async, it's good practice.
        // Consider if there are other message types that might need an async response.
    });
    
    // Initialize
    function init() {
        console.log('AI Studio System Prompt Automation: Content script loaded');
        
        // Initial check
        setTimeout(applyAllAutomation, 1000);
        
        // Setup observer for dynamic content
        setupObserver();
        
        // Check periodically for new textareas (fallback)
        setInterval(() => {
            if (!hasInserted) { // This condition might need to be re-evaluated for applyAllAutomation
                applyAllAutomation();
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
