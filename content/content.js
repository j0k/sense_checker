// Content script runs on YouTube pages.
// Video data is read via chrome.scripting.executeScript from the popup.
// This file can be extended to observe DOM changes (e.g. SPA navigation)
// or to inject a small badge/indicator on the page.

(function () {
  'use strict';

  const VIDEO_URL_REGEX = /^https:\/\/www\.youtube\.com\/watch\?v=/;

  function isVideoPage() {
    return VIDEO_URL_REGEX.test(window.location.href);
  }

  if (isVideoPage()) {
    // Optional: dispatch event when key elements appear (for dynamic YT UI)
    const observer = new MutationObserver(function () {
      if (document.querySelector('h1.ytd-video-primary-info-renderer, #title h1, h1.title')) {
        // Page ready for extraction; popup will call executeScript
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
