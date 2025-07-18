import UIManager from '@/src/modules/ui-manager';
import PDFGenerator from '@/src/modules/pdf-generator';
import PageObserver from '@/src/modules/page-observer';
import I18nManager from '@/src/modules/i18n-manager';
import LanguageDetector from '@/src/modules/language-detector';

export default defineContentScript({
  matches: ['https://chatgpt.com/*', 'https://chat.openai.com/*'],
  runAt: 'document_idle',
  
  async main() {
    console.log('ChatGPT PDF Exporter initializing...');
    
    try {
      // Initialize language detection and i18n
      const languageDetector = new LanguageDetector();
      const i18nManager = new I18nManager(languageDetector);
      
      // Wait for i18n to be ready
      await i18nManager.initialize();
      
      // Initialize UI components
      const uiManager = new UIManager(i18nManager);
      const pdfGenerator = new PDFGenerator(uiManager, i18nManager);
      
      // Set up page observer
      const pageObserver = new PageObserver(uiManager);
      
      // Connect UI to PDF generator with proper callback
      const exportCallback = (options: any) => {
        pdfGenerator.handleExport(options);
      };
      
      // Start observing page changes
      await pageObserver.startObserving();
      
      // Initialize UI
      await uiManager.initialize();
      
      // Store callback for later use when modal is shown
      (window as any).__pdfExportCallback = exportCallback;
      
      console.log('ChatGPT PDF Exporter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ChatGPT PDF Exporter:', error);
    }
  },
});