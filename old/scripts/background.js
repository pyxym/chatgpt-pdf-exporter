// Background script for screenshot PDF functionality

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureVisibleTab') {
    // 현재 활성 탭 정보 가져오기
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ error: '활성 탭을 찾을 수 없습니다.' });
        return;
      }
      
      const activeTab = tabs[0];
      
      // 스크린샷 캡처
      chrome.tabs.captureVisibleTab(
        activeTab.windowId,
        { format: 'png', quality: 100 },
        (dataUrl) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ dataUrl: dataUrl });
          }
        }
      );
    });
    
    return true; // 비동기 응답을 위해 true 반환
  }
  
  if (request.action === 'downloadFile') {
    // 파일 다운로드
    chrome.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId: downloadId });
      }
    });
    
    return true;
  }
  
  if (request.action === 'downloadPDF') {
    // PDF 파일 다운로드
    try {
      const { dataUri, filename } = request;
      
      if (dataUri && filename) {
        chrome.downloads.download({
          url: dataUri,
          filename: filename,
          saveAs: false
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true, downloadId: downloadId });
          }
        });
      } else {
        sendResponse({ error: 'Missing dataUri or filename' });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
    
    return true;
  }
});

// 확장 프로그램 설치 시 초기화
chrome.runtime.onInstalled.addListener(() => {
  // 확장 프로그램 설치 완료
});

// 탭 업데이트 감지
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && 
      (tab.url.includes('chatgpt.com') || tab.url.includes('chat.openai.com'))) {
    // ChatGPT 페이지 로드 완료
  }
});