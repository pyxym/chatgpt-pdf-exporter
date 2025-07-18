// PDF 생성 관련 기능들을 관리하는 모듈

class PDFGenerator {
  constructor() {
    // UI 매니저 참조 지연 초기화
    this.uiManager = null;
    
    // 다국어 메시지
    this.messages = {
      ko: {
        generating: 'PDF 생성 중...',
        completed: '✅ PDF 다운로드 완료',
        failed: '❌ PDF 생성 실패.',
        renderFailed: '❌ 렌더링 실패.',
        noMessages: '❌ 출력할 메시지가 없습니다.',
        htmlGenerating: '🌐 HTML 생성 중...',
        textGenerating: '📝 텍스트 생성 중...',
        htmlCompleted: '✅ HTML 다운로드 완료',
        textCompleted: '✅ 텍스트 다운로드 완료'
      },
      ja: {
        generating: 'PDF生成中...',
        completed: '✅ PDFダウンロード完了',
        failed: '❌ PDF生成失敗。',
        renderFailed: '❌ レンダリング失敗。',
        noMessages: '❌ 出力するメッセージがありません。',
        htmlGenerating: '🌐 HTML生成中...',
        textGenerating: '📝 テキスト生成中...',
        htmlCompleted: '✅ HTMLダウンロード完了',
        textCompleted: '✅ テキストダウンロード完了'
      },
      en: {
        generating: 'Generating PDF...',
        completed: '✅ PDF Download Complete',
        failed: '❌ PDF generation failed.',
        renderFailed: '❌ Rendering failed.',
        noMessages: '❌ No messages to export.',
        htmlGenerating: '🌐 Generating HTML file...',
        textGenerating: '📝 Generating text file...',
        htmlCompleted: '✅ HTML Download Complete',
        textCompleted: '✅ Text Download Complete'
      }
    };
    
    // 브라우저 언어 감지
    this.language = this.detectLanguage();
  }
  
  // 브라우저 언어 감지
  detectLanguage() {
    // ChatGPT 언어 설정 우선 사용
    if (window.languageDetector) {
      const chatGPTLang = window.languageDetector.getDetectedLanguage();
      if (chatGPTLang && ['ko', 'en', 'ja'].includes(chatGPTLang)) {
        return chatGPTLang;
      }
    }
    
    // 폴백: 브라우저 언어
    const lang = navigator.language || navigator.userLanguage || 'en';
    if (lang.startsWith('ko')) return 'ko';
    if (lang.startsWith('ja')) return 'ja';
    return 'en';
  }
  
  // 다국어 메시지 가져오기
  getMessage(key) {
    return this.messages[this.language][key] || this.messages.en[key];
  }

  // UI 매니저 참조 가져오기
  getUIManager() {
    if (!this.uiManager) {
      this.uiManager = window.uiManager;
    }
    return this.uiManager;
  }

  // 내보내기 옵션 추출
  getExportOptions(modal) {
    const exportType = modal.querySelector('input[name="exportType"]:checked').value;
    const includeTimestamp = modal.querySelector('#includeTimestamp').checked;
    const includeUserInfo = modal.querySelector('#includeUserInfo').checked;
    const cleanFormat = modal.querySelector('#cleanFormat').checked;
    const customTitle = modal.querySelector('#customTitle').checked;
    const titleInput = modal.querySelector('.title-input').value;
    
    return {
      exportType,
      includeTimestamp,
      includeUserInfo,
      cleanFormat,
      customTitle,
      title: customTitle ? titleInput : (chrome.i18n.getMessage('defaultChatTitle') || 'ChatGPT Chat History')
    };
  }

  // 콘텐츠 추출
  extractContent(options) {
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
    
    const messages = [];
    const uiManager = this.getUIManager();
    
    messageElements.forEach((element, index) => {
      // 선택된 메시지만 필터링
      if (options.exportType === 'selected' && uiManager && !uiManager.getSelectedMessages().has(index)) {
        return;
      }
      
      const role = element.getAttribute('data-message-author-role') || this.detectMessageRole(element);
      
      // 메시지 콘텐츠 찾기
      let messageDiv = element.querySelector('[data-message-id]');
      if (!messageDiv) {
        messageDiv = element.querySelector('.markdown') || 
                     element.querySelector('.whitespace-pre-wrap') ||
                     element.querySelector('.prose') ||
                     element;
      }
      
      if (messageDiv && this.hasValidContent(messageDiv)) {
        const messageData = {
          role: role,
          content: this.processMessageContent(messageDiv),
          timestamp: null // 개별 메시지 타임스탬프 제거
        };
        
        messages.push(messageData);
      }
    });
    
    return {
      messages,
      title: options.title,
      timestamp: new Date().toLocaleString(navigator.language || 'en-US')
    };
  }

  // 메시지 역할 감지
  detectMessageRole(element) {
    // 사용자 메시지 감지
    if (element.querySelector('[data-message-author-role="user"]') || 
        element.querySelector('.bg-\\[\\#f4f4f4\\]') ||
        element.textContent.includes('You')) {
      return 'user';
    }
    
    // 어시스턴트 메시지 감지
    if (element.querySelector('[data-message-author-role="assistant"]') ||
        element.querySelector('.gizmo-bot-avatar') ||
        element.querySelector('.text-token-text-primary')) {
      return 'assistant';
    }
    
    // 기본값
    return 'assistant';
  }

  // 유효한 콘텐츠가 있는지 확인
  hasValidContent(element) {
    const textContent = element.textContent.trim();
    return textContent.length > 0 && textContent !== '';
  }

  // 메시지 콘텐츠 처리
  processMessageContent(messageDiv) {
    const clone = messageDiv.cloneNode(true);
    
    // 불필요한 요소 제거
    const elementsToRemove = [
      '.message-selector',
      'button',
      '.sr-only',
      '[aria-hidden="true"]',
      '.invisible',
      '.opacity-0'
    ];
    
    elementsToRemove.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // 코드 블록 처리
    clone.querySelectorAll('pre').forEach(pre => {
      pre.style.backgroundColor = '#f6f8fa';
      pre.style.padding = '12px';
      pre.style.borderRadius = '6px';
      pre.style.border = '1px solid #d1d5db';
      pre.style.overflow = 'auto';
    });
    
    // 테이블 처리
    clone.querySelectorAll('table').forEach(table => {
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.marginBottom = '16px';
    });
    
    clone.querySelectorAll('th, td').forEach(cell => {
      cell.style.border = '1px solid #d1d5db';
      cell.style.padding = '8px 12px';
      cell.style.textAlign = 'left';
    });
    
    clone.querySelectorAll('th').forEach(th => {
      th.style.backgroundColor = '#f6f8fa';
      th.style.fontWeight = 'bold';
    });
    
    // 리스트 처리
    clone.querySelectorAll('ul, ol').forEach(list => {
      list.style.marginLeft = '0px';
      list.style.marginBottom = '12px';
      list.style.listStylePosition = 'inside';
      list.style.paddingLeft = '20px';
    });
    
    // 순서 없는 리스트 (ul) 마커 설정
    clone.querySelectorAll('ul').forEach(ul => {
      ul.style.listStyleType = 'disc';
      ul.style.listStylePosition = 'outside';
    });
    
    // 순서 있는 리스트 (ol) 마커 설정
    clone.querySelectorAll('ol').forEach(ol => {
      ol.style.listStyleType = 'decimal';
      ol.style.listStylePosition = 'outside';
    });
    
    // 리스트 아이템 처리
    clone.querySelectorAll('li').forEach(li => {
      li.style.marginBottom = '6px';
      li.style.lineHeight = '1.5';
      li.style.display = 'list-item';
      li.style.textIndent = '-1.2em';
      li.style.paddingLeft = '1.2em';
    });
    
    return clone.innerHTML;
  }

  // 깔끔한 HTML 생성
  generateCleanHTML(content, options) {
    let html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #4a5568;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            background: white;
            overflow: visible;
            font-size: 16px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10a37f;
          }
          
          .header h1 {
            color: #10a37f;
            font-size: 24px;
            margin-bottom: 10px;
          }
          
          .header .timestamp {
            color: #666;
            font-size: 14px;
          }
          
          .message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #e5e7eb;
          }
          
          .message.user {
            background: #f0fdf4;
            border-left-color: #10a37f;
          }
          
          .message.user .content {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          .message.assistant {
            background: #f8fafc;
            border-left-color: #6366f1;
          }
          
          .message .role {
            font-weight: bold;
            margin-bottom: 8px;
            color: #374151;
          }
          
          .message .content {
            font-size: 16px;
            line-height: 1.6;
          }
          
          .message .content h1, .message .content h2, .message .content h3 {
            margin: 16px 0 8px 0;
            color: #1f2937;
          }
          
          .message .content p {
            margin-bottom: 12px;
          }
          
          .message .content ul, .message .content ol {
            margin: 12px 0;
            padding-left: 2em;
            margin-left: 0;
            list-style-position: outside;
            line-height: 1.6;
          }
          
          .message .content ul {
            list-style-type: disc !important;
          }
          
          .message .content ol {
            list-style-type: decimal !important;
          }
          
          .message .content li {
            margin: 0.5em 0;
            line-height: 1.6;
            color: #2d3748;
          }
          
          .message .content ul ul {
            list-style-type: circle !important;
            margin-top: 6px;
            margin-bottom: 6px;
            padding-left: 2em;
            margin-left: 0;
          }
          
          .message .content ul ul ul {
            list-style-type: square !important;
            padding-left: 2em;
            margin-left: 0;
          }
          
          .message .content ol ol {
            list-style-type: lower-alpha !important;
            margin-top: 6px;
            margin-bottom: 6px;
            padding-left: 2em;
            margin-left: 0;
          }
          
          .message .content ol ol ol {
            list-style-type: lower-roman !important;
            padding-left: 2em;
            margin-left: 0;
          }
          
          .message .content pre,
          .message .content pre *,
          .message .content code,
          .message .content code * {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
            color: #e2e8f0 !important;
          }
          
          .message .content pre {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%) !important;
            padding: 24px !important;
            border-radius: 12px !important;
            border: 1px solid #475569 !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
            overflow-x: auto !important;
            overflow-y: visible !important;
            white-space: pre !important;
            word-wrap: normal !important;
            word-break: normal !important;
            hyphens: none !important;
            margin: 16px 0 !important;
            font-size: 14px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            color: #e2e8f0 !important;
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace !important;
            line-height: 1.6 !important;
            position: relative !important;
            text-indent: 0 !important;
            tab-size: 4 !important;
          }
          
          .message .content pre::before {
            content: "CODE" !important;
            position: absolute !important;
            top: 12px !important;
            right: 16px !important;
            background: rgba(52, 211, 153, 0.15) !important;
            color: #34d399 !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            font-size: 9px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
            border: 1px solid rgba(52, 211, 153, 0.3) !important;
            white-space: nowrap !important;
            z-index: 10 !important;
            line-height: 1 !important;
            display: inline-block !important;
            min-width: auto !important;
            text-align: center !important;
          }
          
          .message .content code {
            background: rgba(79, 70, 229, 0.1) !important;
            color: #4f46e5 !important;
            padding: 3px 6px !important;
            border-radius: 4px !important;
            font-size: 13px !important;
            font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace !important;
            border: 1px solid rgba(79, 70, 229, 0.2) !important;
            font-weight: 500 !important;
          }
          
          .message .content pre code {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            white-space: pre !important;
            word-wrap: normal !important;
            word-break: normal !important;
            hyphens: none !important;
            color: inherit !important;
            font-family: inherit !important;
            font-size: inherit !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            text-indent: 0 !important;
            tab-size: 4 !important;
          }
          
          .message .content table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }
          
          .message .content th, .message .content td {
            border: 1px solid #d1d5db;
            padding: 8px 12px;
            text-align: left;
          }
          
          .message .content th {
            background: #f6f8fa;
            font-weight: bold;
          }
          
          .message .content blockquote {
            border-left: 4px solid #d1d5db;
            margin: 12px 0;
            padding-left: 16px;
            color: #6b7280;
          }
          
          .message .content hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 20px 0;
            width: 100%;
          }
          
          .timestamp {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 8px;
          }
          
          @media print {
            body {
              padding: 0;
              max-width: none;
            }
            
            .header {
              page-break-after: avoid;
            }
            
            .message {
              page-break-inside: avoid;
              break-inside: avoid;
              orphans: 3;
              widows: 3;
            }
            
            .message .content {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .message .content pre,
            .message .content table {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${content.title}</h1>
          ${options.includeTimestamp ? `<div class="timestamp">${chrome.i18n.getMessage('generatedDate') || 'Generated'}: ${content.timestamp}</div>` : ''}
        </div>
    `;
    
    content.messages.forEach(message => {
      const roleText = options.includeUserInfo 
        ? (message.role === 'user' ? '👤 사용자' : '🤖 ChatGPT')
        : '';
      
      html += `
        <div class="message ${message.role}">
          ${roleText ? `<div class="role">${roleText}</div>` : ''}
          <div class="content">${message.content}</div>
        </div>
      `;
    });
    
    html += `</body></html>`;
    return html;
  }

  // 직접 PDF 생성
  generateDirectPDF(content, options) {
    // 모든 경우에 이미지 기반 PDF 생성
    this.generateImageBasedPDF(content, options);
  }

  // 복잡한 레이아웃 확인
  checkForComplexLayout(content) {
    return content.messages.some(message => {
      const htmlContent = message.content;
      return htmlContent.includes('<table') || 
             htmlContent.includes('<img') || 
             htmlContent.includes('<pre') || 
             htmlContent.includes('<code') ||
             htmlContent.includes('<ul') ||
             htmlContent.includes('<ol') ||
             htmlContent.includes('<blockquote');
    });
  }

  // 메시지별로 페이지 분할하여 PDF 생성
  generatePDFByMessages(content, options) {
    try {
      const pdf = new (this.getJsPDFConstructor())('p', 'mm', 'a4');
      const pageWidth = 210; // A4 폭 (mm)
      const pageHeight = 297; // A4 높이 (mm)
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      let currentY = margin;
      let isFirstPage = true;
      
      // 헤더 추가
      this.addPDFHeader(pdf, content, options, margin, contentWidth);
      currentY += 40;
      
      // 메시지별로 처리
      content.messages.forEach((message, index) => {
        const messageHeight = this.estimateMessageHeight(pdf, message, options, contentWidth);
        
        // 페이지 넘김이 필요한 경우 (여유 공간 확보)
        if (currentY + messageHeight > pageHeight - margin - 25) {
          pdf.addPage();
          currentY = margin + 10;
          isFirstPage = false;
        }
        
        // 메시지 추가
        currentY = this.addMessageToPDF(pdf, message, options, margin, contentWidth, currentY);
        currentY += 15; // 메시지 간 간격
      });
      
      // 파일 다운로드
      const fileName = `${content.title.replace(/[^\w\s-]/gi, '')}.pdf`;
      pdf.save(fileName);
      
      this.getUIManager().showNotification(this.getMessage('completed'));
    } catch (error) {
      // 텍스트 기반 PDF 생성 실패 시에도 에러 모달 표시
      if (content.messages.length > 50) {
        this.getUIManager().createErrorModal();
      } else {
        this.getUIManager().showNotification('⚠️ 텍스트 PDF 생성 실패, 이미지 기반으로 전환합니다.');
        this.generateImageBasedPDF(content, options);
      }
    }
  }

  // PDF 헤더 추가
  addPDFHeader(pdf, content, options, margin, contentWidth) {
    pdf.setFontSize(20);
    pdf.setTextColor(16, 163, 127);
    pdf.text(content.title, margin, margin + 15);
    
    if (options.includeTimestamp) {
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${chrome.i18n.getMessage('generatedDate') || 'Generated'}: ${content.timestamp}`, margin, margin + 25);
    }
    
    // 구분선
    pdf.setDrawColor(16, 163, 127);
    pdf.setLineWidth(1);
    pdf.line(margin, margin + 30, margin + contentWidth, margin + 30);
  }

  // 메시지 높이 추정 (한국어 텍스트 지원 개선)
  estimateMessageHeight(pdf, message, options, contentWidth) {
    const textContent = message.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    
    // 한국어 텍스트를 위한 더 정확한 폭 계산
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(textContent, contentWidth - 10);
    
    const baseHeight = 15; // 기본 높이
    const lineHeight = 5; // 줄 높이
    const roleHeight = options.includeUserInfo ? 12 : 0;
    const padding = 10; // 상하 패딩
    
    // 코드 블록, 테이블 등 특별 콘텐츠 처리
    const hasCodeBlock = message.content.includes('<pre') || message.content.includes('<code');
    const hasTable = message.content.includes('<table');
    const hasList = message.content.includes('<ul') || message.content.includes('<ol');
    
    let extraHeight = 0;
    if (hasCodeBlock) extraHeight += 20;
    if (hasTable) extraHeight += 30;
    if (hasList) extraHeight += 15;
    
    return baseHeight + roleHeight + (lines.length * lineHeight) + padding + extraHeight;
  }

  // PDF에 메시지 추가
  addMessageToPDF(pdf, message, options, margin, contentWidth, currentY) {
    const startY = currentY;
    
    // 역할 정보 추가
    if (options.includeUserInfo) {
      pdf.setFontSize(12);
      pdf.setTextColor(55, 65, 81);
      const roleText = message.role === 'user' ? '👤 사용자' : '🤖 ChatGPT';
      pdf.text(roleText, margin, currentY);
      currentY += 12;
    }
    
    // 메시지 내용 추가
    pdf.setFontSize(11);
    pdf.setTextColor(51, 51, 51);
    
    // HTML 태그 제거하고 텍스트만 추출
    const textContent = message.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    const lines = pdf.splitTextToSize(textContent, contentWidth - 15);
    
    // 배경 박스 그리기 (더 나은 스타일)
    const boxHeight = lines.length * 5 + 15;
    const boxStartY = options.includeUserInfo ? startY + 2 : startY - 3;
    
    // 메시지 타입에 따른 스타일링
    if (message.role === 'user') {
      pdf.setFillColor(240, 253, 244); // 연한 녹색
      pdf.setDrawColor(34, 197, 94); // 녹색 테두리
    } else {
      pdf.setFillColor(248, 250, 252); // 연한 회색
      pdf.setDrawColor(148, 163, 184); // 회색 테두리
    }
    
    pdf.setLineWidth(0.5);
    pdf.rect(margin + 3, boxStartY, contentWidth - 6, boxHeight, 'FD');
    
    // 텍스트 출력
    pdf.text(lines, margin + 8, currentY);
    
    return currentY + (lines.length * 5) + 8;
  }


  // 기존 이미지 기반 PDF 생성 (복잡한 레이아웃용)
  generateImageBasedPDF(content, options) {
    if (!content.messages || content.messages.length === 0) {
      this.getUIManager().showNotification(this.getMessage('noMessages'));
      return;
    }
    
    // 로딩 오버레이 생성
    const loadingOverlay = this.createLoadingOverlay();
    document.body.appendChild(loadingOverlay);
    
    // DOM에 숨겨진 컨테이너 생성 및 렌더링
    const container = this.createHiddenContainer(content, options);
    document.body.appendChild(container);
    
    // 렌더링 후 캔버스 생성
    setTimeout(() => {
      // html2canvas로 이미지 렌더링
      const canvasFunc = window.html2canvas || html2canvas;
      canvasFunc(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: container.scrollWidth,
        height: container.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight,
        removeContainer: true,
        foreignObjectRendering: true,
        ignoreElements: function(element) {
          return element.classList && element.classList.contains('ignore-canvas');
        }
      }).then(canvas => {
        try {
          // Canvas가 비어있는지 확인
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const isEmpty = imageData.data.every(pixel => pixel === 0);
          
          if (isEmpty) {
            throw new Error('Canvas is empty - content not rendered properly');
          }
          
          const imgData = canvas.toDataURL('image/jpeg', 0.85);
          
          // jsPDF 인스턴스 생성
          let pdf;
          let jsPDFConstructor = this.getJsPDFConstructor();
          
          if (jsPDFConstructor) {
            pdf = new jsPDFConstructor('p', 'mm', 'a4');
          } else {
            throw new Error('jsPDF constructor not found');
          }
          
          // 이미지 크기 계산
          const imgWidth = 210; // A4 폭 (mm)
          const pageHeight = 297; // A4 높이 (mm)
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          
          let position = 0;
          
          // 첫 페이지 추가
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          
          // 여러 페이지 처리 (개선된 페이지 분할)
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          
          // 파일 다운로드
          const fileName = `${content.title.replace(/[^\w\s-]/gi, '')}.pdf`;
          pdf.save(fileName);
          
          this.getUIManager().showNotification(this.getMessage('completed'));
          
        } catch (error) {
          const uiManager = this.getUIManager();
          uiManager.createErrorModal();
        } finally {
          this.cleanup(container, loadingOverlay);
        }
      }).catch(error => {
        this.cleanup(container, loadingOverlay);
        
        // 렌더링 실패 시에도 에러 모달 표시
        const uiManager = this.getUIManager();
        uiManager.createErrorModal();
      });
    }, 100);
  }

  // 로딩 오버레이 생성
  createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'pdf-loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      backdrop-filter: blur(4px);
    `;
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    const spinnerIcon = document.createElement('div');
    spinnerIcon.style.cssText = `
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #10a37f;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    `;
    
    const message = document.createElement('div');
    message.textContent = this.getMessage('generating');
    message.style.cssText = `
      color: #374151;
      font-size: 16px;
      font-weight: 500;
    `;
    
    // 스피너 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    spinner.appendChild(spinnerIcon);
    spinner.appendChild(message);
    overlay.appendChild(spinner);
    
    return overlay;
  }

  // 숨겨진 컨테이너 생성 (html2canvas가 렌더링 가능하도록)
  createHiddenContainer(content, options) {
    const container = document.createElement('div');
    
    // 먼저 스타일 적용 후 컨텐츠 추가
    container.style.cssText = `
      position: absolute;
      top: -99999px;
      left: 0;
      width: 1000px;
      min-width: 1000px;
      padding: 40px;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      z-index: -1;
      pointer-events: none;
      box-sizing: border-box;
      overflow: visible;
    `;
    
    // innerHTML 대신 DOM 구조 직접 생성
    const htmlContent = this.generateCleanHTML(content, options);
    
    // 임시로 보이는 위치에 배치하여 렌더링 확인
    container.style.top = '0';
    container.style.left = '0';
    container.style.zIndex = '99998'; // 오버레이 아래
    container.innerHTML = htmlContent;
    
    
    // 한국어 텍스트 렌더링 개선을 위한 스타일 추가
    const additionalStyle = document.createElement('style');
    // 새로운 디자인 - 미니멀 & 깔끔
    const newDesignCSS = `
      /* === 기본 리셋 === */
      * {
        box-sizing: border-box !important;
      }
      
      /* === 리스트 기본 리셋 === */
      ul, ol, li {
        margin: 0;
        padding: 0;
      }
      
      /* === 전체 레이아웃 === */
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        font-size: 14px !important;
        line-height: 1.7 !important;
        color: #2d3748 !important;
        background: #ffffff !important;
        margin: 0 !important;
        padding: 20px !important;
      }
      
      /* === 메시지 컨테이너 === */
      .message {
        margin-bottom: 32px !important;
        padding: 24px !important;
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 8px !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      .message.user {
        background: #f7fafc !important;
        border-left: 4px solid #3182ce !important;
      }
      
      .message.assistant {
        background: #ffffff !important;
        border-left: 4px solid #38a169 !important;
      }
      
      /* === 타이포그래피 === */
      h1, h2, h3, h4, h5, h6 {
        color: #1a202c !important;
        font-weight: 600 !important;
        margin: 0 0 16px 0 !important;
        line-height: 1.4 !important;
      }
      
      h1 { font-size: 24px !important; }
      h2 { font-size: 20px !important; }
      h3 { font-size: 18px !important; }
      h4 { font-size: 16px !important; }
      
      p {
        margin: 0 0 12px 0 !important;
        color: #2d3748 !important;
      }
      
      /* === 리스트 - 브라우저 기본 스타일 === */
      ul {
        list-style-type: disc;
        margin: 1em 0;
        padding-left: 2em;
      }
      
      ol {
        list-style-type: decimal;
        margin: 1em 0;
        padding-left: 2em;
      }
      
      li {
        margin: 0.5em 0;
        line-height: 1.6;
        color: #2d3748;
      }
      
      /* 중첩 리스트 */
      ul ul, ol ol, ul ol, ol ul {
        margin: 0.5em 0;
        padding-left: 2em;
      }
      
      ul ul { list-style-type: circle; }
      ol ol { list-style-type: lower-alpha; }
      ul ul ul { list-style-type: square; }
      ol ol ol { list-style-type: lower-roman; }
      
      /* === 코드 스타일 - 기본 스타일 === */
      code {
        background: #edf2f7 !important;
        color: #2d3748 !important;
        font-family: monospace !important;
        font-size: 0.9em !important;
        padding: 0.1em 0.3em !important;
        border-radius: 3px !important;
        border: 1px solid #cbd5e0 !important;
      }
      
      pre {
        background: #f7fafc !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 6px !important;
        padding: 16px !important;
        margin: 16px 0 !important;
        overflow-x: auto !important;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
      }
      
      pre code {
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        color: #2d3748 !important;
      }
      
      /* === 테이블 === */
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin: 20px 0 !important;
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 6px !important;
        overflow: hidden !important;
      }
      
      th {
        background: #f7fafc !important;
        color: #2d3748 !important;
        font-weight: 600 !important;
        padding: 12px 16px !important;
        text-align: left !important;
        border-bottom: 2px solid #e2e8f0 !important;
      }
      
      td {
        padding: 12px 16px !important;
        border-bottom: 1px solid #e2e8f0 !important;
        color: #2d3748 !important;
      }
      
      tr:last-child td {
        border-bottom: none !important;
      }
      
      /* === 인용 === */
      blockquote {
        border-left: 4px solid #cbd5e0 !important;
        margin: 16px 0 !important;
        padding: 12px 20px !important;
        background: #f7fafc !important;
        color: #4a5568 !important;
        border-radius: 0 4px 4px 0 !important;
      }
      
      /* === 강제 스타일 덮어쓰기 === */
      *[style*="background-color: rgb(0, 0, 0)"],
      *[style*="background-color: black"],
      *[style*="background: black"],
      *[style*="background-color: #000"],
      *[class*="bg-black"],
      *[class*="dark"] {
        background: #edf2f7 !important;
        color: #2d3748 !important;
        padding: 2px 6px !important;
        border-radius: 4px !important;
        border: 1px solid #cbd5e0 !important;
      }
      
      /* === 페이지 브레이크 === */
      table, pre, blockquote {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `;
    
    additionalStyle.innerHTML = newDesignCSS;
    container.appendChild(additionalStyle);

    return container;
  }

  // 정리 작업
  cleanup(container, loadingOverlay) {
    try {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      if (loadingOverlay && loadingOverlay.parentNode) {
        loadingOverlay.parentNode.removeChild(loadingOverlay);
      }
    } catch (error) {
      // 정리 작업 중 오류 발생
    }
  }

  // jsPDF 생성자 가져오기
  getJsPDFConstructor() {
    if (typeof jsPDF !== 'undefined') {
      return jsPDF;
    } else if (window.jsPDF && window.jsPDF.jsPDF) {
      return window.jsPDF.jsPDF;
    } else if (typeof window.jsPDF === 'function') {
      return window.jsPDF;
    } else if (typeof window.jspdf !== 'undefined') {
      if (typeof window.jspdf.jsPDF === 'function') {
        return window.jspdf.jsPDF;
      } else if (typeof window.jspdf.default === 'function') {
        return window.jspdf.default;
      } else if (typeof window.jspdf === 'function') {
        return window.jspdf;
      } else {
        for (const key in window.jspdf) {
          if (typeof window.jspdf[key] === 'function') {
            return window.jspdf[key];
          }
        }
      }
    } else if (typeof globalThis !== 'undefined' && typeof globalThis.jsPDF !== 'undefined') {
      return globalThis.jsPDF;
    } else if (typeof self !== 'undefined' && typeof self.jsPDF !== 'undefined') {
      return self.jsPDF;
    }
    
    return null;
  }


  // HTML 파일 다운로드
  exportToHTML(modal) {
    const options = this.getExportOptions(modal);
    const content = this.extractContent(options);
    
    if (!content.messages.length) {
      alert('저장할 메시지가 없습니다.');
      return;
    }
    
    modal.remove();
    this.uiManager.showNotification(this.getMessage('htmlGenerating'));
    
    const htmlContent = this.generateCleanHTML(content, options);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title.replace(/[^\w\s-]/gi, '')}.html`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.uiManager.showNotification(this.getMessage('htmlCompleted'));
  }

  // 텍스트 파일 다운로드
  exportToText(modal) {
    const options = this.getExportOptions(modal);
    const content = this.extractContent(options);
    
    if (!content.messages.length) {
      alert('저장할 메시지가 없습니다.');
      return;
    }
    
    modal.remove();
    this.uiManager.showNotification(this.getMessage('textGenerating'));
    
    let textContent = `${content.title}\n`;
    if (options.includeTimestamp) {
      textContent += `${chrome.i18n.getMessage('generatedDate') || 'Generated'}: ${content.timestamp}\n`;
    }
    textContent += `${'='.repeat(50)}\n\n`;
    
    content.messages.forEach((message, index) => {
      if (options.includeUserInfo) {
        textContent += `${message.role === 'user' ? '👤 사용자' : '🤖 ChatGPT'}:\n`;
      }
      
      // HTML 태그 제거
      const textOnly = message.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
      textContent += `${textOnly}\n`;
      
      textContent += `\n${'-'.repeat(30)}\n\n`;
    });
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title.replace(/[^\w\s-]/gi, '')}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.uiManager.showNotification(this.getMessage('textCompleted'));
  }
}

// 전역 인스턴스 생성
window.pdfExporter = new PDFGenerator();