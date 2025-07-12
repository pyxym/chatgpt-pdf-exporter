# ChatGPT PDF Exporter
<img width="1280" height="800" alt="대표 썸네일" src="https://github.com/user-attachments/assets/eaabe16e-9839-4559-a17e-7e3881bc0a57" />

A Chrome extension that allows you to export ChatGPT conversations to PDF, HTML, and text formats with high quality rendering.

## Features

- 🔥 **High-quality PDF generation** using html2canvas
- 📝 **Multiple export formats**: PDF, HTML, and plain text
- 🎯 **Selective export**: Choose specific messages to export
- 🌐 **Multi-language support**: Korean, Japanese, and English

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store
    - [link](https://chromewebstore.google.com/detail/chatgpt-%E3%82%B7%E3%83%B3%E3%83%97%E3%83%ABpdf%E3%82%A8%E3%82%AF%E3%82%B9%E3%83%9D%E3%83%BC%E3%83%88/blnidfgplbgchadddghfohphicdbdgep)
2. Click "Add to Chrome"
3. The extension will be added to your browser

### Manual Installation (Development)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will be loaded and ready to use

## Usage

1. **Go to ChatGPT**: Navigate to [chatgpt.com](https://chatgpt.com)
2. **Click Export Button**: Find the "PDF Export" button in the top navigation
3. **Choose Format**: Select PDF, HTML, or text format
4. **Select Messages**: Choose "Full conversation" or "Selected messages"
5. **Configure Options**: Set timestamp, user info, clean format, and custom title options
6. **Generate**: Click "Generate" to create and download your file

## Message Selection

- Click the checkbox next to each message you want to export
- Selected messages will be highlighted
- Only selected messages will be included in the export

## Technical Details

- **Manifest Version**: 3
- **Permissions**: activeTab, downloads
- **Libraries**: html2canvas, jsPDF
- **Browser Support**: Chrome (Manifest V3 compatible)

## Privacy

This extension:
- Only works on ChatGPT domains
- Does not collect or transmit any personal data
- Processes all data locally in your browser
- Does not require account registration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have suggestions:
- Open an issue on GitHub
- Check the extension's popup for usage instructions

## Version History

### 1.0.0
- Initial release
- PDF, HTML, and text export functionality
- Multi-language support
- Selective message export
