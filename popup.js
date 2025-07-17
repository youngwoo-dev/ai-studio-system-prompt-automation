// Popup script for AI Studio System Prompt Automation
document.addEventListener('DOMContentLoaded', async function () {
  // DOM elements
  const enableToggle = document.getElementById('enableToggle');
  const soundNotificationToggle = document.getElementById(
    'soundNotificationToggle'
  );
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
  const volumeControl = document.getElementById('volumeControl');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');

  // Default system prompt
  const defaultPrompt = `KaTeX를 사용해 수식과 기호를 서식화하세요. 모든 수학 표현은 달러 기호($)로 감싸야 합니다(예: $E=mc^2$). Gemini 환경에서 수식이 렌더링되도록 필요한 KaTeX 라이브러리를 포함-설정했는지 확인하세요.`;

  // Load settings from storage
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'enabled',
        'systemPrompt',
        'soundNotification',
        'soundVolume',
      ]);

      enableToggle.checked = result.enabled !== false; // Default to true
      systemPromptTextarea.value = result.systemPrompt || defaultPrompt;
      soundNotificationToggle.checked = result.soundNotification === true; // Default to false
      volumeSlider.value = result.soundVolume || 40;
      volumeValue.textContent = `${volumeSlider.value}%`;
      updateVolumeControlVisibility();
      updateWordCount();
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
        soundNotification: soundNotificationToggle.checked,
        soundVolume: parseInt(volumeSlider.value),
      };

      await chrome.storage.sync.set(settings);

      // Notify content script of changes
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab && tab.url && tab.url.includes('aistudio.google.com')) {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'updateSettings',
            enabled: settings.enabled,
            systemPrompt: settings.systemPrompt,
            soundNotification: settings.soundNotification,
            soundVolume: settings.soundVolume,
          });
        }
      } catch (error) {
        // Content script might not be loaded, that's okay
        console.log('Content script not available:', error);
      }

      showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      if (
        error.message &&
        (error.message.includes('QUOTA_BYTES_PER_ITEM') ||
          error.message.includes('QUOTA_BYTES'))
      ) {
        showStatus('Error: Prompt too long for Chrome sync storage.', 'error');
      } else {
        showStatus('Error saving settings', 'error');
      }
    }
  }

  // Insert prompt now
  async function insertPromptNow() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.url || !tab.url.includes('aistudio.google.com')) {
        showStatus('Please navigate to aistudio.google.com first', 'error');
        return;
      }

      insertBtn.disabled = true;
      insertBtn.textContent = 'Inserting...';

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'insertNow',
      });

      if (response.success) {
        showStatus('System prompt inserted successfully!', 'success');
      } else if (!response.found) {
        showStatus(
          'System instructions textarea not found on this page',
          'error'
        );
      } else {
        showStatus(
          'Failed to insert prompt (textarea may not be empty)',
          'error'
        );
      }
    } catch (error) {
      console.error('Error inserting prompt:', error);
      showStatus("Error: Make sure you're on aistudio.google.com", 'error');
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
    const text = systemPromptTextarea.value;
    const words = text.match(/\b\w+\b/g) || [];
    const count = words.length;
    wordCount.textContent = `${count} words`;
    wordCount.style.color = '#666'; // Default color
  }

  // Check current domain
  async function checkDomain() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

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

  // Update volume control visibility
  function updateVolumeControlVisibility() {
    if (soundNotificationToggle.checked) {
      volumeControl.style.display = 'block';
    } else {
      volumeControl.style.display = 'none';
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
      console.log(
        'helpModal classes after attempting to hide:',
        helpModal.className
      );
    } else {
      console.error('Error: helpModal element not found in hideHelpModal!');
    }
  }

  // Event listeners
  enableToggle.addEventListener('change', saveSettings);
  soundNotificationToggle.addEventListener('change', () => {
    updateVolumeControlVisibility();
    saveSettings();
  });
  systemPromptTextarea.addEventListener('input', updateWordCount);
  saveBtn.addEventListener('click', saveSettings);
  insertBtn.addEventListener('click', insertPromptNow);
  resetBtn.addEventListener('click', resetToDefault);
  volumeSlider.addEventListener('input', () => {
    volumeValue.textContent = `${volumeSlider.value}%`;
    saveSettings();
  });
  helpLink.addEventListener('click', e => {
    e.preventDefault();
    showHelpModal();
  });
  if (closeModal) {
    closeModal.addEventListener('click', function () {
      console.log('Close button clicked!');
      hideHelpModal();
    });
  } else {
    console.error('Error: closeModal element not found!');
  }

  // Close modal when clicking outside
  helpModal.addEventListener('click', e => {
    if (e.target === helpModal) {
      hideHelpModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
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
