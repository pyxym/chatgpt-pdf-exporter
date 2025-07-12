// 페이지 관찰 및 초기화 관련 기능들을 관리하는 모듈

class PageObserver {
  constructor() {
    this.uiManager = null;
    this.buttonCheckInterval = null;
    this.urlCheckInterval = null;
    this.buttonUpdateTimeout = null;
    this.messageUpdateTimeout = null;
    this.currentUrl = window.location.href;
  }

  // 초기화
  init() {
    // UI 매니저 참조 설정
    this.uiManager = window.uiManager;
    
    // DOM 로드 대기
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeAfterLoad());
    } else {
      this.initializeAfterLoad();
    }
  }

  // DOM 로드 후 초기화 (성능 최적화)
  initializeAfterLoad() {
    // React 하이드레이션 완료 대기 후 버튼 생성
    this.waitForReactHydration(() => {
      this.createExportButton();
      this.addMessageSelectionFeature();
      this.startObserving();
    });
  }

  // React 하이드레이션 완료 대기 (성능 최적화)
  waitForReactHydration(callback) {
    // React 하이드레이션 에러를 방지하기 위해 약간의 지연
    const checkReactReady = () => {
      // React 앱이 완전히 로드되었는지 확인
      const reactRoot = document.querySelector('#__next, [data-reactroot]');
      if (reactRoot) {
        // 추가 지연으로 하이드레이션 완료 보장
        setTimeout(callback, 100);
      } else {
        // React 앱을 찾지 못했을 때는 일반적인 지연 후 실행
        setTimeout(callback, 300);
      }
    };
    
    // 페이지가 이미 로드되었다면 즉시 체크, 아니면 대기
    if (document.readyState === 'complete') {
      setTimeout(checkReactReady, 100); // 빠른 초기화
    } else {
      window.addEventListener('load', () => {
        setTimeout(checkReactReady, 100);
      });
    }
  }

  // fallback 초기화 (기존 코드 유지)
  fallbackInitialize() {
    // 버튼이 생성되지 않았을 경우에만 지연 재시도
    if (!document.getElementById('pdf-export-btn')) {
      setTimeout(() => {
        this.createExportButton();
      }, 500);
    }
  }

  // 내보내기 버튼 생성
  createExportButton() {
    if (this.uiManager) {
      const button = this.uiManager.createExportButton();
      if (button) {
        this.retryCount = 0; // 성공 시 재시도 횟수 초기화
      } else {
        this.retryCreateButton();
      }
    }
  }

  // 버튼 생성 재시도
  retryCreateButton() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        this.createExportButton();
      }, 1000 * this.retryCount); // 점진적 지연
    }
  }

  // 메시지 선택 기능 추가
  addMessageSelectionFeature() {
    if (this.uiManager) {
      this.uiManager.addMessageSelectionFeature();
    }
  }

  // 페이지 변화 감지 시작 (MutationObserver 제거)
  startObserving() {
    // Navigation handler
    this.navigationHandler = () => {
      if (this.currentUrl !== window.location.href) {
        this.currentUrl = window.location.href;
        // Update button
        this.debounceUpdateButton();
      }
    };
    
    // Navigation events
    window.addEventListener('popstate', this.navigationHandler);
    
    // Modern navigation API if available
    if (window.navigation) {
      window.navigation.addEventListener('navigate', this.navigationHandler);
    }
    
    // URL check interval만 사용
    this.urlCheckInterval = setInterval(() => {
      if (this.currentUrl !== window.location.href) {
        this.currentUrl = window.location.href;
        this.navigationHandler();
      }
      
      // 버튼 체크
      if (this.isConversationPage() && !document.getElementById('pdf-export-btn')) {
        this.debounceUpdateButton();
      }
    }, 3000); // 3초마다 체크
  }

  // MutationObserver 제거로 이 메서드는 더 이상 필요 없음

  // 버튼 업데이트 디바운스 (성능 개선)
  debounceUpdateButton() {
    if (this.buttonUpdateTimeout) {
      clearTimeout(this.buttonUpdateTimeout);
    }

    this.buttonUpdateTimeout = setTimeout(() => {
      // 대화 페이지에서만 버튼 생성 시도
      if (this.isConversationPage()) {
        this.createExportButton();
      }
    }, 500); // 다시 500ms로 복원
  }

  // 메시지 업데이트 디바운스 (기능 복원)
  debounceUpdateMessages() {
    if (this.messageUpdateTimeout) {
      clearTimeout(this.messageUpdateTimeout);
    }

    this.messageUpdateTimeout = setTimeout(() => {
      // 대화 페이지에서만 메시지 선택 기능 추가
      if (this.isConversationPage()) {
        this.addMessageSelectionFeature();
      }
    }, 300);
  }

  // 페이지 변화 감지 중지
  stopObserving() {
    // Clear intervals
    if (this.urlCheckInterval) {
      clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }

    if (this.buttonUpdateTimeout) {
      clearTimeout(this.buttonUpdateTimeout);
      this.buttonUpdateTimeout = null;
    }

    if (this.messageUpdateTimeout) {
      clearTimeout(this.messageUpdateTimeout);
      this.messageUpdateTimeout = null;
    }

    // Navigation event listeners 제거
    if (this.navigationHandler) {
      window.removeEventListener('popstate', this.navigationHandler);
      if (window.navigation) {
        window.navigation.removeEventListener('navigate', this.navigationHandler);
      }
      this.navigationHandler = null;
    }
  }

  // 대화 페이지인지 확인 (manifest.json에서 이미 ChatGPT 페이지만 실행)
  isConversationPage() {
    const pathname = window.location.pathname;
    
    // 다양한 대화 페이지 패턴 확인
    const conversationPatterns = [
      /^\/c\/[a-zA-Z0-9\-]+/, // 기본 대화 패턴
      /^\/chat\/[a-zA-Z0-9\-]+/, // 새로운 chat 패턴
      /^\/g\/[a-zA-Z0-9\-]+\/c\/[a-zA-Z0-9\-]+/ // GPTs 대화 패턴
    ];
    
    // 패턴 중 하나라도 일치하면 true
    const isConversation = conversationPatterns.some(pattern => pattern.test(pathname));
    
    // 또는 메시지가 있는 페이지인지 확인
    const hasMessages = document.querySelector('[data-message-author-role]') !== null ||
                       document.querySelector('[data-message-id]') !== null;
    
    return isConversation || hasMessages;
  }

  // 페이지 상태 확인 (manifest.json에서 이미 ChatGPT 페이지만 실행)
  getPageStatus() {
    return {
      isConversation: this.isConversationPage(),
      hasMessages: document.querySelectorAll('[data-message-author-role]').length > 0,
      hasExportButton: document.getElementById('pdf-export-btn') !== null
    };
  }
}

// 전역 인스턴스 생성
window.pageObserver = new PageObserver();