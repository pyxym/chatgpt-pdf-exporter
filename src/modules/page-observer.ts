import type UIManager from './ui-manager';

interface ObserverOptions {
  checkInterval?: number;
  debounceDelay?: number;
}

export default class PageObserver {
  private uiManager: UIManager;
  private observer: MutationObserver | null = null;
  private checkInterval: number;
  private debounceDelay: number;
  private debounceTimer: NodeJS.Timeout | null = null;
  private isObserving: boolean = false;
  private lastButtonUpdate: number = 0;
  private minUpdateInterval: number = 1000; // Minimum 1 second between updates

  constructor(uiManager: UIManager, options: ObserverOptions = {}) {
    this.uiManager = uiManager;
    this.checkInterval = options.checkInterval || 2000;
    this.debounceDelay = options.debounceDelay || 500;
  }

  async startObserving(): Promise<void> {
    if (this.isObserving) {
      return;
    }

    this.isObserving = true;

    // Initial check and setup
    if (this.isConversationPage()) {
      await this.initializeUI();
    }

    // Setup mutation observer
    this.setupMutationObserver();

    // Setup periodic check for page navigation
    this.setupPeriodicCheck();

    console.log('PageObserver started');
  }

  private async initializeUI(): Promise<void> {
    try {
      // Wait a bit for React hydration to complete
      await this.waitForPageLoad();
      
      // Create export button
      this.uiManager.createExportButton();
      
      // Add message selection feature
      this.uiManager.addMessageSelectionFeature();
    } catch (error) {
      console.error('Error initializing UI:', error);
    }
  }

  private async waitForPageLoad(): Promise<void> {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        // Check if ChatGPT UI elements are loaded
        const mainContent = document.querySelector('main');
        const hasMessages = document.querySelector('[data-message-author-role], [data-message-id], .group\\/conversation-turn');
        
        if (mainContent && (hasMessages || !this.isConversationPage())) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      
      if (document.readyState === 'complete') {
        checkLoaded();
      } else {
        window.addEventListener('load', () => checkLoaded());
      }
    });
  }

  private setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-message-author-role', 'data-message-id']
    });
  }

  private handleMutations(mutations: MutationRecord[]): void {
    let shouldUpdate = false;
    let hasNewMessages = false;

    for (const mutation of mutations) {
      // Check for page navigation
      if (this.isNavigationMutation(mutation)) {
        shouldUpdate = true;
        break;
      }

      // Check for new messages
      if (this.isMessageMutation(mutation)) {
        hasNewMessages = true;
      }
    }

    if (shouldUpdate) {
      this.debounceUpdateButton();
    }

    if (hasNewMessages) {
      // Debounce message selection updates
      this.debounceMessageSelectionUpdate();
    }
  }

  private isNavigationMutation(mutation: MutationRecord): boolean {
    // Check if URL changed
    if (window.location.pathname !== this.lastKnownPath) {
      this.lastKnownPath = window.location.pathname;
      return true;
    }

    // Check for main content changes
    if (mutation.type === 'childList') {
      const target = mutation.target as Element;
      if (target.tagName === 'MAIN' || target.querySelector('main')) {
        return true;
      }
    }

    return false;
  }

  private isMessageMutation(mutation: MutationRecord): boolean {
    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.matches('[data-message-author-role], [data-message-id], .group\\/conversation-turn') ||
              element.querySelector('[data-message-author-role], [data-message-id], .group\\/conversation-turn')) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private debounceUpdateButton(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const now = Date.now();
      if (now - this.lastButtonUpdate >= this.minUpdateInterval) {
        this.updateButton();
        this.lastButtonUpdate = now;
      }
    }, this.debounceDelay);
  }

  private debounceMessageSelectionUpdate(): void {
    // Use a separate timer for message selection updates
    setTimeout(() => {
      if (this.isConversationPage()) {
        this.uiManager.addMessageSelectionFeature();
      }
    }, 300);
  }

  private updateButton(): void {
    if (this.isConversationPage()) {
      const existingButton = document.getElementById('pdf-export-btn');
      if (!existingButton) {
        this.uiManager.createExportButton();
      }
    } else {
      // Remove button if not on conversation page
      const existingButton = document.getElementById('pdf-export-btn');
      if (existingButton) {
        existingButton.remove();
      }
    }
  }

  private setupPeriodicCheck(): void {
    setInterval(() => {
      if (this.isConversationPage()) {
        const button = document.getElementById('pdf-export-btn');
        if (!button) {
          this.updateButton();
        }
      }
    }, this.checkInterval);
  }

  private isConversationPage(): boolean {
    // Check if we're on a conversation page
    const path = window.location.pathname;
    
    // ChatGPT conversation URL patterns
    if (path.includes('/c/') || path.includes('/chat/')) {
      return true;
    }
    
    // Check for conversation content
    const hasConversation = !!(
      document.querySelector('[data-message-author-role]') ||
      document.querySelector('[data-message-id]') ||
      document.querySelector('.group\\/conversation-turn') ||
      document.querySelector('main [class*="flex"][class*="flex-col"]')
    );
    
    return hasConversation;
  }

  private lastKnownPath: string = window.location.pathname;

  stopObserving(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.isObserving = false;
    console.log('PageObserver stopped');
  }

  dispose(): void {
    this.stopObserving();
  }
}