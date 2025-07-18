import './style.css';

// Initialize i18n when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeI18n();
  setupEventListeners();
});

// Initialize i18n for all elements with data-i18n attribute
function initializeI18n(): void {
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    if (!messageKey) return;
    
    try {
      const localizedText = browser.i18n.getMessage(messageKey);
      if (localizedText) {
        element.textContent = localizedText;
      }
    } catch (error) {
      // Keep fallback text on i18n error
      console.warn('i18n error for key:', messageKey);
    }
  });
}

// Set up event listeners
function setupEventListeners(): void {
  // Open ChatGPT button
  const openChatGPTBtn = document.getElementById('openChatGPT');
  if (openChatGPTBtn) {
    openChatGPTBtn.addEventListener('click', () => {
      browser.tabs.create({ url: 'https://chatgpt.com' });
      window.close();
    });
  }

  // Toggle instructions accordion
  const toggleBtn = document.getElementById('toggleInstructions');
  if (toggleBtn) {
    setupAccordion(toggleBtn);
  }
}

// Set up accordion functionality
let isAnimating = false;

function setupAccordion(toggleBtn: HTMLElement): void {
  toggleBtn.addEventListener('click', () => {
    if (isAnimating) return; // Ignore clicks during animation
    
    const panel = document.getElementById('instructionsPanel');
    const arrow = document.querySelector('.arrow');
    const buttonText = document.querySelector('.button-text');
    
    if (!panel || !arrow || !buttonText) return;
    
    isAnimating = true;
    
    if (panel.classList.contains('expanded')) {
      // Close accordion
      closeAccordion(panel, arrow, buttonText);
    } else {
      // Open accordion
      openAccordion(panel, arrow, buttonText);
    }
  });
}

function closeAccordion(
  panel: HTMLElement, 
  arrow: Element, 
  buttonText: Element
): void {
  // Set current height first, then animate to 0
  const currentHeight = panel.scrollHeight;
  panel.style.height = currentHeight + 'px';
  
  // Animate to 0 on next frame
  requestAnimationFrame(() => {
    panel.style.height = '0px';
  });
  
  panel.classList.remove('expanded');
  arrow.classList.remove('rotated');
  
  try {
    buttonText.textContent = browser.i18n.getMessage('showInstructions') || '사용 방법 보기';
  } catch (error) {
    buttonText.textContent = '사용 방법 보기';
  }
  
  // Reset flag after animation
  panel.addEventListener('transitionend', () => {
    isAnimating = false;
  }, { once: true });
}

function openAccordion(
  panel: HTMLElement, 
  arrow: Element, 
  buttonText: Element
): void {
  panel.classList.add('expanded');
  
  const contentHeight = panel.scrollHeight;
  panel.style.height = contentHeight + 'px';
  
  // Set height to auto after animation completes
  panel.addEventListener('transitionend', () => {
    if (panel.classList.contains('expanded')) {
      panel.style.height = 'auto';
    }
    isAnimating = false;
  }, { once: true });
  
  arrow.classList.add('rotated');
  
  try {
    buttonText.textContent = browser.i18n.getMessage('hideInstructions') || '사용 방법 숨기기';
  } catch (error) {
    buttonText.textContent = '사용 방법 숨기기';
  }
}