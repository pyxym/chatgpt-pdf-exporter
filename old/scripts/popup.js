// 페이지 로드 시 다국어 초기화
document.addEventListener('DOMContentLoaded', () => {
  initializeI18n();
});

// 다국어 초기화 함수 - 에러 방지
function initializeI18n() {
  // data-i18n 속성을 가진 모든 요소 찾기
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    try {
      const localizedText = chrome.i18n.getMessage(messageKey);
      if (localizedText) {
        element.textContent = localizedText;
      }
    } catch (error) {
      // i18n error - fallback text는 그대로 유지
    }
  });
}

document.getElementById('openChatGPT').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://chatgpt.com' });
  window.close();
});

let isAnimating = false;

document.getElementById('toggleInstructions').addEventListener('click', () => {
  if (isAnimating) return; // 애니메이션 중이면 클릭 무시
  
  const panel = document.getElementById('instructionsPanel');
  const arrow = document.querySelector('.arrow');
  const buttonText = document.querySelector('.button-text');
  
  isAnimating = true;
  
  if (panel.classList.contains('expanded')) {
    // Close accordion - 먼저 현재 높이를 설정한 후 0으로 애니메이션
    const currentHeight = panel.scrollHeight;
    panel.style.height = currentHeight + 'px';
    
    // 다음 프레임에서 높이를 0으로 변경
    requestAnimationFrame(() => {
      panel.style.height = '0px';
    });
    
    panel.classList.remove('expanded');
    arrow.classList.remove('rotated');
    try {
      buttonText.textContent = chrome.i18n.getMessage('showInstructions') || '사용 방법 보기';
    } catch (error) {
      buttonText.textContent = '사용 방법 보기';
    }
    
    // 애니메이션 완료 후 플래그 리셋
    panel.addEventListener('transitionend', () => {
      isAnimating = false;
    }, { once: true });
  } else {
    // Open accordion - 0에서 실제 높이로 애니메이션
    panel.classList.add('expanded');
    
    const contentHeight = panel.scrollHeight;
    panel.style.height = contentHeight + 'px';
    
    // 애니메이션 완료 후 height를 auto로 설정하고 플래그 리셋
    panel.addEventListener('transitionend', () => {
      if (panel.classList.contains('expanded')) {
        panel.style.height = 'auto';
      }
      isAnimating = false;
    }, { once: true });
    
    arrow.classList.add('rotated');
    buttonText.textContent = chrome.i18n.getMessage('hideInstructions');
    
  }
});