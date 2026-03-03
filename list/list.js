const DEFAULTS = {
  topicA: 'proRussian',
  topicB: 'proUkrainian',
  keywordsA: 'russia, putin, kremlin, moscow, donbass, russian army, russian forces, novorossiya',
  keywordsB: 'ukraine, zelensky, kyiv, ukrainian army, ukrainian forces, ukrainian, donbas',
};

function parseYouTubeUrls(text) {
  const lines = text.split(/\n/).map((s) => s.trim()).filter(Boolean);
  const urls = [];
  for (const line of lines) {
    try {
      const u = new URL(line);
      if (u.hostname.replace(/^www\./, '') === 'youtube.com' && u.pathname === '/watch' && u.searchParams.has('v')) {
        urls.push(line);
      }
    } catch (_) {}
  }
  return urls;
}

function extractFromHtml(html) {
  let title = '';
  let description = '';
  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
  if (ogTitle) title = ogTitle[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'");
  const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
  if (ogDesc) description = ogDesc[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'");
  if (!title) {
    const titleTag = html.match(/<title>([^<]*)<\/title>/i);
    if (titleTag) title = titleTag[1].replace(/\s*-\s*YouTube\s*$/, '').trim();
  }
  return { title, description };
}

async function fetchVideoText(url) {
  const res = await fetch(url, { credentials: 'omit' });
  const html = await res.text();
  const { title, description } = extractFromHtml(html);
  return { url, title: title || 'Untitled', description };
}

document.getElementById('analyze').addEventListener('click', async () => {
  const urls = parseYouTubeUrls(document.getElementById('urls').value);
  if (urls.length === 0) {
    document.getElementById('error').textContent = 'Paste at least one valid YouTube watch URL (one per line).';
    document.getElementById('error').classList.remove('hidden');
    return;
  }

  const opts = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  const topicA = opts.topicA || DEFAULTS.topicA;
  const topicB = opts.topicB || DEFAULTS.topicB;
  const keywordsA = opts.keywordsA || DEFAULTS.keywordsA;
  const keywordsB = opts.keywordsB || DEFAULTS.keywordsB;

  document.getElementById('th-a').textContent = topicA;
  document.getElementById('th-b').textContent = topicB;
  document.getElementById('error').classList.add('hidden');
  document.getElementById('results').classList.add('hidden');
  document.getElementById('loading').classList.remove('hidden');
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';

  const rows = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      const { url, title, description } = await fetchVideoText(urls[i]);
      const text = [title, description].filter(Boolean).join(' ');
      const r = scorePoliticalDimension(text, keywordsA, keywordsB);
      rows.push({ url, title, percentA: r.percentA, percentB: r.percentB });
    } catch (e) {
      rows.push({ url: urls[i], title: 'Failed to fetch', percentA: 50, percentB: 50 });
    }
  }

  document.getElementById('loading').classList.add('hidden');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td class="video-title"><a href="' + row.url + '" target="_blank" rel="noopener">' + escapeHtml(row.title) + '</a></td>' +
      '<td>' + row.percentA + '%</td>' +
      '<td>' + row.percentB + '%</td>' +
      '<td><div class="score-bar"><span class="a" style="flex:' + row.percentA + '"></span><span class="b" style="flex:' + row.percentB + '"></span></div><span class="score-text">' + topicA + ' ↔ ' + topicB + '</span></td>';
    tbody.appendChild(tr);
  });
  document.getElementById('results').classList.remove('hidden');
});

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
