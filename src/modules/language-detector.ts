export type SupportedLanguage = 'ko' | 'en' | 'ja';

interface LanguageScores {
  ko: number;
  en: number;
  ja: number;
}

interface LanguageObserver {
  disconnect: () => void;
}

export default class LanguageDetector {
  private supportedLanguages: SupportedLanguage[] = ['ko', 'en', 'ja'];
  private defaultLanguage: SupportedLanguage = 'en';
  private detectedLanguage: SupportedLanguage | null = null;

  detectChatGPTLanguage(): SupportedLanguage {
    // 1. Check HTML lang attribute
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      const langCode = this.normalizeLanguageCode(htmlLang);
      if (this.isSupportedLanguage(langCode)) {
        return langCode;
      }
    }

    // 2. Find language from settings
    const settingsLang = this.findLanguageFromSettings();
    if (settingsLang) {
      return settingsLang;
    }

    // 3. Infer language from UI
    const inferredLang = this.inferLanguageFromUI();
    if (inferredLang) {
      return inferredLang;
    }

    // 4. Use browser language
    return this.getBrowserLanguage();
  }

  private normalizeLanguageCode(lang: string): SupportedLanguage {
    if (!lang) return this.defaultLanguage;
    
    const primaryLang = lang.split('-')[0].toLowerCase();
    
    const langMap: Record<string, SupportedLanguage> = {
      'ko': 'ko',
      'kr': 'ko',
      'en': 'en',
      'us': 'en',
      'ja': 'ja',
      'jp': 'ja'
    };
    
    return langMap[primaryLang] || this.defaultLanguage;
  }

  private isSupportedLanguage(lang: string): lang is SupportedLanguage {
    return this.supportedLanguages.includes(lang as SupportedLanguage);
  }

  private findLanguageFromSettings(): SupportedLanguage | null {
    const selectors = [
      '[data-state="active"] [data-language]',
      '[aria-label*="Language"]',
      '[class*="locale"]:not([class*="icon"])',
      '[class*="language"]:not([class*="icon"])'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.toLowerCase() || '';
        if (text.includes('한국어') || text.includes('korean')) return 'ko';
        if (text.includes('english')) return 'en';
        if (text.includes('日本語') || text.includes('japanese')) return 'ja';
      }
    }

    return null;
  }

  private inferLanguageFromUI(): SupportedLanguage | null {
    const uiTexts: Record<SupportedLanguage, string[]> = {
      ko: ['새로운 채팅', '보내기', '재생성', '편집', '복사', '공유', '더 보기'],
      en: ['New chat', 'Send', 'Regenerate', 'Edit', 'Copy', 'Share', 'More'],
      ja: ['新しいチャット', '送信', '再生成', '編集', 'コピー', '共有', 'もっと見る']
    };

    const scores: LanguageScores = { ko: 0, en: 0, ja: 0 };
    
    for (const [lang, keywords] of Object.entries(uiTexts) as [SupportedLanguage, string[]][]) {
      for (const keyword of keywords) {
        const regex = new RegExp(keyword, 'i');
        if (document.body.textContent?.match(regex)) {
          scores[lang]++;
        }
      }
    }

    let maxScore = 0;
    let detectedLang: SupportedLanguage | null = null;
    
    for (const [lang, score] of Object.entries(scores) as [SupportedLanguage, number][]) {
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    // Require at least 2 matches to be valid
    return maxScore >= 2 ? detectedLang : null;
  }

  private getBrowserLanguage(): SupportedLanguage {
    const browserLang = navigator.language || this.defaultLanguage;
    return this.normalizeLanguageCode(browserLang);
  }

  getDetectedLanguage(): SupportedLanguage {
    if (!this.detectedLanguage) {
      this.detectedLanguage = this.detectChatGPTLanguage();
    }
    return this.detectedLanguage;
  }

  observeLanguageChanges(callback: (lang: SupportedLanguage) => void): LanguageObserver {
    // Observe HTML lang attribute changes
    const htmlObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
          this.detectedLanguage = null; // Reset cache
          const newLang = this.getDetectedLanguage();
          callback(newLang);
        }
      }
    });

    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });

    // Observe DOM changes for settings
    const bodyObserver = new MutationObserver(() => {
      const currentLang = this.detectChatGPTLanguage();
      if (currentLang !== this.detectedLanguage) {
        this.detectedLanguage = currentLang;
        callback(currentLang);
      }
    });

    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return {
      disconnect: () => {
        htmlObserver.disconnect();
        bodyObserver.disconnect();
      }
    };
  }
}