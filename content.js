// Content script for AI Studio System Prompt Automation
(function () {
  'use strict';

  let isEnabled = true;
  let systemPrompt = '';
  let soundNotification = false;
  let hasInserted = false;
  let isGenerating = false;

  // Load settings from storage
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'enabled',
        'systemPrompt',
        'soundNotification',
      ]);
      isEnabled = result.enabled !== false; // Default to true
      systemPrompt = result.systemPrompt || getDefaultPrompt();
      soundNotification = result.soundNotification === true; // Default to false
    } catch (error) {
      console.error('Error loading settings:', error);
      isEnabled = true;
      systemPrompt = getDefaultPrompt();
      soundNotification = false;
    }
  }

  // Default system prompt
  function getDefaultPrompt() {
    return `KaTeX를 사용해 수식과 기호를 서식화하세요. 모든 수학 표현은 달러 기호($)로 감싸야 합니다(예: $E=mc^2$). Gemini 환경에서 수식이 렌더링되도록 필요한 KaTeX 라이브러리를 포함-설정했는지 확인하세요.`;
  }

  // Find the target textarea
  function findSystemInstructionsTextarea() {
    const textareas = document.querySelectorAll(
      'textarea[aria-label*="System instructions"], textarea[aria-label*="system instructions"]'
    );

    // Also check for common variations
    if (textareas.length === 0) {
      const allTextareas = document.querySelectorAll('textarea');
      for (const textarea of allTextareas) {
        const ariaLabel = textarea.getAttribute('aria-label') || '';
        const placeholder = textarea.getAttribute('placeholder') || '';
        const id = textarea.getAttribute('id') || '';

        if (
          ariaLabel.toLowerCase().includes('system') ||
          placeholder.toLowerCase().includes('system') ||
          id.toLowerCase().includes('system')
        ) {
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
      console.log(
        'AI Studio Automation: Textarea already contains content, skipping insertion'
      );
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

  // Play notification sound
  function playNotificationSound() {
    console.log(
      'AI Studio: Attempting to play notification sound. Enabled:',
      soundNotification
    );
    if (!soundNotification) {
      console.log('AI Studio: Sound notification is disabled');
      return;
    }

    try {
      // Try to play using Web Audio API
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Resume audio context if suspended (due to browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext
          .resume()
          .then(() => {
            console.log('AI Studio: Audio context resumed');
          })
          .catch(err => {
            console.error('AI Studio: Failed to resume audio context:', err);
            // Fallback to HTML5 Audio
            playFallbackSound();
            return;
          });
      }

      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound - softer, more pleasant tone
      oscillator.frequency.value = 440; // A4 note, more pleasant than 800Hz
      oscillator.type = 'sine';

      // Fade in and out for smooth sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.15,
        audioContext.currentTime + 0.05
      );
      gainNode.gain.linearRampToValueAtTime(
        0.15,
        audioContext.currentTime + 0.15
      );
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      console.log('AI Studio: Sound played successfully');

      // Also show a notification
      showNotification('AI Studio response completed!');
    } catch (error) {
      console.error('AI Studio: Error playing notification sound:', error);
      // Try fallback method
      playFallbackSound();
    }
  }

  // Fallback sound using data URI
  function playFallbackSound() {
    try {
      console.log('AI Studio: Trying fallback audio method');
      // Create a simple beep sound as data URI
      const audio = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCuBzvLZjjoIGGG47OScTgwOUq7n77VgGgU7k9n1y3coBCV1yO7ciEEJFV+16+ytVBELSKLh8r5uIAUugdbyz3cqByN0yO3ciEAKF165+u+rUhEJSKPj8LpvHAU0ktXwy3cqBSl1yO7ciEEJFV+16+ytVBELSKLh8r5uIAUugdbyz3cqByN0yO3ciEAKF165+u+rUhEJSKPj8LpvHAU0ktXwy3cqBSl1yO7ciEEJFV+16+ytVBELSKLh8r5uIAUugdbyz3cqByN0yO3ciEAKF165+u+rUhEJSKPj8LpvHAU0ktXwy3cqBSl1yO7ciEEJFV+16+ytVBELSKLh8r5uIAUugdbyz3cqByN0yO3ciEAKF165+u+rUhEJSKPj8LpvHAU0ktXwy3cqBSl1yO7ciEEJFV+16+ytVBELSKLh8r5uIAUugdbyz3cqByN0yO3ciEAKF165+u+rUhEJSKPj8LpvHAU0ktXwy3cqBSl1yO7ciEEJFV+16+ytVBELSKLh8r5uIAUugdbyz3cqByN0yO3ciEAKF165+u+rUhEJSKPj8LpvHAU0ktXwy3cqBSl1yO7ciEEJFV+16+ytVBELSKLh8r5uIAUugdbyz3cqByN0yO3ciEAKF165+u+rUhEJSKPj8LpvHAU0ktXwy3cqBSl1yO7ciEEJFV+16+ytVBELSKLh8r5uIAUugdbyz3cqByN0yO3ciEAKF165+u+rUhEJSKPj8LpvHAU0ktXwy3cqBSl1yO7ciEEJFV+16+ytVBELSKLh8r5uIAUugdbyz3cqByN0yO3ciEAKF165+u+rUhEJSKPj8LpvHAU0ktXwy3cqBSl1yO7ciEEJFV61'
      );
      audio.volume = 0.5;
      audio
        .play()
        .then(() => {
          console.log('AI Studio: Fallback sound played successfully');
        })
        .catch(err => {
          console.error('AI Studio: Fallback audio failed:', err);
          // Last resort: use browser notification with sound
          if (Notification.permission === 'granted') {
            new Notification('AI Studio Response Complete', {
              body: 'Your AI Studio response has finished generating.',
              icon: chrome.runtime.getURL('icons/icon48.png'),
              requireInteraction: false,
              silent: false,
            });
          }
        });
    } catch (error) {
      console.error('AI Studio: All audio methods failed:', error);
    }
  }

  // Monitor for generation completion
  function setupGenerationMonitor() {
    const observer = new MutationObserver(mutations => {
      const runButton = document.querySelector('button[aria-label="Run"]');
      if (!runButton) return;

      const isStoppable = runButton.classList.contains('stoppable');
      const labelElement = runButton.querySelector('.label');
      const currentLabel = labelElement ? labelElement.textContent.trim() : '';

      // Check if generation just started
      if (!isGenerating && isStoppable && currentLabel === 'Stop') {
        isGenerating = true;
        console.log('AI Studio: Generation started');
      }

      // Check if generation just completed
      if (isGenerating && !isStoppable && currentLabel === 'Run') {
        isGenerating = false;
        console.log('AI Studio: Generation completed');
        playNotificationSound();
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-disabled', 'disabled'],
    });

    return observer;
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

  // Observer to watch for DOM changes
  function setupObserver() {
    const observer = new MutationObserver(mutations => {
      let shouldCheck = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldCheck = true;
        }
      });

      if (shouldCheck) {
        setTimeout(checkAndInsertSystemPrompt, 500); // Small delay to ensure elements are ready
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return observer;
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateSettings') {
      isEnabled = request.enabled;
      systemPrompt = request.systemPrompt;
      soundNotification =
        request.soundNotification !== undefined
          ? request.soundNotification
          : soundNotification;
      hasInserted = false; // Reset insertion flag when settings change
      sendResponse({ success: true });
    } else if (request.action === 'insertNow') {
      loadSettings()
        .then(() => {
          const textarea = findSystemInstructionsTextarea();
          if (textarea) {
            hasInserted = false; // Allow manual insertion
            const success = insertSystemPrompt(textarea);
            sendResponse({ success, found: true });
          } else {
            sendResponse({ success: false, found: false });
          }
        })
        .catch(error => {
          console.error('AI Studio Automation: Error during insertNow:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response
    }
  });

  // Initialize
  function init() {
    console.log('AI Studio System Prompt Automation: Content script loaded');

    // Request notification permission if needed
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('AI Studio: Notification permission:', permission);
      });
    }

    // Initial check
    setTimeout(checkAndInsertSystemPrompt, 1000);

    // Setup observer for dynamic content
    setupObserver();

    // Setup generation completion monitor
    setupGenerationMonitor();

    // Check periodically for new textareas (fallback)
    setInterval(() => {
      if (!hasInserted) {
        checkAndInsertSystemPrompt();
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
