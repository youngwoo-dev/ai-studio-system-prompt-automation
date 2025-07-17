# AI Studio Setting Automation

A Chrome extension to automate system prompt insertion in Google AI Studio chat sessions.

## Features

- **Domain-specific**: Only activates on `aistudio.google.com`
- **Smart detection**: Automatically finds the "System instructions" textarea
- **Non-intrusive**: Only inserts prompts into empty textareas
- **Configurable**: Easy-to-use popup interface for managing system prompts
- **Toggle control**: Enable/disable auto-insertion with a simple toggle
- **Manual insertion**: Force insert prompts with the "Insert Now" button
- **Real-time feedback**: Visual notifications when prompts are inserted
- **Auto-save**: Settings are automatically saved as you type
- **Sound notifications**: Optional audio alert when AI Studio finishes generating responses

## Installation

### From Source (Developer Mode)

1. **Download or clone this repository**

   ```bash
   git clone <repository-url>
   cd ai-studio-system-prompt-automation
   ```

2. **Open Chrome Extensions page**

   - Navigate to `chrome://extensions/`
   - Or go to Chrome menu → More tools → Extensions

3. **Enable Developer Mode**

   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**

   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

5. **Add icons (optional)**
   - Add your own icon files to the `icons/` directory:
     - `icon16.png` (16x16 pixels)
     - `icon32.png` (32x32 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)

## Usage

### Basic Usage

1. **Navigate to Google AI Studio**

   - Go to `https://aistudio.google.com/`
   - Open any prompt or create a new one

2. **Automatic insertion**
   - The extension will automatically detect the "System instructions" textarea
   - If the textarea is empty, your predefined system prompt will be inserted
   - A notification will appear confirming the insertion

### Managing System Prompts

1. **Open the extension popup**

   - Click the extension icon in the Chrome toolbar
   - The popup will show your current settings

2. **Edit your system prompt**

   - Modify the text in the large textarea
   - Changes are automatically saved as you type
   - Character count is displayed for reference

3. **Toggle auto-insertion**

   - Use the toggle switch to enable/disable automatic insertion
   - When disabled, prompts won't be inserted automatically

4. **Enable sound notifications**

   - Toggle "Sound Notification on Completion" to get audio alerts
   - Plays a brief tone when AI Studio finishes generating a response
   - Helpful when working in other tabs or windows

5. **Manual insertion**

   - Click "Insert Now" to manually insert the prompt
   - This works even when auto-insertion is disabled
   - Only works when you're on an AI Studio page

6. **Reset to default**
   - Click "Reset to Default" to restore the original system prompt

### Advanced Features

- **Domain indicator**: The popup shows whether you're currently on AI Studio
- **Help documentation**: Click "Help" in the popup for detailed instructions
- **Keyboard shortcuts**: Use Ctrl/Cmd+S to quickly save settings
- **Error handling**: Clear error messages if something goes wrong

## Default System Prompt

The extension comes with a default system prompt:

```
KaTeX를 사용해 수식과 기호를 서식화하세요. 모든 수학 표현은 달러 기호($)로 감싸야 합니다(예: $E=mc^2$). Gemini 환경에서 수식이 렌더링되도록 필요한 KaTeX 라이브러리를 포함-설정했는지 확인하세요.
```

You can customize this to match your specific needs.

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome extension manifest version
- **Content Script**: Monitors the AI Studio page for textarea elements
- **Background Script**: Manages extension lifecycle and notifications
- **Popup Interface**: Provides user configuration and control

### Permissions

- `storage`: To save user settings
- `activeTab`: To interact with the current tab
- `notifications`: To show success/error messages
- `https://aistudio.google.com/*`: Host permission for AI Studio

### Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Chromium-based browsers (Edge, Brave, etc.)

## Troubleshooting

### Extension not working

1. **Check domain**: Ensure you're on `aistudio.google.com`
2. **Refresh page**: Try refreshing the AI Studio page
3. **Check toggle**: Make sure auto-insertion is enabled in the popup
4. **Check textarea**: The extension only works with empty textareas

### Prompt not inserting

1. **Empty textarea**: The extension only inserts into empty textareas
2. **Page loading**: Wait for the page to fully load before expecting insertion
3. **Manual insertion**: Try using the "Insert Now" button
4. **Console errors**: Check browser console for error messages

### Settings not saving

1. **Storage permissions**: Ensure the extension has storage permissions
2. **Sync issues**: Try disabling and re-enabling Chrome sync
3. **Extension reload**: Try disabling and re-enabling the extension

## Development

### File Structure

```
ai-studio-system-prompt-automation/
├── manifest.json          # Extension configuration
├── content.js             # Content script for page interaction
├── background.js          # Background service worker
├── popup.html             # Popup interface HTML
├── popup.css              # Popup interface styles
├── popup.js               # Popup interface logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

### Key Components

- **Content Script**: Monitors DOM changes and inserts prompts
- **MutationObserver**: Watches for dynamic content changes
- **Chrome Storage API**: Persists user settings
- **Message Passing**: Communication between popup and content script

## Privacy

- **Local storage only**: All settings are stored locally in your browser
- **No external requests**: The extension doesn't send data to external servers
- **Domain-restricted**: Only activates on Google AI Studio

## License

This project is open source. Feel free to modify and distribute according to your needs.

## Support

For issues, feature requests, or questions:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Ensure you're using a supported browser version
