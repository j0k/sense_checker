importScripts('shared/sense-analyzer.js');

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'analyze' && (msg.title != null || msg.description != null)) {
    try {
      const text = [msg.title, msg.channel, msg.description].filter(Boolean).join(' ');
      const result = runSenseAnalysis(text);
      sendResponse({ ok: true, ...result });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  }
  return false;
});
