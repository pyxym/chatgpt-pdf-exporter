// Message types
interface CaptureVisibleTabMessage {
  action: 'captureVisibleTab';
}

interface DownloadFileMessage {
  action: 'downloadFile';
  url: string;
  filename: string;
}

interface DownloadPDFMessage {
  action: 'downloadPDF';
  dataUri: string;
  filename: string;
}

type Message = CaptureVisibleTabMessage | DownloadFileMessage | DownloadPDFMessage;

interface MessageResponse {
  success?: boolean;
  error?: string;
  dataUrl?: string;
  downloadId?: number;
}

export default defineBackground(() => {
  console.log('ChatGPT PDF Exporter background script loaded');

  // Message handler
  browser.runtime.onMessage.addListener(
    (request: Message, sender, sendResponse: (response: MessageResponse) => void) => {
      handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    }
  );

  // Extension installed
  browser.runtime.onInstalled.addListener(() => {
    console.log('ChatGPT PDF Exporter installed');
  });

  // Tab updated listener
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
      changeInfo.status === 'complete' &&
      tab.url &&
      (tab.url.includes('chatgpt.com') || tab.url.includes('chat.openai.com'))
    ) {
      console.log('ChatGPT page loaded:', tab.url);
    }
  });
});

async function handleMessage(
  request: Message,
  sender: browser.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
): Promise<void> {
  try {
    switch (request.action) {
      case 'captureVisibleTab':
        await handleCaptureVisibleTab(sendResponse);
        break;
      
      case 'downloadFile':
        await handleDownloadFile(request, sendResponse);
        break;
      
      case 'downloadPDF':
        await handleDownloadPDF(request, sendResponse);
        break;
      
      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
}

async function handleCaptureVisibleTab(
  sendResponse: (response: MessageResponse) => void
): Promise<void> {
  try {
    // Get active tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length === 0) {
      sendResponse({ error: 'No active tab found' });
      return;
    }

    const activeTab = tabs[0];
    if (!activeTab.windowId) {
      sendResponse({ error: 'No window ID found for active tab' });
      return;
    }

    // Capture screenshot
    const dataUrl = await browser.tabs.captureVisibleTab(activeTab.windowId, {
      format: 'png',
      quality: 100
    });

    sendResponse({ dataUrl });
  } catch (error) {
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Failed to capture screenshot' 
    });
  }
}

async function handleDownloadFile(
  request: DownloadFileMessage,
  sendResponse: (response: MessageResponse) => void
): Promise<void> {
  try {
    const downloadId = await browser.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: true
    });

    sendResponse({ success: true, downloadId });
  } catch (error) {
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Failed to download file' 
    });
  }
}

async function handleDownloadPDF(
  request: DownloadPDFMessage,
  sendResponse: (response: MessageResponse) => void
): Promise<void> {
  try {
    const { dataUri, filename } = request;

    if (!dataUri || !filename) {
      sendResponse({ error: 'Missing dataUri or filename' });
      return;
    }

    const downloadId = await browser.downloads.download({
      url: dataUri,
      filename: filename,
      saveAs: false
    });

    sendResponse({ success: true, downloadId });
  } catch (error) {
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Failed to download PDF' 
    });
  }
}