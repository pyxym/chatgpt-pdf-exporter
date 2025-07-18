// 확장 프로그램 초기화
function initPDFExporter() {
  // ChatGPT 언어와 동기화
  if (window.i18nManager && window.languageDetector) {
    window.i18nManager.syncWithChatGPTLanguage();
  }
  
  // 페이지 관찰자 초기화
  if (window.pageObserver) {
    window.pageObserver.init();
  } else {
    // 모듈이 로드되지 않은 경우 대체 초기화
    // PageObserver module not loaded, using fallback initialization
    fallbackInit();
  }
}

// 대체 초기화 (모듈 로드 실패 시)
function fallbackInit() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeComponents, 2000);
    });
  } else {
    setTimeout(initializeComponents, 2000);
  }
}

// 컴포넌트 초기화
function initializeComponents() {
  // UI 매니저가 로드된 경우
  if (window.uiManager) {
    window.uiManager.createExportButton();
    window.uiManager.addMessageSelectionFeature();
  }
  
  // 페이지 변화 감지 시작
  observePageChanges();
}

// 페이지 변화 감지 (대체 함수)
function observePageChanges() {
  const observer = new MutationObserver(() => {
    if (!document.getElementById('pdf-export-btn')) {
      setTimeout(() => {
        if (window.uiManager) {
          window.uiManager.createExportButton();
        }
      }, 1000);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 페이지 로드 시 초기화 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPDFExporter);
} else {
  initPDFExporter();
}
