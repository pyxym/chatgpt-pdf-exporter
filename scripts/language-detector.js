// ChatGPT 언어 설정 감지 유틸리티

class LanguageDetector {
  constructor() {
    this.supportedLanguages = ['ko', 'en', 'ja'];
    this.defaultLanguage = 'en';
    this.detectedLanguage = null;
  }

  // ChatGPT의 언어 설정을 감지
  detectChatGPTLanguage() {
    // 1. HTML lang 속성 확인
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      const langCode = this.normalizeLanguageCode(htmlLang);
      if (this.supportedLanguages.includes(langCode)) {
        return langCode;
      }
    }

    // 2. ChatGPT UI에서 언어 힌트 찾기
    // 설정 메뉴의 언어 텍스트 확인
    const settingsText = this.findLanguageFromSettings();
    if (settingsText) {
      return settingsText;
    }

    // 3. UI 텍스트로 언어 추론
    const inferredLang = this.inferLanguageFromUI();
    if (inferredLang) {
      return inferredLang;
    }

    // 4. 브라우저 언어 설정 사용
    return this.getBrowserLanguage();
  }

  // 언어 코드 정규화 (en-US -> en)
  normalizeLanguageCode(lang) {
    if (!lang) return this.defaultLanguage;
    
    const primaryLang = lang.split('-')[0].toLowerCase();
    
    // 언어 코드 매핑
    const langMap = {
      'ko': 'ko',
      'kr': 'ko',
      'en': 'en',
      'us': 'en',
      'ja': 'ja',
      'jp': 'ja'
    };
    
    return langMap[primaryLang] || this.defaultLanguage;
  }

  // 설정 메뉴에서 언어 찾기
  findLanguageFromSettings() {
    // 설정 버튼이나 프로필 메뉴에서 언어 정보 찾기
    const selectors = [
      '[data-state="active"] [data-language]',
      '[aria-label*="Language"]',
      '[class*="locale"]:not([class*="icon"])',
      '[class*="language"]:not([class*="icon"])'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.toLowerCase();
        if (text.includes('한국어') || text.includes('korean')) return 'ko';
        if (text.includes('english')) return 'en';
        if (text.includes('日本語') || text.includes('japanese')) return 'ja';
      }
    }

    return null;
  }

  // UI 텍스트로 언어 추론
  inferLanguageFromUI() {
    // 주요 UI 요소의 텍스트 확인
    const uiTexts = {
      ko: ['새로운 채팅', '보내기', '재생성', '편집', '복사', '공유', '더 보기'],
      en: ['New chat', 'Send', 'Regenerate', 'Edit', 'Copy', 'Share', 'More'],
      ja: ['新しいチャット', '送信', '再生成', '編集', 'コピー', '共有', 'もっと見る']
    };

    // 각 언어별 매칭 점수 계산
    const scores = {};
    
    for (const [lang, keywords] of Object.entries(uiTexts)) {
      scores[lang] = 0;
      
      for (const keyword of keywords) {
        // 대소문자 구분 없이 검색
        const regex = new RegExp(keyword, 'i');
        if (document.body.textContent.match(regex)) {
          scores[lang]++;
        }
      }
    }

    // 가장 높은 점수의 언어 반환
    let maxScore = 0;
    let detectedLang = null;
    
    for (const [lang, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    // 최소 2개 이상 매칭되어야 유효
    return maxScore >= 2 ? detectedLang : null;
  }

  // 브라우저 언어 설정 가져오기
  getBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage || this.defaultLanguage;
    return this.normalizeLanguageCode(browserLang);
  }

  // 감지된 언어 가져오기 (캐시 사용)
  getDetectedLanguage() {
    if (!this.detectedLanguage) {
      this.detectedLanguage = this.detectChatGPTLanguage();
    }
    return this.detectedLanguage;
  }

  // 언어 변경 감지를 위한 옵저버 설정
  observeLanguageChanges(callback) {
    // HTML lang 속성 변경 감지
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
          this.detectedLanguage = null; // 캐시 초기화
          const newLang = this.getDetectedLanguage();
          callback(newLang);
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });

    // 설정 변경 감지 (DOM 변경 감지)
    const bodyObserver = new MutationObserver(() => {
      const currentLang = this.getDetectedLanguage();
      if (currentLang !== this.detectedLanguage) {
        this.detectedLanguage = currentLang;
        callback(currentLang);
      }
    });

    // 주기적으로 체크 (설정 페이지 등)
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return {
      disconnect: () => {
        observer.disconnect();
        bodyObserver.disconnect();
      }
    };
  }
}

// 전역 인스턴스 생성
window.languageDetector = new LanguageDetector();