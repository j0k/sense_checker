importScripts('shared/sense-analyzer.js', 'shared/sense-politics-embedding.js');

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'analyze' && (msg.title != null || msg.description != null)) {
    const text = [msg.title, msg.channel, msg.description].filter(Boolean).join(' ');
    chrome.storage.sync.get(['keywordsA', 'keywordsB'], (opts) => {
      try {
        const result = runSenseAnalysis(text);
        const embedding = typeof SensePoliticsEmbedding !== 'undefined' && SensePoliticsEmbedding.computeSensePoliticsEmbedding
          ? SensePoliticsEmbedding.computeSensePoliticsEmbedding(text, { keywordsA: opts.keywordsA, keywordsB: opts.keywordsB })
          : null;
        if (embedding) {
          result.sense = embedding.sense;
          result.politicsA = embedding.politicsA;
          result.politicsB = embedding.politicsB;
          result.embedding = { x: embedding.x, y: embedding.y };
        }
        sendResponse({ ok: true, ...result });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    });
    return true;
  }
  return false;
});
