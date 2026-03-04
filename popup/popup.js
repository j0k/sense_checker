const noVideoEl = document.getElementById('no-video');
const videoPanelEl = document.getElementById('video-panel');
const videoTitleEl = document.getElementById('video-title');
const videoChannelEl = document.getElementById('video-channel');
const checkBtn = document.getElementById('check-btn');
const resultsEl = document.getElementById('results');
const loadingEl = document.getElementById('loading');

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isYouTubeVideo(tab) {
  if (!tab?.url) return false;
  try {
    const u = new URL(tab.url);
    return u.hostname === 'www.youtube.com' && u.pathname === '/watch' && u.searchParams.has('v');
  } catch {
    return false;
  }
}

function isYouTubeShorts(tab) {
  if (!tab?.url) return false;
  try {
    const u = new URL(tab.url);
    return u.hostname === 'www.youtube.com' && u.pathname.startsWith('/shorts/');
  } catch {
    return false;
  }
}

function isYouTubeFeed(tab) {
  if (!tab?.url) return false;
  try {
    const u = new URL(tab.url);
    if (u.hostname !== 'www.youtube.com') return false;
    if (u.pathname === '/watch' || u.pathname.startsWith('/shorts/')) return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchVideoData() {
  const tab = await getCurrentTab();
  if (!tab?.id) return null;
  const isShorts = isYouTubeShorts(tab);
  const isVideo = isYouTubeVideo(tab);
  if (!isShorts && !isVideo) return null;
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (isShortsPage) => {
      const getText = (el) => (el && el.textContent ? el.textContent.trim() : '');
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDesc = document.querySelector('meta[property="og:description"]');
      const metaTitle = ogTitle ? (ogTitle.getAttribute('content') || '').trim() : '';
      const metaDesc = ogDesc ? (ogDesc.getAttribute('content') || '').trim() : '';
      if (isShortsPage) {
        const sel = (s) => document.querySelector(s);
        const channelEl = sel('[data-author-name]') || sel('ytd-channel-name a') || sel('#text.ytd-channel-name a');
        const channel = channelEl ? (channelEl.getAttribute('data-author-name') || getText(channelEl)) : '';
        return { title: metaTitle || 'Short', channel, description: metaDesc, url: window.location.href, isShorts: true };
      }
      const sel = (s) => document.querySelector(s);
      const titleEl = sel('h1.ytd-video-primary-info-renderer yt-formatted-string') || sel('#title h1 yt-formatted-string') || sel('h1.title yt-formatted-string') || sel('#title h1') || sel('h1.title');
      const channelEl = sel('#owner-name a') || sel('ytd-channel-name a') || sel('#text.ytd-channel-name a') || sel('ytd-video-owner-renderer a');
      const descEl = sel('#description-inline-expander yt-formatted-string') || sel('#description-inner yt-formatted-string') || sel('ytd-text-inline-expander#description-inline-expander') || sel('#description yt-formatted-string');
      const domTitle = getText(titleEl);
      const domChannel = getText(channelEl);
      const domDesc = getText(descEl);
      return {
        title: metaTitle || domTitle,
        channel: domChannel || '',
        description: metaDesc || domDesc,
        url: window.location.href,
        isShorts: false,
      };
    },
    args: [isShorts],
  });
  if (!results?.[0]?.result) return null;
  return results[0].result;
}

function showResults(sense, emotions, propaganda, summary, dimension, emotionsTouched, propDimension) {
  const senseBar = document.getElementById('sense-bar');
  const emotionsBar = document.getElementById('emotions-bar');
  const propagandaBar = document.getElementById('propaganda-bar');
  const senseValue = document.getElementById('sense-value');
  const emotionsValue = document.getElementById('emotions-value');
  const propagandaValue = document.getElementById('propaganda-value');
  const summaryEl = document.getElementById('summary');

  senseBar.style.width = sense + '%';
  emotionsBar.style.width = emotions + '%';
  propagandaBar.style.width = propaganda + '%';
  senseValue.textContent = sense + '%';
  emotionsValue.textContent = emotions + '%';
  propagandaValue.textContent = propaganda + '%';
  summaryEl.textContent = summary || '';

  const emotionsRow = document.getElementById('emotions-touched-row');
  const tagsEl = document.getElementById('emotions-touched-tags');
  if (emotionsTouched && emotionsTouched.length > 0) {
    tagsEl.innerHTML = emotionsTouched.map((e) => '<span class="emotion-tag">' + escapeHtml(e) + '</span>').join('');
    emotionsRow.classList.remove('hidden');
  } else {
    emotionsRow.classList.add('hidden');
  }

  const dimRow = document.getElementById('dimension-row');
  if (dimension && typeof scorePoliticalDimension === 'function') {
    document.getElementById('dimension-label-a').textContent = dimension.topicA;
    document.getElementById('dimension-label-b').textContent = dimension.topicB;
    document.getElementById('dimension-bar-a').style.flex = String(dimension.percentA);
    document.getElementById('dimension-bar-b').style.flex = String(dimension.percentB);
    document.getElementById('dimension-value').textContent =
      dimension.percentA + '% ' + dimension.topicA + ' · ' + dimension.percentB + '% ' + dimension.topicB;
    var needle = document.getElementById('wind-rose-needle');
    if (needle) {
      var rad = Math.PI * (dimension.percentB / 100);
      var r = 42;
      var x2 = 50 + r * Math.cos(rad);
      var y2 = 50 - r * Math.sin(rad);
      needle.setAttribute('x2', x2);
      needle.setAttribute('y2', y2);
    }
    dimRow.classList.remove('hidden');
  } else {
    dimRow.classList.add('hidden');
  }
  const propDimRow = document.getElementById('prop-dimension-row');
  if (propDimension && propDimension.topicA && propDimension.topicB) {
    document.getElementById('prop-dimension-value').textContent =
      propDimension.percentA + '% ' + propDimension.topicA + ' · ' + propDimension.percentB + '% ' + propDimension.topicB;
    document.getElementById('prop-dimension-label-a').textContent = propDimension.topicA;
    document.getElementById('prop-dimension-label-b').textContent = propDimension.topicB;
    document.getElementById('prop-dimension-bar-a').style.flex = String(propDimension.percentA);
    document.getElementById('prop-dimension-bar-b').style.flex = String(propDimension.percentB);
    propDimRow.classList.remove('hidden');
  } else {
    propDimRow.classList.add('hidden');
  }
  resultsEl.classList.remove('hidden');
}
function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function setLoading(loading) {
  if (loading) {
    loadingEl.classList.remove('hidden');
    resultsEl.classList.add('hidden');
  } else {
    loadingEl.classList.add('hidden');
  }
}

async function runCheck() {
  const data = await fetchVideoData();
  if (!data) return;
  setLoading(true);
  const text = [data.title, data.channel, data.description].filter(Boolean).join(' ');
  const opts = await chrome.storage.sync.get(['topicA', 'topicB', 'keywordsA', 'keywordsB', 'propTopicA', 'propTopicB', 'propKeywordsA', 'propKeywordsB', 'useAI', 'aiProvider', 'apiKey', 'customBaseUrl']);
  try {
    let sense, emotions, propaganda, summary, dimension = null, propDimension = null;
    if (opts.useAI && opts.apiKey && typeof callAIChecker === 'function') {
      try {
        const ai = await callAIChecker(text, {
          apiKey: opts.apiKey,
          provider: opts.aiProvider || 'openai',
          customBaseUrl: opts.customBaseUrl,
          topicA: opts.topicA || 'proRussian',
          topicB: opts.topicB || 'proUkrainian',
        });
        sense = ai.sense;
        emotions = ai.emotions;
        propaganda = ai.propaganda;
        summary = ai.summary;
        dimension = {
          topicA: opts.topicA || 'proRussian',
          topicB: opts.topicB || 'proUkrainian',
          percentA: ai.percentA,
          percentB: ai.percentB,
        };
        if (opts.propKeywordsA && opts.propKeywordsB && typeof scorePoliticalDimension === 'function') {
          const pr = scorePoliticalDimension(text, opts.propKeywordsA, opts.propKeywordsB);
          propDimension = { topicA: opts.propTopicA || 'state narrative', topicB: opts.propTopicB || 'independent', percentA: pr.percentA, percentB: pr.percentB };
        }
      } catch (aiErr) {
        console.warn('AI check failed, using rule-based:', aiErr);
        const result = await analyzeVideo(data);
        sense = result.sense;
        emotions = result.emotions;
        propaganda = result.propaganda;
        summary = result.summary;
        if (result.politicsA != null && result.politicsB != null) {
          dimension = { topicA: opts.topicA || 'proRussian', topicB: opts.topicB || 'proUkrainian', percentA: result.politicsA, percentB: result.politicsB };
        } else if (opts.keywordsA && opts.keywordsB && typeof scorePoliticalDimension === 'function') {
          const r = scorePoliticalDimension(text, opts.keywordsA, opts.keywordsB);
          dimension = { topicA: opts.topicA || 'proRussian', topicB: opts.topicB || 'proUkrainian', percentA: r.percentA, percentB: r.percentB };
        }
        if (opts.propKeywordsA && opts.propKeywordsB && typeof scorePoliticalDimension === 'function') {
          const pr = scorePoliticalDimension(text, opts.propKeywordsA, opts.propKeywordsB);
          propDimension = { topicA: opts.propTopicA || 'state narrative', topicB: opts.propTopicB || 'independent', percentA: pr.percentA, percentB: pr.percentB };
        }
      }
    } else {
      const result = await analyzeVideo(data);
      sense = result.sense;
      emotions = result.emotions;
      propaganda = result.propaganda;
      summary = result.summary;
      if (result.politicsA != null && result.politicsB != null) {
        dimension = { topicA: opts.topicA || 'proRussian', topicB: opts.topicB || 'proUkrainian', percentA: result.politicsA, percentB: result.politicsB };
      } else if (opts.keywordsA && opts.keywordsB && typeof scorePoliticalDimension === 'function') {
        const r = scorePoliticalDimension(text, opts.keywordsA, opts.keywordsB);
        dimension = { topicA: opts.topicA || 'proRussian', topicB: opts.topicB || 'proUkrainian', percentA: r.percentA, percentB: r.percentB };
      }
      if (opts.propKeywordsA && opts.propKeywordsB && typeof scorePoliticalDimension === 'function') {
        const pr = scorePoliticalDimension(text, opts.propKeywordsA, opts.propKeywordsB);
        propDimension = { topicA: opts.propTopicA || 'state narrative', topicB: opts.propTopicB || 'independent', percentA: pr.percentA, percentB: pr.percentB };
      }
    }
    let emotionsTouched = [];
    if (data.isShorts && typeof getEmotionsTouched === 'function') {
      const et = getEmotionsTouched(text);
      emotionsTouched = et.emotions || [];
    }
    showResults(sense, emotions, propaganda, summary, dimension, emotionsTouched, propDimension);
  } catch (e) {
    showResults(0, 0, 0, 'Analysis failed. Try again.', null, null, null);
  } finally {
    setLoading(false);
  }
}

function analyzeVideo(data) {
  return new Promise((resolve) => {
    const payload = { action: 'analyze', title: data.title, channel: data.channel, description: data.description };
    chrome.runtime.sendMessage(payload, (result) => {
      if (result && result.ok) resolve(result);
      else resolve({ sense: 50, emotions: 20, propaganda: 0, summary: '', politicsA: 50, politicsB: 50 });
    });
  });
}

document.getElementById('check-btn').addEventListener('click', runCheck);
document.getElementById('politics-marks-btn').addEventListener('click', runCheck);

document.getElementById('open-options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

let markedVideoIds = [];

document.getElementById('feed-make').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  if (!tab?.id || !isYouTubeFeed(tab)) return;
  const threshold = Math.max(1, Math.min(100, parseInt(document.getElementById('feed-threshold').value, 10) || 30));
  const statusEl = document.getElementById('feed-status');
  const notIntBtn = document.getElementById('feed-not-interested');
  statusEl.textContent = 'Scanning…';
  notIntBtn.disabled = true;
  markedVideoIds = [];
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { action: 'getVisibleVideos' });
    if (!res?.ok || !Array.isArray(res.videos)) {
      statusEl.textContent = 'Could not get videos. Try refreshing the page.';
      return;
    }
    const opts = await chrome.storage.sync.get(['topicA', 'topicB', 'keywordsA', 'keywordsB']);
    const keywordsA = opts.keywordsA || 'russia, putin, kremlin';
    const keywordsB = opts.keywordsB || 'ukraine, zelensky, kyiv';
    for (const v of res.videos) {
      const text = [v.title, v.channel].filter(Boolean).join(' ');
      const r = scorePoliticalDimension(text, keywordsA, keywordsB);
      if (r.percentA >= threshold || r.percentB >= threshold) markedVideoIds.push(v.videoId);
    }
    notIntBtn.disabled = markedVideoIds.length === 0;
    statusEl.textContent = markedVideoIds.length + ' video(s) marked above ' + threshold + '%. Click "Not interested" to apply.';
  } catch (e) {
    statusEl.textContent = 'Error: ' + (e.message || 'reload the page and try again.');
  }
});

document.getElementById('feed-not-interested').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  if (!tab?.id || markedVideoIds.length === 0) return;
  const statusEl = document.getElementById('feed-status');
  statusEl.textContent = 'Clicking…';
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { action: 'clickNotInterested', videoIds: markedVideoIds });
    if (res?.ok) {
      statusEl.textContent = 'Done: ' + (res.done || 0) + ' clicked, ' + (res.failed || 0) + ' failed.';
      markedVideoIds = [];
      document.getElementById('feed-not-interested').disabled = true;
    } else {
      statusEl.textContent = 'Error: ' + (res?.error || 'unknown');
    }
  } catch (e) {
    statusEl.textContent = 'Error: ' + (e.message || 'reload and try again.');
  }
});

(async () => {
  const tab = await getCurrentTab();
  const data = await fetchVideoData();
  const onFeed = tab && isYouTubeFeed(tab);
  if (data && (data.title || data.url)) {
    noVideoEl.classList.add('hidden');
    document.getElementById('feed-panel').classList.add('hidden');
    videoPanelEl.classList.remove('hidden');
    videoTitleEl.textContent = data.title || 'Untitled';
    videoChannelEl.textContent = data.channel ? `Channel: ${data.channel}` : '';
    const badge = document.getElementById('shorts-badge');
    const btn = document.getElementById('check-btn');
    if (data.isShorts) {
      badge.classList.remove('hidden');
      btn.textContent = 'Check this Short';
    } else {
      badge.classList.add('hidden');
      btn.textContent = 'Check this video';
    }
  } else if (onFeed) {
    noVideoEl.classList.add('hidden');
    videoPanelEl.classList.add('hidden');
    document.getElementById('feed-panel').classList.remove('hidden');
    const opts = await chrome.storage.sync.get(['topicA', 'topicB']);
    document.getElementById('feed-topics').textContent = 'Using saved: ' + (opts.topicA || 'Topic A') + ' vs ' + (opts.topicB || 'Topic B');
  } else {
    noVideoEl.classList.remove('hidden');
    videoPanelEl.classList.add('hidden');
    document.getElementById('feed-panel').classList.add('hidden');
  }
})();
