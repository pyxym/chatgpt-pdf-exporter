# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that allows users to export ChatGPT conversations to PDF format. The extension provides multiple export options including PDF download, HTML file export, and plain text export.

## Architecture

### Core Components (Modular Structure)

- **manifest.json**: Chrome extension manifest with content script injection for chatgpt.com domains
- **scripts/background.js**: Service worker handling screenshot capture and file downloads via Chrome APIs
- **scripts/content.js**: Main entry point that initializes and coordinates all modules
- **scripts/ui-manager.js**: Handles UI creation, modal generation, and message selection features
- **scripts/pdf-generator.js**: Manages PDF generation, content extraction, and export functionality
- **scripts/page-observer.js**: Monitors page changes and manages component lifecycle
- **popup.html**: Extension popup interface with quick actions and instructions
- **scripts/popup.js**: Popup functionality for accordion UI
- **assets/styles/styles.css**: Comprehensive styling for all UI components including modal, buttons, and responsive design

### Key Features

1. **Multiple Export Formats**: PDF (direct generation + print fallback), HTML, and plain text
2. **Message Selection**: Users can select specific messages to export using checkboxes
3. **Export Options**: Include/exclude timestamps, user info, and apply clean formatting
4. **Responsive Design**: Works on both desktop and mobile with dark mode support

### Technical Implementation

- **PDF Generation**: Uses html2canvas + jsPDF for direct PDF creation with print fallback
- **Content Extraction**: Processes ChatGPT's DOM structure to extract messages and preserve formatting
- **UI Integration**: Injects export button into ChatGPT's header navigation
- **Message Processing**: Handles tables, code blocks, lists, and inline formatting

## Development Commands

This is a client-side Chrome extension with no build process or package.json. Development involves:

1. **Loading Extension**: Use Chrome's "Load unpacked" in Developer mode
2. **Testing**: Navigate to chatgpt.com and test functionality
3. **Debugging**: Use Chrome DevTools for content script debugging and background script console

## File Structure

```
/
├── manifest.json           # Extension configuration and permissions
├── popup.html             # Extension popup UI
├── CLAUDE.md              # Project documentation and AI assistant guidance
├── scripts/               # JavaScript modules
│   ├── background.js      # Service worker for Chrome API interactions
│   ├── content.js         # Main entry point and coordinator
│   ├── ui-manager.js      # UI creation and management
│   ├── pdf-generator.js   # PDF generation and export
│   ├── page-observer.js   # Page monitoring and lifecycle
│   └── popup.js           # Popup functionality
├── assets/                # Static assets
│   ├── styles/
│   │   └── styles.css     # Complete styling for all components
│   └── images/            # Extension icons
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
└── lib/                   # Third-party libraries
    ├── html2canvas.min.js # DOM to canvas conversion
    └── jspdf.umd.min.js   # PDF generation
```

## Module Responsibilities

### scripts/content.js (Main Entry Point)
- `initPDFExporter()`: Main initialization function
- `fallbackInit()`: Backup initialization if modules fail to load
- `initializeComponents()`: Coordinates module initialization

### scripts/ui-manager.js (UI Management)
- `createExportButton()`: Injects PDF export button into ChatGPT UI
- `createModal()`: Generates export options modal
- `addMessageSelectionFeature()`: Adds checkbox selection to messages
- `showNotification()`: Displays status notifications
- `toggleMessageSelection()`: Handles message selection state

### scripts/pdf-generator.js (Export Functionality)
- `generateDirectPDF()`: Creates PDF using html2canvas + jsPDF
- `extractContent()`: Extracts and processes ChatGPT message content
- `generateCleanHTML()`: Creates formatted HTML for export
- `exportToPrint()`: Handles PDF export with fallback to print
- `exportToHTML()`: HTML file export functionality
- `exportToText()`: Plain text export functionality

### scripts/page-observer.js (Lifecycle Management)
- `startObserving()`: Monitors page changes with MutationObserver
- `handleMutations()`: Processes DOM changes
- `debounceUpdateButton()`: Throttles button updates
- `isConversationPage()`: Checks if current page has conversations

### scripts/background.js (Service Worker)
- Handles Chrome extension API interactions
- Manages screenshot capture and file downloads
- Processes messages from content scripts

## Development Best Practices

### Code Organization
- Keep modules focused on single responsibilities
- Use descriptive function names and clear parameter names
- Maintain consistent error handling across modules
- Follow existing code patterns and styling

### Chrome Extension Guidelines
- Use manifest v3 standards and service workers
- Implement proper permission handling
- Test across different Chrome versions
- Handle content script injection failures gracefully

### Testing Strategy
- Test on different ChatGPT conversation types (text, code, tables)
- Verify functionality on both light and dark themes
- Test export options with various message selections
- Validate PDF output quality and formatting

## Testing

Test the extension by:
1. **Loading Extension**: Use Chrome's "Load unpacked" in Developer mode
2. **Basic Functionality**: Navigate to chatgpt.com and verify PDF export button appears in header
3. **Export Options**: Test different export formats (PDF, HTML, text) and options
4. **Message Selection**: Test checkbox selection and partial message exports
5. **Edge Cases**: Test with empty conversations, long messages, and complex formatting
6. **Cross-Browser**: Verify compatibility across Chrome versions

## Known Limitations

- **DOM Dependency**: Requires specific ChatGPT DOM structure (may break with UI updates)
- **Library Dependencies**: PDF generation depends on external libraries (html2canvas, jsPDF)
- **Performance**: Message selection uses mutation observers for dynamic content
- **Fallback Mode**: Falls back to print mode when direct PDF generation fails
- **Content Support**: Limited support for complex multimedia content in exports