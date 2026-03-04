// Content script runs on YouTube pages.
// - Video data is read via chrome.scripting.executeScript from the popup.
// - Listens for getVisibleVideos and clickNotInterested from popup.

(function () {
  'use strict';

  const VIDEO_URL_REGEX = /^https:\/\/www\.youtube\.com\/watch\?v=/;
  const SENSE_ANALYZE_MENU_ID = 'sense-checker-menu-item';

  function isVideoPage() {
    return VIDEO_URL_REGEX.test(window.location.href);
  }

  let lastClickedVideoCard = null;
  document.addEventListener('click', function (e) {
    const card = e.target.closest('ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer');
    if (card) lastClickedVideoCard = card;
  }, true);

  if (isVideoPage()) {
    function tryInject() {
      if (document.getElementById('sense-checker-injected-btn')) return;
      injectSenseAnalyzeButton();
    }
    tryInject();
    setTimeout(tryInject, 1500);
    setTimeout(tryInject, 4000);
    const observer = new MutationObserver(function () {
      if (!document.getElementById('sense-checker-injected-btn')) tryInject();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function queryAllIncludingShadow(root, selector) {
    const out = [];
    root.querySelectorAll(selector).forEach((el) => out.push(el));
    root.querySelectorAll('*').forEach((el) => {
      if (el.shadowRoot) queryAllIncludingShadow(el.shadowRoot, selector).forEach((e) => out.push(e));
    });
    return out;
  }

  function injectSenseAnalyzeIntoMenu() {
    const reportItems = queryAllIncludingShadow(document.body, 'tp-yt-paper-item, ytd-menu-service-item-renderer, ytd-menu-navigation-item-renderer');
    const reportItem = reportItems.find(function (el) {
      const t = (el.textContent || '').trim();
      if (t !== 'Report' && (!t.includes('Report') || t.length > 25)) return false;
      const list = el.closest('tp-yt-paper-listbox') || el.parentElement;
      if (!list || !isVisible(list)) return false;
      if (list.querySelector('[data-sense-checker="menu-item"]')) return false;
      return true;
    });
    if (!reportItem) return;
    const list = reportItem.closest('tp-yt-paper-listbox') || reportItem.closest('#content') || reportItem.parentElement;
    if (!list) return;
    const our = document.createElement(reportItem.tagName === 'YTD-MENU-SERVICE-ITEM-RENDERER' ? 'ytd-menu-service-item-renderer' : 'tp-yt-paper-item');
    our.id = SENSE_ANALYZE_MENU_ID;
    our.setAttribute('data-sense-checker', 'menu-item');
    our.className = reportItem.className || '';
    our.setAttribute('role', reportItem.getAttribute('role') || 'menuitem');
    if (reportItem.style && reportItem.style.cssText) our.style.cssText = reportItem.style.cssText;
    const label = document.createElement('span');
    label.textContent = 'Sense Analyze';
    our.appendChild(label);
    our.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      runSenseAnalyzeForMenu();
    });
    reportItem.parentNode.insertBefore(our, reportItem.nextSibling);
  }

  function getVideoDataFromCard(card) {
    if (!card) return null;
    const titleEl = card.querySelector('#video-title, [id="video-title"]');
    const channelEl = card.querySelector('#channel-name a, #text.ytd-channel-name, ytd-channel-name a');
    const getText = (el) => (el && el.textContent ? el.textContent.trim() : '');
    return { title: getText(titleEl), channel: getText(channelEl), description: '' };
  }

  function runSenseAnalyzeForMenu() {
    const data = isVideoPage() ? getVideoDataForAnalyze() : getVideoDataFromCard(lastClickedVideoCard);
    if (!data || !data.title) {
      showSenseOverlay({ sense: 0, emotions: 0, propaganda: 0, summary: 'No video title found.' });
      return;
    }
    chrome.runtime.sendMessage({ action: 'analyze', title: data.title, channel: data.channel, description: data.description }, function (res) {
      if (res && res.ok) showSenseOverlay(res);
      else showSenseOverlay({ sense: 0, emotions: 0, propaganda: 0, summary: 'Analysis failed.' });
    });
  }

  const menuObserver = new MutationObserver(function () {
    if (document.getElementById(SENSE_ANALYZE_MENU_ID)) return;
    const hasReport = document.body.textContent.includes('Report');
    const hasDontRec = document.body.textContent.includes('Don\'t recommend channel');
    if (hasReport && hasDontRec) injectSenseAnalyzeIntoMenu();
  });
  menuObserver.observe(document.body, { childList: true, subtree: true });

  function getVideoDataForAnalyze() {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const title = ogTitle ? (ogTitle.getAttribute('content') || '').trim() : '';
    const description = ogDesc ? (ogDesc.getAttribute('content') || '').trim() : '';
    const sel = (s) => document.querySelector(s);
    const channelEl = sel('#channel-name a') || sel('ytd-channel-name a') || sel('#text.ytd-channel-name a');
    const channel = channelEl ? (channelEl.textContent || '').trim() : '';
    return { title, channel, description };
  }

  function showSenseOverlay(result) {
    const id = 'sense-checker-overlay';
    let el = document.getElementById(id);
    if (el) el.remove();
    el = document.createElement('div');
    el.id = id;
    el.innerHTML =
      '<div class="sense-checker-overlay-backdrop"></div>' +
      '<div class="sense-checker-overlay-card">' +
      '<div class="sense-checker-overlay-title">Sense Checker</div>' +
      '<div class="sense-checker-overlay-row"><span>Sense</span><span>' + result.sense + '%</span></div>' +
      '<div class="sense-checker-overlay-row"><span>Emotions</span><span>' + result.emotions + '%</span></div>' +
      '<div class="sense-checker-overlay-row"><span>Propaganda</span><span>' + result.propaganda + '%</span></div>' +
      '<p class="sense-checker-overlay-summary">' + (result.summary || '').replace(/</g, '&lt;') + '</p>' +
      '<button type="button" class="sense-checker-overlay-close">Close</button>' +
      '</div>';
    el.querySelector('.sense-checker-overlay-backdrop').onclick = () => el.remove();
    el.querySelector('.sense-checker-overlay-close').onclick = () => el.remove();
    const style = document.createElement('style');
    style.textContent =
      '.sense-checker-overlay-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;}' +
      '#sense-checker-overlay .sense-checker-overlay-card{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:12px;padding:20px;min-width:280px;max-width:360px;box-shadow:0 8px 32px rgba(0,0,0,0.2);z-index:9999;font-family:system-ui,sans-serif;font-size:14px;}' +
      '.sense-checker-overlay-title{font-weight:700;margin-bottom:12px;color:#0f172a;}' +
      '.sense-checker-overlay-row{display:flex;justify-content:space-between;margin-bottom:8px;}' +
      '.sense-checker-overlay-summary{margin:12px 0;font-size:13px;color:#475569;line-height:1.4;}' +
      '.sense-checker-overlay-close{width:100%;padding:8px;background:#0f172a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;}';
    el.appendChild(style);
    document.body.appendChild(el);
  }

  function injectSenseAnalyzeButton() {
    if (document.getElementById('sense-checker-injected-btn')) return;
    const primary = document.querySelector('ytd-video-primary-info-renderer');
    const actionsRow = document.querySelector('#top-level-buttons-computed') ||
      document.querySelector('#top-level-buttons') ||
      (primary && primary.querySelector('#actions')) ||
      (primary && primary.querySelector('ytd-menu-renderer') && primary.querySelector('ytd-menu-renderer').parentElement);
    const menuRenderer = primary && primary.querySelector('ytd-menu-renderer');
    const insertAfter = menuRenderer || (actionsRow && actionsRow.lastElementChild) || null;
    if (!insertAfter) return;
    const btn = document.createElement('button');
    btn.id = 'sense-checker-injected-btn';
    btn.type = 'button';
    btn.className = 'sense-checker-yt-btn';
    btn.textContent = 'Sense Analyze';
    btn.setAttribute('aria-label', 'Sense Analyze');
    const style = document.createElement('style');
    style.textContent = '.sense-checker-yt-btn{background:transparent;border:none;color:#0f0f0f;cursor:pointer;font-family:inherit;font-size:14px;padding:0 16px;height:36px;align-items:center;display:inline-flex;}.sense-checker-yt-btn:hover{background:rgba(0,0,0,0.05);border-radius:18px;}';
    document.head.appendChild(style);
    btn.onclick = function () {
      btn.disabled = true;
      btn.textContent = '…';
      const data = getVideoDataForAnalyze();
      chrome.runtime.sendMessage({ action: 'analyze', title: data.title, channel: data.channel, description: data.description }, function (res) {
        btn.disabled = false;
        btn.textContent = 'Sense Analyze';
        if (res && res.ok) showSenseOverlay(res);
        else showSenseOverlay({ sense: 0, emotions: 0, propaganda: 0, summary: 'Analysis failed.' });
      });
    };
    insertAfter.parentNode.insertBefore(btn, insertAfter.nextSibling);
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
