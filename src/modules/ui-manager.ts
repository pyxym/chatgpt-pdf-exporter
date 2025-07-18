import type I18nManager from './i18n-manager';
import type { I18nMessages } from './i18n-manager';

// Types and Interfaces
export interface ExportOptions {
  exportType: 'all' | 'selected';
  includeTitle: boolean;
  customTitle: string;
  includeTimestamp: boolean;
  includeUserInfo: boolean;
  cleanFormat: boolean;
  selectedFormat: 'pdf' | 'html' | 'text';
}

export interface ModalElements {
  modal: HTMLDivElement;
  closeBtn: HTMLElement;
  cancelBtn: HTMLButtonElement;
  generateBtn: HTMLButtonElement;
  formatButtons: {
    pdf: HTMLButtonElement;
    html: HTMLButtonElement;
    text: HTMLButtonElement;
  };
  exportTypeRadios: {
    all: HTMLInputElement;
    selected: HTMLInputElement;
  };
  optionCheckboxes: {
    includeTitle: HTMLInputElement;
    includeTimestamp: HTMLInputElement;
    includeUserInfo: HTMLInputElement;
    cleanFormat: HTMLInputElement;
  };
  titleInput: HTMLInputElement;
  titleInputContainer: HTMLDivElement;
}

export interface NotificationOptions {
  duration?: number;
  type?: 'info' | 'success' | 'error' | 'warning';
}

// Event types
export type ExportModalCallback = (options: ExportOptions) => void;
export type MessageSelectionCallback = (selectedIndices: Set<number>) => void;

export default class UIManager {
  private selectedMessages: Set<number> = new Set();
  private i18nManager: I18nManager;
  private exportModalCallback: ExportModalCallback | null = null;
  private messageSelectionCallback: MessageSelectionCallback | null = null;
  private currentModal: HTMLDivElement | null = null;

  constructor(i18nManager: I18nManager) {
    this.i18nManager = i18nManager;
  }

  async initialize(): Promise<void> {
    // Inject styles
    this.injectStyles();
    
    // Create initial UI elements
    this.createExportButton();
    this.addMessageSelectionFeature();
  }

  private injectStyles(): void {
    if (document.getElementById('chatgpt-pdf-exporter-styles')) return;

    const style = document.createElement('style');
    style.id = 'chatgpt-pdf-exporter-styles';
    style.textContent = `
      /* PDF Export Button Styles */
      #pdf-export-btn:hover {
        opacity: 0.8;
      }

      /* Modal Styles */
      .pdf-export-modal {
        display: block;
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .pdf-export-modal .modal-content {
        background-color: #fefefe;
        margin: 5% auto;
        padding: 0;
        border: 1px solid #888;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from { 
          opacity: 0;
          transform: translateY(-20px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }

      .pdf-export-modal .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e5e5e5;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .pdf-export-modal .modal-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #202123;
      }

      .pdf-export-modal .close-btn {
        font-size: 28px;
        font-weight: normal;
        line-height: 1;
        color: #aaa;
        cursor: pointer;
        transition: color 0.2s;
      }

      .pdf-export-modal .close-btn:hover {
        color: #000;
      }

      .pdf-export-modal .modal-body {
        padding: 20px;
      }

      .pdf-export-modal .modal-footer {
        padding: 20px;
        border-top: 1px solid #e5e5e5;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      /* Section Styles */
      .pdf-export-modal .export-type-section,
      .pdf-export-modal .options-section,
      .pdf-export-modal .format-section {
        margin-bottom: 25px;
      }

      .pdf-export-modal h4 {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 600;
        color: #202123;
      }

      /* Radio and Checkbox Styles */
      .pdf-export-modal input[type="radio"],
      .pdf-export-modal input[type="checkbox"] {
        margin-right: 8px;
        cursor: pointer;
      }

      .pdf-export-modal label {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        cursor: pointer;
        color: #202123;
      }

      /* Input Styles */
      .pdf-export-modal .title-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #e5e5e5;
        border-radius: 6px;
        font-size: 14px;
        margin-top: 10px;
        transition: border-color 0.2s;
      }

      .pdf-export-modal .title-input:focus {
        outline: none;
        border-color: #10a37f;
      }

      /* Button Styles */
      .pdf-export-modal button {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .pdf-export-modal .generate-btn {
        background-color: #10a37f;
        color: white;
      }

      .pdf-export-modal .generate-btn:hover {
        background-color: #0d8f6e;
      }

      .pdf-export-modal .cancel-btn {
        background-color: #f0f0f0;
        color: #202123;
      }

      .pdf-export-modal .cancel-btn:hover {
        background-color: #e0e0e0;
      }

      /* Format Buttons */
      .pdf-export-modal .format-buttons {
        display: flex;
        gap: 10px;
      }

      .pdf-export-modal .format-btn {
        flex: 1;
        padding: 10px;
        border: 2px solid #e5e5e5;
        background-color: white;
        color: #202123;
        transition: all 0.2s;
      }

      .pdf-export-modal .format-btn:hover {
        border-color: #10a37f;
      }

      .pdf-export-modal .format-btn.active {
        border-color: #10a37f;
        background-color: #f0f9ff;
        color: #10a37f;
      }

      /* Message Selection Styles */
      .message-selector {
        position: absolute;
        left: -30px;
        top: 10px;
        width: 20px;
        height: 20px;
        border: 2px solid #10a37f;
        border-radius: 4px;
        background-color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        transition: all 0.2s;
        z-index: 100;
      }

      .message-selector:hover {
        transform: scale(1.1);
      }

      .selected-message {
        background-color: rgba(16, 163, 127, 0.05);
      }

      /* Notification Styles */
      .pdf-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .pdf-notification-info {
        background-color: #3b82f6;
      }

      .pdf-notification-success {
        background-color: #10b981;
      }

      .pdf-notification-error {
        background-color: #ef4444;
      }

      .pdf-notification-warning {
        background-color: #f59e0b;
      }

      /* Fallback Button */
      .pdf-export-button-fallback {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: #10a37f;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
      }

      .pdf-export-button-fallback:hover {
        background-color: #0d8f6e;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
    `;
    
    document.head.appendChild(style);
  }

  // PDF Export Button Management
  createExportButton(): HTMLButtonElement | null {
    try {
      this.removeExistingButton();

      const isDesktop = window.innerWidth >= 768;
      const targetContainer = this.findTargetContainer(isDesktop);
      
      if (targetContainer) {
        const button = this.createButtonElement(isDesktop);
        this.applyButtonStyles(button, targetContainer);
        this.insertButtonIntoContainer(button, targetContainer);
        this.addButtonEventListeners(button);
        return button;
      } else {
        return this.createFallbackButton();
      }
    } catch (error) {
      console.error('Error creating export button:', error);
      return this.createFallbackButton();
    }
  }

  private removeExistingButton(): void {
    const existingButton = document.getElementById('pdf-export-btn');
    if (existingButton) {
      existingButton.remove();
    }
  }

  private findTargetContainer(isDesktop: boolean): Element | null {
    if (isDesktop) {
      return this.findDesktopContainer();
    } else {
      return this.findMobileContainer();
    }
  }

  private findDesktopContainer(): Element | null {
    // 1. Look for conversation header actions
    const headerActions = document.getElementById('conversation-header-actions');
    if (headerActions) {
      const pageHeader = document.getElementById('page-header');
      if (pageHeader && 
          window.getComputedStyle(pageHeader).display !== 'none' &&
          !pageHeader.classList.contains('max-md:hidden')) {
        return headerActions;
      }
    }

    // 2. Find share button directly
    const shareButton = document.querySelector('[data-testid="share-chat-button"]');
    if (shareButton?.parentElement) {
      return shareButton.parentElement;
    }

    // 3. Find share button by aria-label
    const shareLabels = ['Share', '共有する', '공유'];
    for (const label of shareLabels) {
      const button = document.querySelector(`button[aria-label*="${label}"]`);
      if (button?.parentElement) {
        return button.parentElement;
      }
    }

    // 4. Find header right side area
    const headers = document.querySelectorAll('header, [role="banner"], .sticky, .fixed');
    for (const header of headers) {
      const rightSide = header.querySelector('.absolute.end-0, .absolute.right-0, .ml-auto, .flex:last-child');
      if (rightSide) {
        return rightSide;
      }
    }

    // 5. Find button groups in header
    const buttonContainers = document.querySelectorAll('header .flex, [role="banner"] .flex, .sticky .flex, .fixed .flex');
    for (const container of buttonContainers) {
      if (container.querySelectorAll('button, a').length > 0) {
        return container;
      }
    }

    return null;
  }

  private findMobileContainer(): Element | null {
    // 1. Find mobile header
    const mobileHeader = document.querySelector('.md\\:hidden, [class*="md:hidden"]');
    if (mobileHeader) {
      const rect = mobileHeader.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const rightContainer = mobileHeader.querySelector('.no-draggable.absolute.end-0');
        if (rightContainer) {
          return rightContainer.querySelector('span.flex') || rightContainer;
        }
      }
    }

    // 2. Find new chat button
    const newChatButton = document.querySelector('a[aria-label*="New chat"], a[aria-label*="新しいチャット"], a[aria-label*="새로운 채팅"]');
    if (newChatButton?.parentElement) {
      return newChatButton.parentElement;
    }

    // 3. Find right top area
    const rightContainers = document.querySelectorAll('[class*="absolute"][class*="end-0"], [class*="absolute"][class*="right-0"]');
    for (const container of rightContainers) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return container;
      }
    }

    // 4. Last resort
    const rightElements = document.querySelectorAll('[class*="absolute"][class*="end-0"], [class*="absolute"][class*="right-0"], [class*="flex"][class*="justify-end"]');
    for (const element of rightElements) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.top < 100) {
        return element;
      }
    }

    return null;
  }

  private createButtonElement(isDesktop: boolean): HTMLButtonElement {
    const button = document.createElement('button');
    button.id = 'pdf-export-btn';
    
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'flex w-full items-center justify-center gap-1.5';
    
    const svg = this.createPDFIcon();
    buttonDiv.appendChild(svg);
    
    if (isDesktop) {
      const buttonText = document.createElement('span');
      buttonText.textContent = this.i18nManager.getMessage('exportButtonText');
      buttonText.className = 'pdf-button-text';
      buttonDiv.appendChild(buttonText);
    }
    
    button.appendChild(buttonDiv);
    return button;
  }

  private createPDFIcon(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z');
    
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '14,2 14,8 20,8');
    
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '16');
    line1.setAttribute('y1', '13');
    line1.setAttribute('x2', '8');
    line1.setAttribute('y2', '13');
    
    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '16');
    line2.setAttribute('y1', '17');
    line2.setAttribute('x2', '8');
    line2.setAttribute('y2', '17');
    
    svg.appendChild(path);
    svg.appendChild(polyline);
    svg.appendChild(line1);
    svg.appendChild(line2);
    
    return svg;
  }

  private applyButtonStyles(button: HTMLButtonElement, targetContainer: Element): void {
    const isMobileHeader = targetContainer.closest('.md\\:hidden') !== null;
    
    if (isMobileHeader) {
      this.applyMobileButtonStyles(button);
    } else {
      this.applyDesktopButtonStyles(button);
    }
    
    this.addResponsiveStyles();
  }

  private applyMobileButtonStyles(button: HTMLButtonElement): void {
    button.className = 'text-token-text-primary no-draggable hover:bg-token-surface-hover focus-visible:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus-visible:outline-0 disabled:opacity-50';
    
    button.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 36px !important;
      height: 36px !important;
      min-width: 36px !important;
      min-height: 36px !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      background: transparent !important;
      color: inherit !important;
      cursor: pointer !important;
      border-radius: 8px !important;
      flex-shrink: 0 !important;
      position: relative !important;
      z-index: 1 !important;
    `;
  }

  private applyDesktopButtonStyles(button: HTMLButtonElement): void {
    button.className = 'btn relative btn-neutral btn-small flex items-center justify-center whitespace-nowrap rounded-lg pdf-export-responsive-btn';
    
    button.style.cssText = `
      background: transparent !important;
      border: none !important;
      color: inherit !important;
      cursor: pointer !important;
      padding: 8px !important;
      transition: all 0.2s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 36px !important;
      height: 36px !important;
      gap: 6px !important;
    `;
  }

  private addResponsiveStyles(): void {
    if (document.getElementById('pdf-export-responsive-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'pdf-export-responsive-styles';
    style.textContent = `
      .pdf-export-responsive-btn {
        width: auto !important;
        min-width: 36px !important;
      }
      
      .pdf-export-responsive-btn .pdf-button-text {
        display: none;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }
      
      @media (min-width: 768px) {
        .pdf-export-responsive-btn .pdf-button-text {
          display: inline-block;
        }
        .pdf-export-responsive-btn {
          padding: 8px 12px !important;
          width: auto !important;
        }
      }
      
      @media (max-width: 767px) {
        .pdf-export-responsive-btn {
          width: 36px !important;
          height: 36px !important;
          padding: 8px !important;
        }
        .pdf-export-responsive-btn .pdf-button-text {
          display: none !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  private insertButtonIntoContainer(button: HTMLButtonElement, targetContainer: Element): void {
    const shareButton = targetContainer.querySelector('[data-testid="share-chat-button"]');
    
    if (shareButton) {
      targetContainer.insertBefore(button, shareButton);
    } else {
      const newChatButton = targetContainer.querySelector('a[aria-label*="New chat"], a[aria-label*="新しいチャット"], a[aria-label*="새로운 채팅"]');
      
      if (newChatButton) {
        targetContainer.insertBefore(button, newChatButton);
      } else {
        if (targetContainer.firstChild) {
          targetContainer.insertBefore(button, targetContainer.firstChild);
        } else {
          targetContainer.appendChild(button);
        }
      }
    }
  }

  private addButtonEventListeners(button: HTMLButtonElement): void {
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
    });
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showExportModal((window as any).__pdfExportCallback);
    });
  }

  private createFallbackButton(): HTMLButtonElement | null {
    try {
      const fallbackButton = document.createElement('button');
      fallbackButton.id = 'pdf-export-btn';
      fallbackButton.className = 'pdf-export-button-fallback';
      fallbackButton.textContent = this.i18nManager.getMessage('exportButtonText');
      fallbackButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showExportModal((window as any).__pdfExportCallback);
      });
      document.body.appendChild(fallbackButton);
      return fallbackButton;
    } catch (error) {
      console.error('Error creating fallback button:', error);
      return null;
    }
  }

  // Modal Management
  createModal(): ModalElements {
    const modal = document.createElement('div');
    modal.id = 'pdf-export-modal';
    modal.className = 'pdf-export-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Modal header
    const modalHeader = this.createModalHeader();
    
    // Modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    // Export type section
    const exportTypeSection = this.createExportTypeSection();
    
    // Options section
    const optionsSection = this.createOptionsSection();
    
    // Format section
    const formatSection = this.createFormatSection();
    
    // Modal footer
    const modalFooter = this.createModalFooter();
    
    // Assemble modal
    modalBody.appendChild(exportTypeSection.element);
    modalBody.appendChild(optionsSection.element);
    modalBody.appendChild(formatSection.element);
    
    modalContent.appendChild(modalHeader.element);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter.element);
    
    modal.appendChild(modalContent);
    
    // Setup event listeners
    this.setupModalEventListeners(modal, modalHeader, modalFooter, formatSection, optionsSection);
    
    return {
      modal,
      closeBtn: modalHeader.closeBtn,
      cancelBtn: modalFooter.cancelBtn,
      generateBtn: modalFooter.generateBtn,
      formatButtons: formatSection.buttons,
      exportTypeRadios: exportTypeSection.radios,
      optionCheckboxes: optionsSection.checkboxes,
      titleInput: optionsSection.titleInput,
      titleInputContainer: optionsSection.titleInputContainer
    };
  }

  private createModalHeader() {
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const h3 = document.createElement('h3');
    h3.textContent = this.i18nManager.getMessage('modalTitle');
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    
    modalHeader.appendChild(h3);
    modalHeader.appendChild(closeBtn);
    
    return { element: modalHeader, closeBtn };
  }

  private createExportTypeSection() {
    const exportTypeSection = document.createElement('div');
    exportTypeSection.className = 'export-type-section';
    
    const exportTypeTitle = document.createElement('h4');
    exportTypeTitle.textContent = this.i18nManager.getMessage('exportTypeLabel');
    exportTypeTitle.setAttribute('data-i18n', 'exportTypeLabel');
    
    const exportTypeOptions = document.createElement('div');
    exportTypeOptions.className = 'export-type-options';
    
    // All messages radio
    const label1 = document.createElement('label');
    const radio1 = document.createElement('input');
    radio1.type = 'radio';
    radio1.name = 'exportType';
    radio1.value = 'all';
    radio1.checked = true;
    
    const allText = document.createElement('span');
    allText.textContent = this.i18nManager.getMessage('exportTypeAll');
    allText.setAttribute('data-i18n', 'exportTypeAll');
    
    label1.appendChild(radio1);
    label1.appendChild(allText);
    
    // Selected messages radio
    const label2 = document.createElement('label');
    const radio2 = document.createElement('input');
    radio2.type = 'radio';
    radio2.name = 'exportType';
    radio2.value = 'selected';
    
    const selectedText = document.createElement('span');
    selectedText.textContent = `${this.i18nManager.getMessage('exportTypeSelected')} (${this.selectedMessages.size})`;
    selectedText.setAttribute('data-i18n', 'exportTypeSelected');
    selectedText.className = 'selected-messages-text';
    
    label2.appendChild(radio2);
    label2.appendChild(selectedText);
    
    exportTypeOptions.appendChild(label1);
    exportTypeOptions.appendChild(label2);
    exportTypeSection.appendChild(exportTypeTitle);
    exportTypeSection.appendChild(exportTypeOptions);
    
    return {
      element: exportTypeSection,
      radios: {
        all: radio1,
        selected: radio2
      }
    };
  }

  private createOptionsSection() {
    const optionsSection = document.createElement('div');
    optionsSection.className = 'options-section';
    
    const optionsTitle = document.createElement('h4');
    optionsTitle.textContent = this.i18nManager.getMessage('optionsLabel');
    optionsTitle.setAttribute('data-i18n', 'optionsLabel');
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';
    
    // Title option
    const titleLabel = document.createElement('label');
    const titleCheckbox = document.createElement('input');
    titleCheckbox.type = 'checkbox';
    titleCheckbox.id = 'customTitle';
    titleCheckbox.checked = true;
    
    const titleText = document.createElement('span');
    titleText.textContent = this.i18nManager.getMessage('includeTitle');
    titleText.setAttribute('data-i18n', 'includeTitle');
    
    titleLabel.appendChild(titleCheckbox);
    titleLabel.appendChild(titleText);
    
    const titleInputContainer = document.createElement('div');
    titleInputContainer.className = 'title-input-container';
    titleInputContainer.style.display = 'block';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'title-input';
    titleInput.placeholder = this.i18nManager.getMessage('titlePlaceholder');
    titleInput.value = this.i18nManager.getMessage('defaultChatTitle');
    
    titleInputContainer.appendChild(titleInput);
    
    // Title checkbox event listener
    titleCheckbox.addEventListener('change', () => {
      titleInputContainer.style.display = titleCheckbox.checked ? 'block' : 'none';
    });
    
    // Other options
    const timestampLabel = this.createCheckboxOption('includeTimestamp', 'includeTimestamp', true);
    const userInfoLabel = this.createCheckboxOption('includeUserInfo', 'includeUserInfo', true);
    const cleanFormatLabel = this.createCheckboxOption('cleanFormat', 'cleanFormat', true);
    
    optionsContainer.appendChild(titleLabel);
    optionsContainer.appendChild(titleInputContainer);
    optionsContainer.appendChild(timestampLabel);
    optionsContainer.appendChild(userInfoLabel);
    optionsContainer.appendChild(cleanFormatLabel);
    
    optionsSection.appendChild(optionsTitle);
    optionsSection.appendChild(optionsContainer);
    
    return {
      element: optionsSection,
      checkboxes: {
        includeTitle: titleCheckbox,
        includeTimestamp: timestampLabel.querySelector('input') as HTMLInputElement,
        includeUserInfo: userInfoLabel.querySelector('input') as HTMLInputElement,
        cleanFormat: cleanFormatLabel.querySelector('input') as HTMLInputElement
      },
      titleInput,
      titleInputContainer
    };
  }

  private createCheckboxOption(id: string, messageKey: keyof I18nMessages, checked: boolean): HTMLLabelElement {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.checked = checked;
    
    const text = document.createElement('span');
    text.textContent = this.i18nManager.getMessage(messageKey);
    text.setAttribute('data-i18n', messageKey);
    
    label.appendChild(checkbox);
    label.appendChild(text);
    
    return label;
  }

  private createFormatSection() {
    const formatSection = document.createElement('div');
    formatSection.className = 'format-section';
    
    const formatTitle = document.createElement('h4');
    formatTitle.textContent = this.i18nManager.getMessage('exportFormatLabel');
    formatTitle.setAttribute('data-i18n', 'exportFormatLabel');
    
    const formatButtons = document.createElement('div');
    formatButtons.className = 'format-buttons';
    
    const printBtn = document.createElement('button');
    printBtn.className = 'format-btn print-btn active';
    printBtn.textContent = this.i18nManager.getMessage('exportPDF');
    printBtn.setAttribute('data-format', 'pdf');
    
    const htmlBtn = document.createElement('button');
    htmlBtn.className = 'format-btn html-btn';
    htmlBtn.textContent = this.i18nManager.getMessage('exportHTML');
    htmlBtn.setAttribute('data-format', 'html');
    
    const textBtn = document.createElement('button');
    textBtn.className = 'format-btn text-btn';
    textBtn.textContent = this.i18nManager.getMessage('exportText');
    textBtn.setAttribute('data-format', 'text');
    
    formatButtons.appendChild(printBtn);
    formatButtons.appendChild(htmlBtn);
    formatButtons.appendChild(textBtn);
    formatSection.appendChild(formatTitle);
    formatSection.appendChild(formatButtons);
    
    return {
      element: formatSection,
      buttons: {
        pdf: printBtn,
        html: htmlBtn,
        text: textBtn
      }
    };
  }

  private createModalFooter() {
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-btn';
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = this.i18nManager.getMessage('cancel');
    cancelBtn.setAttribute('data-i18n', 'cancel');
    
    const generateBtn = document.createElement('button');
    generateBtn.id = 'generate-btn';
    generateBtn.className = 'generate-btn';
    generateBtn.textContent = this.i18nManager.getMessage('generateButton');
    generateBtn.setAttribute('data-i18n', 'generateButton');
    
    modalFooter.appendChild(cancelBtn);
    modalFooter.appendChild(generateBtn);
    
    return {
      element: modalFooter,
      cancelBtn,
      generateBtn
    };
  }

  private setupModalEventListeners(
    modal: HTMLDivElement,
    modalHeader: { closeBtn: HTMLElement },
    modalFooter: { cancelBtn: HTMLButtonElement, generateBtn: HTMLButtonElement },
    formatSection: { buttons: { pdf: HTMLButtonElement, html: HTMLButtonElement, text: HTMLButtonElement } },
    optionsSection: { checkboxes: any, titleInput: HTMLInputElement }
  ): void {
    let selectedFormat: 'pdf' | 'html' | 'text' = 'pdf';
    
    // Close modal handlers
    modalHeader.closeBtn.onclick = () => this.closeModal();
    modalFooter.cancelBtn.onclick = () => this.closeModal();
    
    // Format button selection
    const formatBtns = [formatSection.buttons.pdf, formatSection.buttons.html, formatSection.buttons.text];
    formatBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        formatBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedFormat = btn.getAttribute('data-format') as 'pdf' | 'html' | 'text';
      });
    });
    
    // Generate button handler
    modalFooter.generateBtn.onclick = () => {
      const options = this.getExportOptions(modal);
      options.selectedFormat = selectedFormat;
      
      if (this.exportModalCallback) {
        this.exportModalCallback(options);
      }
      
      this.closeModal();
    };
    
    // Click outside to close
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    };
  }

  showExportModal(callback?: ExportModalCallback): void {
    // Update message selection UI first
    this.addMessageSelectionFeature();
    
    // Set callback if provided
    if (callback) {
      this.exportModalCallback = callback;
    }
    
    const modalElements = this.createModal();
    this.currentModal = modalElements.modal;
    document.body.appendChild(modalElements.modal);
    
    // Update selected message count
    this.updateSelectedMessageCount();
  }

  private closeModal(): void {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
      this.exportModalCallback = null;
    }
  }

  private getExportOptions(modal: HTMLElement): ExportOptions {
    const exportType = (modal.querySelector('input[name="exportType"]:checked') as HTMLInputElement)?.value as 'all' | 'selected';
    const includeTitle = (modal.querySelector('#customTitle') as HTMLInputElement)?.checked || false;
    const customTitle = (modal.querySelector('.title-input') as HTMLInputElement)?.value || '';
    const includeTimestamp = (modal.querySelector('#includeTimestamp') as HTMLInputElement)?.checked || false;
    const includeUserInfo = (modal.querySelector('#includeUserInfo') as HTMLInputElement)?.checked || false;
    const cleanFormat = (modal.querySelector('#cleanFormat') as HTMLInputElement)?.checked || false;
    
    return {
      exportType,
      includeTitle,
      customTitle,
      includeTimestamp,
      includeUserInfo,
      cleanFormat,
      selectedFormat: 'pdf' // Will be overwritten by the event handler
    };
  }

  // Notification Management
  showNotification(message: string, options: NotificationOptions = {}): void {
    const { duration = 4000, type = 'info' } = options;
    
    const notification = document.createElement('div');
    notification.className = `pdf-notification pdf-notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }

  // Message Selection Feature
  addMessageSelectionFeature(): void {
    // Find message elements with various selectors
    let messageElements = this.findMessageElements();
    
    messageElements.forEach((element, index) => {
      // Remove existing checkbox if present
      const existingCheckbox = element.querySelector('.message-selector');
      if (existingCheckbox) {
        existingCheckbox.remove();
      }
      
      // Check if element has valid content
      const textContent = element.textContent?.trim();
      if (!textContent || textContent.length === 0) {
        return;
      }
      
      // Create checkbox
      const checkbox = this.createMessageCheckbox(index, element);
      
      // Set relative position for parent
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.position === 'static') {
        (element as HTMLElement).style.position = 'relative';
      }
      
      element.appendChild(checkbox);
    });
  }

  private findMessageElements(): NodeListOf<Element> {
    // Try various selectors to find message elements
    const selectors = [
      '[data-message-author-role]',
      '[data-message-id]',
      '.group\\/conversation-turn',
      '.flex.w-full.flex-col.gap-1.empty\\:hidden'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return elements;
      }
    }
    
    return document.querySelectorAll('.message'); // Fallback
  }

  private createMessageCheckbox(index: number, element: Element): HTMLDivElement {
    const checkbox = document.createElement('div');
    checkbox.className = 'message-selector';
    checkbox.setAttribute('data-message-index', index.toString());
    
    // Check if message is selected
    if (this.selectedMessages.has(index)) {
      checkbox.textContent = '✓';
      checkbox.style.backgroundColor = '#10a37f';
      checkbox.style.color = 'white';
      element.classList.add('selected-message');
    }
    
    // Click event
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMessageSelection(index, element, checkbox);
    });
    
    return checkbox;
  }

  toggleMessageSelection(index: number, element: Element, checkbox: HTMLElement): void {
    if (this.selectedMessages.has(index)) {
      this.selectedMessages.delete(index);
      checkbox.textContent = '';
      checkbox.style.backgroundColor = 'white';
      checkbox.style.color = '#10a37f';
      element.classList.remove('selected-message');
    } else {
      this.selectedMessages.add(index);
      checkbox.textContent = '✓';
      checkbox.style.backgroundColor = '#10a37f';
      checkbox.style.color = 'white';
      element.classList.add('selected-message');
    }
    
    // Update selected count in modal if open
    this.updateSelectedMessageCount();
    
    // Trigger callback if set
    if (this.messageSelectionCallback) {
      this.messageSelectionCallback(new Set(this.selectedMessages));
    }
  }

  private updateSelectedMessageCount(): void {
    const selectedText = document.querySelector('.selected-messages-text');
    if (selectedText) {
      const baseText = this.i18nManager.getMessage('exportTypeSelected');
      selectedText.textContent = `${baseText} (${this.selectedMessages.size})`;
    }
  }

  // Getters
  getSelectedMessageCount(): number {
    return this.selectedMessages.size;
  }

  getSelectedMessages(): Set<number> {
    return new Set(this.selectedMessages);
  }

  setMessageSelectionCallback(callback: MessageSelectionCallback): void {
    this.messageSelectionCallback = callback;
  }

  // Error Modal
  createErrorModal(): HTMLDivElement {
    // Remove existing error modal if present
    const existingModal = document.querySelector('.pdf-error-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'pdf-export-modal pdf-error-modal';
    modal.id = 'pdf-export-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const title = document.createElement('h2');
    title.textContent = this.i18nManager.getMessage('errorModalTitle');
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => modal.remove();
    
    modalHeader.appendChild(title);
    modalHeader.appendChild(closeBtn);
    
    // Modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    // Error section
    const errorSection = this.createErrorSection();
    
    // Solutions section
    const solutionsSection = this.createSolutionsSection(modal);
    
    // Modal footer
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    modalFooter.style.justifyContent = 'center';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'cancel-btn';
    closeButton.textContent = this.i18nManager.getMessage('closeButton');
    closeButton.onclick = () => modal.remove();
    
    modalFooter.appendChild(closeButton);
    
    // Assemble modal
    modalBody.appendChild(errorSection);
    modalBody.appendChild(solutionsSection);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    
    modal.appendChild(modalContent);
    
    // Add error modal styles
    this.addErrorModalStyles();
    
    // Add to DOM
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    return modal;
  }

  private createErrorSection(): HTMLDivElement {
    const errorSection = document.createElement('div');
    errorSection.className = 'error-section';
    
    const errorIcon = document.createElement('div');
    errorIcon.className = 'error-icon';
    errorIcon.textContent = '📄';
    errorIcon.style.fontSize = '48px';
    errorIcon.style.textAlign = 'center';
    errorIcon.style.marginBottom = '20px';
    
    const errorTitle = document.createElement('h3');
    errorTitle.textContent = this.i18nManager.getMessage('errorContentTooLarge');
    errorTitle.style.textAlign = 'center';
    errorTitle.style.marginBottom = '10px';
    
    const errorDesc = document.createElement('p');
    errorDesc.textContent = this.i18nManager.getMessage('errorContentTooLargeDesc');
    errorDesc.style.textAlign = 'center';
    errorDesc.style.color = '#666';
    errorDesc.style.marginBottom = '30px';
    
    errorSection.appendChild(errorIcon);
    errorSection.appendChild(errorTitle);
    errorSection.appendChild(errorDesc);
    
    return errorSection;
  }

  private createSolutionsSection(modal: HTMLDivElement): HTMLDivElement {
    const solutionsSection = document.createElement('div');
    solutionsSection.className = 'solutions-section';
    
    const solutionsTitle = document.createElement('h4');
    solutionsTitle.textContent = this.i18nManager.getMessage('solutionsTitle');
    solutionsTitle.style.marginBottom = '15px';
    solutionsTitle.style.color = '#202123';
    
    // Format section
    const formatSection = document.createElement('div');
    formatSection.className = 'format-section';
    formatSection.style.marginTop = '20px';
    
    const formatTitle = document.createElement('div');
    formatTitle.className = 'section-title';
    formatTitle.textContent = this.i18nManager.getMessage('exportFormatLabel');
    formatTitle.style.marginBottom = '10px';
    formatTitle.style.color = '#666';
    formatTitle.style.fontSize = '14px';
    
    const formatButtons = document.createElement('div');
    formatButtons.className = 'format-buttons';
    formatButtons.style.display = 'flex';
    formatButtons.style.gap = '10px';
    
    // Select messages info
    const selectMsgInfo = document.createElement('div');
    selectMsgInfo.style.cssText = `
      background: #f0f0f0;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
      color: #202123;
    `;
    selectMsgInfo.innerHTML = `
      <div style="display: flex; align-items: start; gap: 10px;">
        <span style="font-size: 20px;">💡</span>
        <div>
          <div style="font-weight: bold; margin-bottom: 5px;">${this.i18nManager.getMessage('solutionSelectMessages')}</div>
          <div style="font-size: 13px; line-height: 1.5;">${this.i18nManager.getMessage('solutionSelectMessagesDesc')}</div>
        </div>
      </div>
    `;
    
    // HTML export button
    const htmlExportBtn = document.createElement('button');
    htmlExportBtn.className = 'format-btn html-btn';
    htmlExportBtn.textContent = this.i18nManager.getMessage('exportHTML');
    htmlExportBtn.onclick = () => {
      modal.remove();
      this.triggerExportWithFormat('html');
    };
    
    // Text export button
    const textExportBtn = document.createElement('button');
    textExportBtn.className = 'format-btn text-btn';
    textExportBtn.textContent = this.i18nManager.getMessage('exportText');
    textExportBtn.onclick = () => {
      modal.remove();
      this.triggerExportWithFormat('text');
    };
    
    formatButtons.appendChild(htmlExportBtn);
    formatButtons.appendChild(textExportBtn);
    
    formatSection.appendChild(formatTitle);
    formatSection.appendChild(formatButtons);
    
    solutionsSection.appendChild(solutionsTitle);
    solutionsSection.appendChild(selectMsgInfo);
    solutionsSection.appendChild(formatSection);
    
    return solutionsSection;
  }

  private triggerExportWithFormat(format: 'html' | 'text'): void {
    const exportBtn = document.querySelector('#pdf-export-btn') as HTMLButtonElement;
    if (exportBtn) {
      exportBtn.click();
      // Wait for modal to be created and select format
      setTimeout(() => {
        const formatBtn = document.querySelector(`.format-btn.${format}-btn`) as HTMLButtonElement;
        if (formatBtn) {
          formatBtn.click();
        }
      }, 100);
    }
  }

  private addErrorModalStyles(): void {
    if (document.getElementById('pdf-error-modal-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'pdf-error-modal-styles';
    style.textContent = `
      .pdf-error-modal {
        color: #202123 !important;
      }
      
      .pdf-error-modal .modal-content {
        background: white !important;
      }
      
      .pdf-error-modal h2, 
      .pdf-error-modal h3, 
      .pdf-error-modal h4,
      .pdf-error-modal p {
        color: #202123 !important;
      }
      
      .pdf-error-modal .error-section {
        margin-bottom: 30px;
      }
      
      .pdf-error-modal .solutions-section h4 {
        color: #202123 !important;
        font-size: 16px;
      }
    `;
    document.head.appendChild(style);
  }

  // Update UI for language changes
  updateUILanguage(): void {
    // Update export button text
    const exportBtn = document.getElementById('pdf-export-btn');
    if (exportBtn) {
      const textElement = exportBtn.querySelector('.pdf-button-text');
      if (textElement) {
        textElement.textContent = this.i18nManager.getMessage('exportButtonText');
      }
    }

    // Update modal if open
    if (this.currentModal) {
      this.updateModalLanguage(this.currentModal);
    }
  }

  private updateModalLanguage(modal: HTMLElement): void {
    // Update all elements with data-i18n attributes
    const i18nElements = modal.querySelectorAll('[data-i18n]');
    i18nElements.forEach(element => {
      const messageKey = element.getAttribute('data-i18n') as keyof I18nMessages;
      if (messageKey) {
        element.textContent = this.i18nManager.getMessage(messageKey);
      }
    });

    // Update selected message count
    this.updateSelectedMessageCount();

    // Update input placeholder
    const titleInput = modal.querySelector('.title-input') as HTMLInputElement;
    if (titleInput) {
      titleInput.placeholder = this.i18nManager.getMessage('titlePlaceholder');
    }
  }

  // Cleanup
  dispose(): void {
    this.removeExistingButton();
    this.closeModal();
    this.selectedMessages.clear();
    this.exportModalCallback = null;
    this.messageSelectionCallback = null;
  }
}