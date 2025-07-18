import type UIManager from './ui-manager';
import type I18nManager from './i18n-manager';
import type { ExportOptions } from './ui-manager';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Extend ExportOptions to include selectedFormat
interface PDFGeneratorOptions extends ExportOptions {
  selectedFormat: 'pdf' | 'html' | 'text';
}

interface MessageData {
  role: string;
  content: string;
  timestamp?: string;
}

interface ExtractedContent {
  title: string;
  messages: MessageData[];
  timestamp: string;
}

type PDFMessages = {
  [K in 'generatedDate' | 'defaultChatTitle' | 'completed']: string;
};

export default class PDFGenerator {
  private uiManager: UIManager;
  private i18nManager: I18nManager;

  constructor(uiManager: UIManager, i18nManager: I18nManager) {
    this.uiManager = uiManager;
    this.i18nManager = i18nManager;
  }

  async exportToPrint(options: PDFGeneratorOptions): Promise<void> {
    try {
      this.uiManager.showNotification('Generating PDF...', { type: 'info' });
      
      const extractedContent = this.extractContent(options);
      const cleanHtml = this.generateCleanHTML(extractedContent, options);
      
      if (options.selectedFormat === 'pdf') {
        const success = await this.generateDirectPDF(cleanHtml, extractedContent.title);
        if (!success) {
          // Fallback to print
          this.showPrintPreview(cleanHtml);
        }
      } else if (options.selectedFormat === 'html') {
        this.exportToHTML(cleanHtml, extractedContent.title);
      } else if (options.selectedFormat === 'text') {
        this.exportToText(extractedContent, extractedContent.title);
      }
    } catch (error) {
      console.error('Export error:', error);
      this.uiManager.showNotification('Export failed', { type: 'error' });
    }
  }

  private extractContent(options: PDFGeneratorOptions): ExtractedContent {
    const messages: MessageData[] = [];
    
    // Find message elements
    const messageElements = document.querySelectorAll(
      '[data-message-author-role], [data-message-id], .group\\/conversation-turn'
    );
    
    const selectedIndices = this.uiManager.getSelectedMessages();
    
    messageElements.forEach((element, index) => {
      // Check if we should include this message
      if (options.exportType === 'selected' && !selectedIndices.has(index)) {
        return;
      }
      
      // Extract role
      const role = element.getAttribute('data-message-author-role') || 
                   (element.textContent?.includes('ChatGPT') ? 'assistant' : 'user');
      
      // Extract content
      const contentElement = element.querySelector('.markdown, .whitespace-pre-wrap, [data-message-content]');
      const content = contentElement?.innerHTML || element.innerHTML;
      
      messages.push({
        role,
        content: this.processMessageContent(content),
        timestamp: new Date().toISOString()
      });
    });
    
    const title = options.includeTitle && options.customTitle 
      ? options.customTitle 
      : this.i18nManager.getMessage('defaultChatTitle');
    
    return {
      title,
      messages,
      timestamp: new Date().toLocaleString()
    };
  }

  private processMessageContent(html: string): string {
    // Create a temporary div to process the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove unnecessary elements
    tempDiv.querySelectorAll('button, .copy-code-button').forEach(el => el.remove());
    
    // Process code blocks
    tempDiv.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      if (code) {
        pre.style.cssText = 'background: #f3f4f6; padding: 16px; border-radius: 6px; overflow-x: auto;';
        code.style.cssText = 'font-family: monospace; font-size: 14px;';
      }
    });
    
    // Process tables
    tempDiv.querySelectorAll('table').forEach(table => {
      (table as HTMLElement).style.cssText = 'border-collapse: collapse; width: 100%; margin: 16px 0;';
      table.querySelectorAll('th, td').forEach(cell => {
        (cell as HTMLElement).style.cssText = 'border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left;';
      });
    });
    
    return tempDiv.innerHTML;
  }

  private async generateDirectPDF(html: string, title: string): Promise<boolean> {
    try {
      // Create a hidden container for rendering
      const container = this.createHiddenContainer(html);
      document.body.appendChild(container);
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use html2canvas to capture the content
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Remove the container
      container.remove();
      
      // Generate PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.pdf`;
      pdf.save(filename);
      
      this.uiManager.showNotification(this.i18nManager.getMessage('completed'), { 
        type: 'success' 
      });
      
      return true;
    } catch (error) {
      console.error('PDF generation failed:', error);
      return false;
    }
  }

  private createHiddenContainer(html: string): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 794px;
      padding: 40px;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    container.innerHTML = html;
    return container;
  }

  private generateCleanHTML(content: ExtractedContent, options: PDFGeneratorOptions): string {
    const messages = content.messages.map(msg => {
      const roleText = this.getRoleText(msg.role);
      const timestamp = options.includeTimestamp ? `<div class="timestamp">${msg.timestamp}</div>` : '';
      const userInfo = options.includeUserInfo ? `<div class="role">${roleText}</div>` : '';
      
      return `
        <div class="message ${msg.role}">
          ${userInfo}
          ${timestamp}
          <div class="content">${msg.content}</div>
        </div>
      `;
    }).join('');
    
    const title = options.includeTitle ? `<h1>${content.title}</h1>` : '';
    const generatedDate = `<div class="generated-date">${this.i18nManager.getMessage('generatedDate')}: ${content.timestamp}</div>`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${content.title}</title>
        <style>
          ${this.getExportStyles(options.cleanFormat)}
        </style>
      </head>
      <body>
        <div class="container">
          ${title}
          ${generatedDate}
          <div class="messages">
            ${messages}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getRoleText(role: string): string {
    const lang = this.i18nManager.getCurrentLanguage();
    const roleMap = {
      ko: { user: '사용자', assistant: 'ChatGPT', system: '시스템' },
      ja: { user: 'ユーザー', assistant: 'ChatGPT', system: 'システム' },
      en: { user: 'User', assistant: 'ChatGPT', system: 'System' }
    };
    
    return roleMap[lang]?.[role as keyof typeof roleMap.ko] || role;
  }

  private getExportStyles(cleanFormat: boolean): string {
    if (cleanFormat) {
      return `
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: white;
        }
        
        h1 {
          color: #202123;
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 10px;
          margin-bottom: 30px;
        }
        
        .generated-date {
          color: #666;
          font-size: 14px;
          margin-bottom: 30px;
        }
        
        .message {
          margin-bottom: 30px;
          padding: 20px;
          border-radius: 8px;
          background: #f7f7f8;
        }
        
        .message.user {
          background: #e3f2fd;
        }
        
        .message.assistant {
          background: #f3f4f6;
        }
        
        .role {
          font-weight: 600;
          color: #202123;
          margin-bottom: 8px;
        }
        
        .timestamp {
          color: #666;
          font-size: 12px;
          margin-bottom: 8px;
        }
        
        .content {
          color: #333;
        }
        
        pre {
          background: #282c34;
          color: #abb2bf;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
        }
        
        code {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
        }
        
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }
        
        th {
          background: #f3f4f6;
          font-weight: 600;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 20px;
          }
          
          .message {
            page-break-inside: avoid;
          }
        }
      `;
    } else {
      return `
        body {
          font-family: sans-serif;
          line-height: 1.4;
          color: #000;
          margin: 20px;
        }
        
        .message {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ccc;
        }
        
        .role {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .timestamp {
          color: #666;
          font-size: 12px;
          margin-bottom: 5px;
        }
        
        @media print {
          .message {
            page-break-inside: avoid;
          }
        }
      `;
    }
  }

  private showPrintPreview(html: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  private exportToHTML(html: string, title: string): void {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.html`;
    
    browser.runtime.sendMessage({
      action: 'downloadFile',
      url: url,
      filename: filename
    });
    
    this.uiManager.showNotification('HTML exported successfully', { type: 'success' });
  }

  private exportToText(content: ExtractedContent, title: string): void {
    let text = '';
    
    if (content.title) {
      text += `${content.title}\n${'='.repeat(content.title.length)}\n\n`;
    }
    
    text += `Generated: ${content.timestamp}\n\n`;
    
    content.messages.forEach(msg => {
      const roleText = this.getRoleText(msg.role);
      text += `\n${roleText}:\n`;
      text += '-'.repeat(roleText.length + 1) + '\n';
      
      // Convert HTML to plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = msg.content;
      text += tempDiv.textContent || tempDiv.innerText || '';
      text += '\n\n';
    });
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.txt`;
    
    browser.runtime.sendMessage({
      action: 'downloadFile',
      url: url,
      filename: filename
    });
    
    this.uiManager.showNotification('Text exported successfully', { type: 'success' });
  }

  // Main export handler to be called from UI
  async handleExport(options: PDFGeneratorOptions): Promise<void> {
    if (options.exportType === 'selected' && this.uiManager.getSelectedMessageCount() === 0) {
      this.uiManager.showNotification('Please select at least one message', { 
        type: 'warning' 
      });
      return;
    }
    
    await this.exportToPrint(options);
  }
}