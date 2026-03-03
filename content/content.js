// Content script runs on YouTube pages.
// - Video data is read via chrome.scripting.executeScript from the popup.
// - Listens for getVisibleVideos and clickNotInterested from popup.

(function () {
  'use strict';

  const VIDEO_URL_REGEX = /^https:\/\/www\.youtube\.com\/watch\?v=/;

  function isVideoPage() {
    return VIDEO_URL_REGEX.test(window.location.href);
  }

  if (isVideoPage()) {
    const observer = new MutationObserver(function () {
      if (document.querySelector('h1.ytd-video-primary-info-renderer, #title h1, h1.title')) {
        // Page ready for extraction
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function getVideoIdFromHref(href) {
    if (!href) return null;
    try {
      const u = new URL(href, window.location.origin);
      return u.searchParams.get('v') || null;
    } catch {
      return null;
    }
  }

  function getVisibleVideos() {
    const out = [];
    const selectors = [
      'ytd-video-renderer',
      'ytd-rich-item-renderer',
      'ytd-compact-video-renderer',
      'ytd-grid-video-renderer',
    ];
    const seen = new Set();
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach((el) => {
        const a = el.querySelector('a[href*="/watch?v="]');
        const videoId = a ? getVideoIdFromHref(a.href) : null;
        if (!videoId || seen.has(videoId)) return;
        seen.add(videoId);
        const titleEl = el.querySelector('#video-title, .ytd-video-renderer #video-title, [id="video-title"]');
        const channelEl = el.querySelector('#channel-name a, #text.ytd-channel-name, ytd-channel-name a, [class*="channel-name"] a');
        const getText = (node) => (node && node.textContent ? node.textContent.trim().slice(0, 500) : '');
        out.push({
          videoId,
          title: getText(titleEl),
          channel: getText(channelEl),
        });
      });
    }
    return out;
  }

  function findMenuButton(container) {
    return container.querySelector('button[aria-label*="Action menu"], button[aria-label*="More actions"], button[aria-label*="menu"], [aria-label*="Action menu"]') ||
      container.querySelector('ytd-menu-renderer button, #button');
  }

  function findNotInterestedItem() {
    const labels = ['Not interested', 'Not interested in this video', 'I\'m not interested'];
    for (const text of labels) {
      const items = Array.from(document.querySelectorAll('tp-yt-paper-item, ytd-menu-service-item-renderer, #content ytd-menu-navigation-item-renderer'));
      const item = items.find((el) => el.textContent.trim().includes(text));
      if (item) return item;
    }
    return null;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function clickNotInterestedForVideo(videoId) {
    const link = document.querySelector('a[href*="/watch?v=' + videoId + '"]');
    if (!link) return false;
    const container = link.closest('ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer');
    if (!container) return false;
    const menuBtn = findMenuButton(container);
    if (!menuBtn) return false;
    menuBtn.click();
    await sleep(400);
    const notInterested = findNotInterestedItem();
    if (!notInterested) {
      document.body.click();
      return false;
    }
    notInterested.click();
    await sleep(300);
    return true;
  }

  async function clickNotInterested(videoIds) {
    const results = { done: 0, failed: 0 };
    for (const id of videoIds) {
      const ok = await clickNotInterestedForVideo(id);
      if (ok) results.done++; else results.failed++;
      await sleep(500);
    }
    return results;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === 'getVisibleVideos') {
      try {
        sendResponse({ ok: true, videos: getVisibleVideos() });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    } else if (msg.action === 'clickNotInterested' && Array.isArray(msg.videoIds)) {
      clickNotInterested(msg.videoIds).then((res) => sendResponse({ ok: true, ...res })).catch((e) => sendResponse({ ok: false, error: String(e) }));
      return true;
    }
    return false;
  });
})();
