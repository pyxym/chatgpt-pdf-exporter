// 동적 다국어 지원 매니저

class I18nManager {
  constructor() {
    this.messages = {
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
    this.currentLanguage = 'en';
  }

  // 현재 언어 설정
  setLanguage(lang) {
    const normalizedLang = this.normalizeLanguageCode(lang);
    
    // 지원하는 언어인지 확인
    const supportedLangs = ['ko', 'en', 'ja'];
    if (!supportedLangs.includes(normalizedLang)) {
      this.currentLanguage = 'en';
    } else {
      this.currentLanguage = normalizedLang;
    }
  }

  // 언어 코드 정규화
  normalizeLanguageCode(lang) {
    if (!lang) return 'en';
    
    const primaryLang = lang.split('-')[0].toLowerCase();
    
    const langMap = {
      'ko': 'ko',
      'kr': 'ko',
      'en': 'en',
      'us': 'en',
      'ja': 'ja',
      'jp': 'ja'
    };
    
    return langMap[primaryLang] || 'en';
  }

  // 메시지 가져오기 (chrome.i18n.getMessage 대체)
  getMessage(key, substitutions) {
    const langMessages = this.messages[this.currentLanguage];
    
    if (!langMessages || !langMessages[key]) {
      // 현재 언어에 메시지가 없으면 영어로 폴백
      const enMessages = this.messages['en'];
      if (enMessages && enMessages[key]) {
        return this.formatMessage(enMessages[key], substitutions);
      }
      // chrome.i18n에서 시도
      try {
        const chromeMessage = window.originalGetMessage ? window.originalGetMessage(key, substitutions) : chrome.i18n.getMessage(key, substitutions);
        if (chromeMessage) return chromeMessage;
      } catch (e) {
        // 무시
      }
      return key; // 메시지를 찾을 수 없으면 키 반환
    }

    return this.formatMessage(langMessages[key], substitutions);
  }

  // 메시지 포맷팅 (대체 문자열 처리)
  formatMessage(message, substitutions) {
    if (!substitutions) return message;

    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    
    return message.replace(/\$(\d+)/g, (match, index) => {
      const idx = parseInt(index) - 1;
      return idx >= 0 && idx < subs.length ? subs[idx] : match;
    });
  }

  // 현재 언어 가져오기
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // ChatGPT 언어와 동기화
  syncWithChatGPTLanguage() {
    if (window.languageDetector) {
      const detectedLang = window.languageDetector.getDetectedLanguage();
      this.setLanguage(detectedLang);
      
      // 언어 변경 감지
      window.languageDetector.observeLanguageChanges((newLang) => {
        this.setLanguage(newLang);
        // UI 업데이트 트리거
        this.updateUI();
      });
    }
  }

  // UI 업데이트 (언어 변경 시)
  updateUI() {
    // PDF 내보내기 버튼 텍스트 업데이트
    const exportBtn = document.getElementById('pdf-export-btn');
    if (exportBtn) {
      const textElement = exportBtn.querySelector('.pdf-button-text');
      if (textElement) {
        textElement.textContent = this.getMessage('exportButtonText');
      }
    }

    // 열려있는 모달 업데이트
    const modal = document.getElementById('pdf-export-modal');
    if (modal) {
      // 모달 제목
      const title = modal.querySelector('.modal-header h3');
      if (title) {
        title.textContent = this.getMessage('modalTitle');
      }

      // 기타 텍스트 요소들 업데이트
      const elementsToUpdate = [
        { selector: 'h4', messageKeys: ['exportTypeLabel', 'optionsLabel', 'exportFormatLabel'] },
        { selector: 'label', messageKeys: ['exportTypeAll', 'exportTypeSelected', 'includeTitle', 'includeTimestamp', 'includeUserInfo', 'cleanFormat'] },
        { selector: '.generate-btn', messageKeys: ['generateButton'] },
        { selector: '.cancel-btn', messageKeys: ['cancel'] }
      ];

      elementsToUpdate.forEach(({ selector, messageKeys }) => {
        const elements = modal.querySelectorAll(selector);
        elements.forEach((el, index) => {
          if (messageKeys[index]) {
            el.textContent = this.getMessage(messageKeys[index]);
          }
        });
      });
    }
  }
}

// 전역 인스턴스 생성
window.i18nManager = new I18nManager();

// chrome.i18n.getMessage를 커스텀 함수로 오버라이드
if (!window.originalGetMessage) {
  window.originalGetMessage = chrome.i18n.getMessage;
  chrome.i18n.getMessage = (key, substitutions) => {
    return window.i18nManager.getMessage(key, substitutions);
  };
}