import type LanguageDetector from './language-detector';
import type { SupportedLanguage } from './language-detector';

export interface I18nMessages {
  exportButtonText: string;
  modalTitle: string;
  exportTypeLabel: string;
  exportTypeAll: string;
  exportTypeSelected: string;
  optionsLabel: string;
  includeTitle: string;
  titlePlaceholder: string;
  defaultChatTitle: string;
  includeTimestamp: string;
  includeUserInfo: string;
  cleanFormat: string;
  exportFormatLabel: string;
  exportPDF: string;
  exportHTML: string;
  exportText: string;
  cancel: string;
  generateButton: string;
  generatedDate: string;
  completed: string;
  errorModalTitle: string;
  errorContentTooLarge: string;
  errorContentTooLargeDesc: string;
  solutionsTitle: string;
  solutionSelectMessages: string;
  solutionSelectMessagesDesc: string;
  closeButton: string;
}

type MessageKey = keyof I18nMessages;

export default class I18nManager {
  private messages: Record<SupportedLanguage, I18nMessages> = {
    ko: {
      exportButtonText: 'PDF 저장',
      modalTitle: '엑스포트 옵션',
      exportTypeLabel: '출력 타입:',
      exportTypeAll: '전체 대화',
      exportTypeSelected: '선택한 메시지',
      optionsLabel: '옵션:',
      includeTitle: '타이틀 포함하기',
      titlePlaceholder: '제목을 입력하세요',
      defaultChatTitle: 'ChatGPT 채팅이력',
      includeTimestamp: '타임스탬프 포함하기',
      includeUserInfo: '사용자 정보 포함하기',
      cleanFormat: '깨끗한 형식으로 생성',
      exportFormatLabel: '내보내기 형식:',
      exportPDF: 'PDF 생성',
      exportHTML: 'HTML',
      exportText: '텍스트',
      cancel: '취소',
      generateButton: '생성',
      generatedDate: '생성일',
      completed: '✅ PDF 다운로드 완료',
      errorModalTitle: 'PDF 생성 안내',
      errorContentTooLarge: '대화 내용이 너무 길어 PDF 생성이 어려울 수 있습니다',
      errorContentTooLargeDesc: '다음 방법을 사용해 보세요',
      solutionsTitle: '다른 저장 방법',
      solutionSelectMessages: '필요한 메시지만 선택하여 내보내기',
      solutionSelectMessagesDesc: '각 메시지 왼쪽의 체크박스를 클릭하여 필요한 부분만 선택하세요',
      closeButton: '닫기'
    },
    en: {
      exportButtonText: 'Save PDF',
      modalTitle: 'Export Options',
      exportTypeLabel: 'Export Type:',
      exportTypeAll: 'All Messages',
      exportTypeSelected: 'Selected Messages',
      optionsLabel: 'Options:',
      includeTitle: 'Include Title',
      titlePlaceholder: 'Enter custom title',
      defaultChatTitle: 'ChatGPT Chat History',
      includeTimestamp: 'Include Timestamp',
      includeUserInfo: 'Include User Info',
      cleanFormat: 'Generate in Clean Format',
      exportFormatLabel: 'Export Format:',
      exportPDF: 'PDF Format',
      exportHTML: 'HTML Format',
      exportText: 'Text Format',
      cancel: 'Cancel',
      generateButton: 'Generate',
      generatedDate: 'Generated',
      completed: '✅ PDF Download Complete',
      errorModalTitle: 'PDF Generation Guide',
      errorContentTooLarge: 'The conversation is too long to generate a PDF',
      errorContentTooLargeDesc: 'Please try one of these methods',
      solutionsTitle: 'Alternative Export Methods',
      solutionSelectMessages: 'Export Selected Messages Only',
      solutionSelectMessagesDesc: 'Click the checkbox on the left of each message to select only what you need',
      closeButton: 'Close'
    },
    ja: {
      exportButtonText: 'PDF保存',
      modalTitle: 'エクスポートオプション',
      exportTypeLabel: '出力タイプ:',
      exportTypeAll: 'すべてのメッセージ',
      exportTypeSelected: '選択したメッセージ',
      optionsLabel: 'オプション:',
      includeTitle: 'タイトルを含める',
      titlePlaceholder: 'タイトルを入力',
      defaultChatTitle: 'ChatGPT チャット履歴',
      includeTimestamp: 'タイムスタンプを含める',
      includeUserInfo: 'ユーザー情報を含める',
      cleanFormat: 'クリーンな形式で生成',
      exportFormatLabel: 'エクスポート形式:',
      exportPDF: 'PDF形式',
      exportHTML: 'HTML形式',
      exportText: 'テキスト形式',
      cancel: 'キャンセル',
      generateButton: '生成',
      generatedDate: '生成日',
      completed: '✅ PDFダウンロード完了',
      errorModalTitle: 'PDF生成ガイド',
      errorContentTooLarge: '会話が長すぎてPDFを生成できません',
      errorContentTooLargeDesc: '次の方法をお試しください',
      solutionsTitle: '他の保存方法',
      solutionSelectMessages: '必要なメッセージのみ選択してエクスポート',
      solutionSelectMessagesDesc: '各メッセージの左のチェックボックスをクリックして必要な部分だけを選択してください',
      closeButton: '閉じる'
    }
  };

  private currentLanguage: SupportedLanguage = 'en';
  private languageDetector: LanguageDetector;
  private languageObserver: { disconnect: () => void } | null = null;

  constructor(languageDetector: LanguageDetector) {
    this.languageDetector = languageDetector;
  }

  async initialize(): Promise<void> {
    await this.syncWithChatGPTLanguage();
  }

  setLanguage(lang: string): void {
    const normalizedLang = this.normalizeLanguageCode(lang);
    const supportedLangs: SupportedLanguage[] = ['ko', 'en', 'ja'];
    
    if (supportedLangs.includes(normalizedLang as SupportedLanguage)) {
      this.currentLanguage = normalizedLang as SupportedLanguage;
    } else {
      this.currentLanguage = 'en';
    }
  }

  private normalizeLanguageCode(lang: string): string {
    if (!lang) return 'en';
    
    const primaryLang = lang.split('-')[0].toLowerCase();
    
    const langMap: Record<string, string> = {
      'ko': 'ko',
      'kr': 'ko',
      'en': 'en',
      'us': 'en',
      'ja': 'ja',
      'jp': 'ja'
    };
    
    return langMap[primaryLang] || 'en';
  }

  getMessage(key: MessageKey, substitutions?: string | string[]): string {
    const langMessages = this.messages[this.currentLanguage];
    
    if (!langMessages || !langMessages[key]) {
      // Fallback to English
      const enMessages = this.messages['en'];
      if (enMessages && enMessages[key]) {
        return this.formatMessage(enMessages[key], substitutions);
      }
      
      // Try browser.i18n API if available
      if (typeof browser !== 'undefined' && browser.i18n) {
        try {
          const browserMessage = browser.i18n.getMessage(key, substitutions);
          if (browserMessage) return browserMessage;
        } catch (e) {
          // Ignore error
        }
      }
      
      return key; // Return key if message not found
    }

    return this.formatMessage(langMessages[key], substitutions);
  }

  private formatMessage(message: string, substitutions?: string | string[]): string {
    if (!substitutions) return message;

    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    
    return message.replace(/\$(\d+)/g, (match, index) => {
      const idx = parseInt(index) - 1;
      return idx >= 0 && idx < subs.length ? subs[idx] : match;
    });
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  private async syncWithChatGPTLanguage(): Promise<void> {
    const detectedLang = this.languageDetector.getDetectedLanguage();
    this.setLanguage(detectedLang);
    
    // Observe language changes
    this.languageObserver = this.languageDetector.observeLanguageChanges((newLang) => {
      this.setLanguage(newLang);
      this.updateUI();
    });
  }

  updateUI(): void {
    // Update PDF export button text
    const exportBtn = document.getElementById('pdf-export-btn');
    if (exportBtn) {
      const textElement = exportBtn.querySelector('.pdf-button-text');
      if (textElement) {
        textElement.textContent = this.getMessage('exportButtonText');
      }
    }

    // Update open modal if exists
    const modal = document.getElementById('pdf-export-modal');
    if (modal) {
      // Modal title
      const title = modal.querySelector('.modal-header h3');
      if (title) {
        title.textContent = this.getMessage('modalTitle');
      }

      // Update other text elements
      this.updateModalElements(modal);
    }
  }

  private updateModalElements(modal: HTMLElement): void {
    const updateMapping: Record<string, MessageKey> = {
      '[data-i18n="exportTypeLabel"]': 'exportTypeLabel',
      '[data-i18n="optionsLabel"]': 'optionsLabel',
      '[data-i18n="exportFormatLabel"]': 'exportFormatLabel',
      '[data-i18n="exportTypeAll"]': 'exportTypeAll',
      '[data-i18n="exportTypeSelected"]': 'exportTypeSelected',
      '[data-i18n="includeTitle"]': 'includeTitle',
      '[data-i18n="includeTimestamp"]': 'includeTimestamp',
      '[data-i18n="includeUserInfo"]': 'includeUserInfo',
      '[data-i18n="cleanFormat"]': 'cleanFormat',
      '[data-i18n="generateButton"]': 'generateButton',
      '[data-i18n="cancel"]': 'cancel'
    };

    Object.entries(updateMapping).forEach(([selector, messageKey]) => {
      const element = modal.querySelector(selector);
      if (element) {
        element.textContent = this.getMessage(messageKey);
      }
    });
  }

  dispose(): void {
    if (this.languageObserver) {
      this.languageObserver.disconnect();
      this.languageObserver = null;
    }
  }
}