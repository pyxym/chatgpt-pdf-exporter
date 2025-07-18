class UIManager {
  constructor() {
    this.selectedMessages = new Set();
  }

  // PDF 저장 버튼 생성 (채팅창 상단 바에 통합)
  createExportButton() {
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
      return this.createFallbackButton();
    }
  }

  // 기존 버튼 제거
  removeExistingButton() {
    const existingButton = document.getElementById('pdf-export-btn');
    if (existingButton) {
      existingButton.remove();
    }
  }

  // 타겟 컨테이너 찾기
  findTargetContainer(isDesktop) {
    if (isDesktop) {
      return this.findDesktopContainer();
    } else {
      return this.findMobileContainer();
    }
  }

  // 데스크톱 컨테이너 찾기
  findDesktopContainer() {
    // 1. conversation-header-actions 찾기
    const headerActions = document.getElementById('conversation-header-actions');
    if (headerActions) {
      const pageHeader = document.getElementById('page-header');
      if (pageHeader && 
          window.getComputedStyle(pageHeader).display !== 'none' &&
          !pageHeader.classList.contains('max-md:hidden')) {
        return headerActions;
      }
    }

    // 2. 공유 버튼 직접 찾기
    const shareButton = document.querySelector('[data-testid="share-chat-button"]');
    if (shareButton) {
      return shareButton.parentElement;
    }

    // 3. aria-label로 공유 버튼 찾기
    const shareLabels = ['共有する', '공유', 'Share'];
    for (const label of shareLabels) {
      const button = document.querySelector(`button[aria-label*="${label}"]`);
      if (button) {
        return button.parentElement;
      }
    }

    // 4. 헤더 우측 영역 찾기
    const headers = document.querySelectorAll('header, [role="banner"], .sticky, .fixed');
    for (const header of headers) {
      const rightSide = header.querySelector('.absolute.end-0, .absolute.right-0, .ml-auto, .flex:last-child');
      if (rightSide) {
        return rightSide;
      }
    }

    // 5. 헤더 내 버튼 그룹 찾기
    const buttonContainers = document.querySelectorAll('header .flex, [role="banner"] .flex, .sticky .flex, .fixed .flex');
    for (const container of buttonContainers) {
      if (container.querySelectorAll('button, a').length > 0) {
        return container;
      }
    }

    return null;
  }

  // 모바일 컨테이너 찾기
  findMobileContainer() {
    // 1. 모바일 헤더 찾기
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

    // 2. 새로운 채팅 버튼 찾기
    const newChatButton = document.querySelector('a[aria-label*="New chat"], a[aria-label*="新しいチャット"], a[aria-label*="새로운 채팅"]');
    if (newChatButton) {
      return newChatButton.parentElement;
    }

    // 3. 우측 상단 영역 찾기
    const rightContainers = document.querySelectorAll('[class*="absolute"][class*="end-0"], [class*="absolute"][class*="right-0"]');
    for (const container of rightContainers) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return container;
      }
    }

    // 4. 최후 수단
    const rightElements = document.querySelectorAll('[class*="absolute"][class*="end-0"], [class*="absolute"][class*="right-0"], [class*="flex"][class*="justify-end"]');
    for (const element of rightElements) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.top < 100) {
        return element;
      }
    }

    return null;
  }

  // 버튼 엘리먼트 생성
  createButtonElement(isDesktop) {
    const button = document.createElement('button');
    button.id = 'pdf-export-btn';
    
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'flex w-full items-center justify-center gap-1.5';
    
    const svg = this.createPDFIcon();
    buttonDiv.appendChild(svg);
    
    if (isDesktop) {
      const buttonText = document.createElement('span');
      buttonText.textContent = chrome.i18n.getMessage('exportButtonText');
      buttonText.className = 'pdf-button-text';
      buttonDiv.appendChild(buttonText);
    }
    
    button.appendChild(buttonDiv);
    return button;
  }

  // PDF 아이콘 생성
  createPDFIcon() {
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

  // 버튼 스타일 적용
  applyButtonStyles(button, targetContainer) {
    const isMobileHeader = targetContainer.closest('.md\\:hidden') !== null;
    
    if (isMobileHeader) {
      this.applyMobileButtonStyles(button);
    } else {
      this.applyDesktopButtonStyles(button);
    }
    
    this.addResponsiveStyles();
  }

  // 모바일 버튼 스타일
  applyMobileButtonStyles(button) {
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

  // 데스크톱 버튼 스타일
  applyDesktopButtonStyles(button) {
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

  // 반응형 스타일 추가
  addResponsiveStyles() {
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

  // 버튼을 컨테이너에 삽입
  insertButtonIntoContainer(button, targetContainer) {
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

  // 버튼 이벤트 리스너 추가
  addButtonEventListeners(button) {
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
    });
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showExportModal();
    });
  }

  // 폴백 버튼 생성
  createFallbackButton() {
    try {
      const fallbackButton = document.createElement('button');
      fallbackButton.id = 'pdf-export-btn';
      fallbackButton.className = 'pdf-export-button-fallback';
      fallbackButton.textContent = chrome.i18n.getMessage('exportButtonText') || 'PDF 저장';
      fallbackButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showExportModal();
      });
      document.body.appendChild(fallbackButton);
      return fallbackButton;
    } catch (error) {
      return null;
    }
  }

  // 모달 생성
  createModal() {
    const modal = document.createElement('div');
    modal.id = 'pdf-export-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const h3 = document.createElement('h3');
    h3.textContent = chrome.i18n.getMessage('modalTitle');
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    
    modalHeader.appendChild(h3);
    modalHeader.appendChild(closeBtn);
    
    // Modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    // 1. Export Type (출력 타입 설정)
    const exportTypeSection = document.createElement('div');
    exportTypeSection.className = 'export-type-section';
    
    const exportTypeTitle = document.createElement('h4');
    exportTypeTitle.textContent = chrome.i18n.getMessage('exportTypeLabel');
    
    const exportTypeOptions = document.createElement('div');
    exportTypeOptions.className = 'export-type-options';
    
    const label1 = document.createElement('label');
    const radio1 = document.createElement('input');
    radio1.type = 'radio';
    radio1.name = 'exportType';
    radio1.value = 'all';
    radio1.checked = true;
    label1.appendChild(radio1);
    label1.appendChild(document.createTextNode(chrome.i18n.getMessage('exportTypeAll')));
    
    const label2 = document.createElement('label');
    const radio2 = document.createElement('input');
    radio2.type = 'radio';
    radio2.name = 'exportType';
    radio2.value = 'selected';
    label2.appendChild(radio2);
    label2.appendChild(document.createTextNode(`${chrome.i18n.getMessage('exportTypeSelected')} (${this.selectedMessages.size})`));
    
    exportTypeOptions.appendChild(label1);
    exportTypeOptions.appendChild(label2);
    exportTypeSection.appendChild(exportTypeTitle);
    exportTypeSection.appendChild(exportTypeOptions);
    
    // 2. Options (옵션)
    const optionsSection = document.createElement('div');
    optionsSection.className = 'options-section';
    
    const optionsTitle = document.createElement('h4');
    optionsTitle.textContent = chrome.i18n.getMessage('optionsLabel');
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';
    
    // Custom Title option
    const titleLabel = document.createElement('label');
    const titleCheckbox = document.createElement('input');
    titleCheckbox.type = 'checkbox';
    titleCheckbox.id = 'customTitle';
    titleCheckbox.checked = true;
    titleLabel.appendChild(titleCheckbox);
    titleLabel.appendChild(document.createTextNode(chrome.i18n.getMessage('includeTitle')));
    
    const titleInputContainer = document.createElement('div');
    titleInputContainer.className = 'title-input-container';
    titleInputContainer.style.display = 'block';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'title-input';
    titleInput.placeholder = chrome.i18n.getMessage('titlePlaceholder');
    titleInput.value = chrome.i18n.getMessage('defaultChatTitle') || 'ChatGPT Chat History';
    
    titleInputContainer.appendChild(titleInput);
    
    // Title checkbox event listener
    titleCheckbox.addEventListener('change', () => {
      titleInputContainer.style.display = titleCheckbox.checked ? 'block' : 'none';
    });
    
    // Other options
    const label3 = document.createElement('label');
    const checkbox1 = document.createElement('input');
    checkbox1.type = 'checkbox';
    checkbox1.id = 'includeTimestamp';
    checkbox1.checked = true;
    label3.appendChild(checkbox1);
    label3.appendChild(document.createTextNode(chrome.i18n.getMessage('includeTimestamp')));
    
    const label4 = document.createElement('label');
    const checkbox2 = document.createElement('input');
    checkbox2.type = 'checkbox';
    checkbox2.id = 'includeUserInfo';
    checkbox2.checked = true;
    label4.appendChild(checkbox2);
    label4.appendChild(document.createTextNode(chrome.i18n.getMessage('includeUserInfo')));
    
    const label5 = document.createElement('label');
    const checkbox3 = document.createElement('input');
    checkbox3.type = 'checkbox';
    checkbox3.id = 'cleanFormat';
    checkbox3.checked = true;
    label5.appendChild(checkbox3);
    label5.appendChild(document.createTextNode(chrome.i18n.getMessage('cleanFormat')));
    
    optionsContainer.appendChild(titleLabel);
    optionsContainer.appendChild(titleInputContainer);
    optionsContainer.appendChild(label3);
    optionsContainer.appendChild(label4);
    optionsContainer.appendChild(label5);
    optionsSection.appendChild(optionsTitle);
    optionsSection.appendChild(optionsContainer);
    
    // 3. Export Format (출력 형식 선택)
    const formatSection = document.createElement('div');
    formatSection.className = 'format-section';
    
    const formatTitle = document.createElement('h4');
    formatTitle.textContent = chrome.i18n.getMessage('exportFormatLabel');
    
    const formatButtons = document.createElement('div');
    formatButtons.className = 'format-buttons';
    
    const printBtn = document.createElement('button');
    printBtn.className = 'format-btn print-btn';
    printBtn.textContent = chrome.i18n.getMessage('exportPDF');
    
    const htmlBtn = document.createElement('button');
    htmlBtn.className = 'format-btn html-btn';
    htmlBtn.textContent = chrome.i18n.getMessage('exportHTML');
    
    const textBtn = document.createElement('button');
    textBtn.className = 'format-btn text-btn';
    textBtn.textContent = chrome.i18n.getMessage('exportText');
    
    formatButtons.appendChild(printBtn);
    formatButtons.appendChild(htmlBtn);
    formatButtons.appendChild(textBtn);
    formatSection.appendChild(formatTitle);
    formatSection.appendChild(formatButtons);
    
    // Modal footer with Cancel and Generate buttons
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-btn';
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = chrome.i18n.getMessage('cancel');
    
    const generateBtn = document.createElement('button');
    generateBtn.id = 'generate-btn';
    generateBtn.className = 'generate-btn';
    generateBtn.textContent = chrome.i18n.getMessage('generateButton');
    
    modalFooter.appendChild(cancelBtn);
    modalFooter.appendChild(generateBtn);
    
    // Assemble modal in the correct order
    modalBody.appendChild(exportTypeSection);
    modalBody.appendChild(optionsSection);
    modalBody.appendChild(formatSection);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    
    modal.appendChild(modalContent);
    
    // Store selected format
    let selectedFormat = 'pdf';
    
    // Format button selection logic
    const formatBtns = [printBtn, htmlBtn, textBtn];
    formatBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        formatBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Update selected format
        if (btn === printBtn) selectedFormat = 'pdf';
        else if (btn === htmlBtn) selectedFormat = 'html';
        else if (btn === textBtn) selectedFormat = 'text';
        
        // Keep generate button text as "Generate" regardless of format
        generateBtn.textContent = chrome.i18n.getMessage('generateButton');
      });
    });
    
    // Set default active format (PDF)
    printBtn.classList.add('active');
    
    // Event listeners
    closeBtn.onclick = () => modal.remove();
    cancelBtn.onclick = () => modal.remove();
    
    // Generate button logic
    generateBtn.onclick = () => {
      if (selectedFormat === 'pdf') {
        const pdfExporter = window.pdfExporter;
        const options = pdfExporter.getExportOptions(modal);
        const content = pdfExporter.extractContent(options);
        
        if (!content.messages.length) {
          pdfExporter.uiManager.showNotification('❌ 저장할 메시지가 없습니다.');
          return;
        }
        
        modal.remove();
        pdfExporter.uiManager.showNotification('📄 PDF 생성 중...');
        pdfExporter.generateDirectPDF(content, options);
      } else if (selectedFormat === 'html') {
        window.pdfExporter.exportToHTML(modal);
      } else if (selectedFormat === 'text') {
        window.pdfExporter.exportToText(modal);
      }
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
    
    return modal;
  }

  // 모달 표시
  showExportModal() {
    // 메시지 선택 기능 먼저 업데이트
    this.addMessageSelectionFeature();
    
    const modal = this.createModal();
    document.body.appendChild(modal);
  }

  // 알림 메시지 표시
  showNotification(message, duration = 4000) {
    const notification = document.createElement('div');
    notification.className = 'pdf-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }

  // 메시지 선택 기능 추가
  addMessageSelectionFeature() {
    // 다양한 방식으로 메시지 요소 찾기
    let messageElements = document.querySelectorAll('[data-message-author-role]');
    
    // 대안 선택자들 시도
    if (messageElements.length === 0) {
      messageElements = document.querySelectorAll('[data-message-id]');
    }
    
    if (messageElements.length === 0) {
      messageElements = document.querySelectorAll('.group\\/conversation-turn');
    }
    
    if (messageElements.length === 0) {
      messageElements = document.querySelectorAll('.flex.w-full.flex-col.gap-1.empty\\:hidden');
    }
    
    messageElements.forEach((element, index) => {
      // 이미 체크박스가 있는 경우 제거
      const existingCheckbox = element.querySelector('.message-selector');
      if (existingCheckbox) {
        existingCheckbox.remove();
      }
      
      // 유효한 콘텐츠가 있는지 확인
      const textContent = element.textContent.trim();
      if (textContent.length === 0) {
        return;
      }
      
      // 체크박스 생성
      const checkbox = document.createElement('div');
      checkbox.className = 'message-selector';
      checkbox.setAttribute('data-message-index', index);
      
      // 선택 상태 확인
      if (this.selectedMessages.has(index)) {
        checkbox.textContent = '✓';
        checkbox.style.backgroundColor = '#10a37f';
        checkbox.style.color = 'white';
        element.classList.add('selected-message');
      }
      
      // 클릭 이벤트
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMessageSelection(index, element, checkbox);
      });
      
      // 상대 위치 설정
      element.style.position = 'relative';
      element.appendChild(checkbox);
    });
  }

  // 메시지 선택 토글
  toggleMessageSelection(index, element, checkbox) {
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
  }

  // 선택된 메시지 개수 반환
  getSelectedMessageCount() {
    return this.selectedMessages.size;
  }

  // 선택된 메시지 Set 반환
  getSelectedMessages() {
    return this.selectedMessages;
  }

  // PDF 생성 실패 시 에러 모달 생성
  createErrorModal() {
    // 기존 모달이 있으면 제거
    const existingModal = document.querySelector('.pdf-error-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Modal container
    const modal = document.createElement('div');
    modal.className = 'pdf-export-modal pdf-error-modal';
    modal.id = 'pdf-export-modal'; // CSS 스타일 적용을 위해 ID 추가
    
    // Modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const title = document.createElement('h2');
    title.textContent = chrome.i18n.getMessage('errorModalTitle');
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => modal.remove();
    
    modalHeader.appendChild(title);
    modalHeader.appendChild(closeBtn);
    
    // Modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    // Error message section
    const errorSection = document.createElement('div');
    errorSection.className = 'error-section';
    
    const errorIcon = document.createElement('div');
    errorIcon.className = 'error-icon';
    errorIcon.textContent = '📄';
    errorIcon.style.fontSize = '48px';
    errorIcon.style.textAlign = 'center';
    errorIcon.style.marginBottom = '20px';
    
    const errorTitle = document.createElement('h3');
    errorTitle.textContent = chrome.i18n.getMessage('errorContentTooLarge');
    errorTitle.style.textAlign = 'center';
    errorTitle.style.marginBottom = '10px';
    
    const errorDesc = document.createElement('p');
    errorDesc.textContent = chrome.i18n.getMessage('errorContentTooLargeDesc');
    errorDesc.style.textAlign = 'center';
    errorDesc.style.color = '#666';
    errorDesc.style.marginBottom = '30px';
    
    errorSection.appendChild(errorIcon);
    errorSection.appendChild(errorTitle);
    errorSection.appendChild(errorDesc);
    
    // Solutions section
    const solutionsSection = document.createElement('div');
    solutionsSection.className = 'solutions-section';
    
    const solutionsTitle = document.createElement('h4');
    solutionsTitle.textContent = chrome.i18n.getMessage('solutionsTitle');
    solutionsTitle.style.marginBottom = '15px';
    solutionsTitle.style.color = '#202123';
    
    // Format buttons section (like export modal)
    const formatSection = document.createElement('div');
    formatSection.className = 'format-section';
    formatSection.style.marginTop = '20px';
    
    const formatTitle = document.createElement('div');
    formatTitle.className = 'section-title';
    formatTitle.textContent = chrome.i18n.getMessage('exportFormatLabel') || '내보내기 형식:';
    formatTitle.style.marginBottom = '10px';
    formatTitle.style.color = '#666';
    formatTitle.style.fontSize = '14px';
    
    const formatButtons = document.createElement('div');
    formatButtons.className = 'format-buttons';
    formatButtons.style.display = 'flex';
    formatButtons.style.gap = '10px';
    
    // Solution 1: Select messages (as info text, not button)
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
          <div style="font-weight: bold; margin-bottom: 5px;">${chrome.i18n.getMessage('solutionSelectMessages')}</div>
          <div style="font-size: 13px; line-height: 1.5;">${chrome.i18n.getMessage('solutionSelectMessagesDesc')}</div>
        </div>
      </div>
    `;
    
    // Solution 2: HTML export
    const htmlExportBtn = document.createElement('button');
    htmlExportBtn.className = 'format-btn html-btn';
    htmlExportBtn.textContent = chrome.i18n.getMessage('exportHTML') || 'HTML';
    htmlExportBtn.onclick = () => {
      modal.remove();
      // Trigger the PDF export button click to open export modal
      const exportBtn = document.querySelector('#pdf-export-btn');
      if (exportBtn) {
        exportBtn.click();
        // Wait for modal to be created and select HTML format
        setTimeout(() => {
          const htmlBtn = document.querySelector('.format-btn.html-btn');
          if (htmlBtn) {
            htmlBtn.click();
          }
        }, 100);
      }
    };
    
    // Solution 3: Text export
    const textExportBtn = document.createElement('button');
    textExportBtn.className = 'format-btn text-btn';
    textExportBtn.textContent = chrome.i18n.getMessage('exportText') || '텍스트';
    textExportBtn.onclick = () => {
      modal.remove();
      // Trigger the PDF export button click to open export modal
      const exportBtn = document.querySelector('#pdf-export-btn');
      if (exportBtn) {
        exportBtn.click();
        // Wait for modal to be created and select Text format
        setTimeout(() => {
          const textBtn = document.querySelector('.format-btn.text-btn');
          if (textBtn) {
            textBtn.click();
          }
        }, 100);
      }
    };
    
    formatButtons.appendChild(htmlExportBtn);
    formatButtons.appendChild(textExportBtn);
    
    formatSection.appendChild(formatTitle);
    formatSection.appendChild(formatButtons);
    
    solutionsSection.appendChild(solutionsTitle);
    solutionsSection.appendChild(selectMsgInfo);
    solutionsSection.appendChild(formatSection);
    
    // Modal footer
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    modalFooter.style.justifyContent = 'center';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'cancel-btn';
    closeButton.textContent = chrome.i18n.getMessage('closeButton');
    closeButton.onclick = () => modal.remove();
    
    modalFooter.appendChild(closeButton);
    
    // Assemble modal
    modalBody.appendChild(errorSection);
    modalBody.appendChild(solutionsSection);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    
    modal.appendChild(modalContent);
    
    // Add styles for solution buttons
    const style = document.createElement('style');
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
}

// 전역 인스턴스 생성
window.uiManager = new UIManager();