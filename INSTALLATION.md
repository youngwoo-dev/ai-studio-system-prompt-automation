# Installation Guide

## Quick Start

### 1. Prepare Icons (Optional)
If you want custom icons, add PNG files to the `icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels) 
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

**Or use the icon generator:**
1. Open `create-icons.html` in your browser
2. Click "Generate Icons" 
3. Right-click each icon and "Save image as..."
4. Save them in the `icons/` folder with the correct names

### 2. Install Extension

1. **Open Chrome Extensions**
   - Go to `chrome://extensions/`
   - Or Menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" in the top-right

3. **Load Extension**
   - Click "Load unpacked"
   - Select this folder
   - Extension should appear in your list

### 3. Test the Extension

1. **Go to AI Studio**
   - Navigate to `https://aistudio.google.com/`
   - Create or open a prompt

2. **Check Auto-insertion**
   - Look for the "System instructions" textarea
   - If empty, the extension should automatically insert your prompt
   - You'll see a green notification if successful

3. **Configure Settings**
   - Click the extension icon in Chrome toolbar
   - Modify your system prompt as needed
   - Toggle auto-insertion on/off
   - Use "Insert Now" for manual insertion

## Troubleshooting

### Extension not loading
- Make sure all files are in the same directory
- Check that `manifest.json` is valid
- Try refreshing the extensions page

### Icons not showing
- Icons are optional - extension will work without them
- Make sure icon files are PNG format
- Check file names match exactly: `icon16.png`, etc.

### Not working on AI Studio
- Ensure you're on `aistudio.google.com`
- Check that the extension is enabled
- Try refreshing the AI Studio page
- Look for error messages in browser console

## File Structure

Your directory should look like this:

```
ai-studio-system-prompt-automation/
├── manifest.json
├── content.js
├── background.js
├── popup.html
├── popup.css
├── popup.js
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
├── INSTALLATION.md
└── create-icons.html
```

## Next Steps

1. **Customize your system prompt** in the extension popup
2. **Test on different AI Studio pages** to ensure compatibility
3. **Share with your team** by distributing this folder

## Support

If you encounter issues:
1. Check browser console for errors (F12 → Console)
2. Verify you're using Chrome 88+ or compatible browser
3. Make sure you're on the correct domain (`aistudio.google.com`)
4. Try disabling and re-enabling the extension
