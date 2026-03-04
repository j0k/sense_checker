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

// Parse video titles from pasted YouTube list (mixed format: title, channel, views, etc.)
function parseTitlesFromPaste(text) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const titles = [];
  const skipLine = (s) => !s || s.length < 5 || /^\d+:\d+$/.test(s) || /^\d+[KkMm]?\s*views?/i.test(s) || /^\d+\s*(days?|hours?|years?|months?)\s*ago/i.test(s) || s === 'New' || s === 'Dubbed' || /^[\s•]+$/.test(s);
  for (const block of blocks) {
    const lines = block.split(/\n/).map((s) => s.trim()).filter(Boolean);
    let title = null;
    for (const line of lines) {
      if (skipLine(line)) continue;
      title = line;
      break;
    }
    if (title) titles.push(title);
  }
  if (titles.length > 0) return titles;
  const onePerLine = text.split(/\n/).map((s) => s.trim()).filter((s) => s.length >= 5 && !/^\d+:\d+$/.test(s) && !/^\d+[KkMm]?\s*views?/i.test(s));
  return onePerLine;
}

const POLITICAL_KEYWORDS = [
  'war', 'война', 'iran', 'иран', 'israel', 'израиль', 'putin', 'путин', 'trump', 'lavrov', 'лавров',
  'nuclear', 'missile', 'ракет', 'бомбардиров', 'gas', 'газ', 'migration', 'миграц', 'жириновский',
  'zhirinovsky', 'kim jong', 'nato', 'нато', 'ukraine', 'украин', 'russia', 'росси', 'санкц', 'sanction',
  'ww3', 'wwiii', 'threat', 'угроз', 'centcom', 'operation', 'операц', 'f-35', 'tomahawk', 'ballistic',
  'дипломат', 'diplomat', 'мвд', 'безопасност', 'security', 'террорист', 'terror',
];

function scorePolitic(text) {
  const lower = (text || '').toLowerCase();
  let count = 0;
  for (const kw of POLITICAL_KEYWORDS) {
    if (lower.includes(kw)) count++;
  }
  return Math.min(1, Math.round((count * 0.25) * 100) / 100);
}

function scoreTitleForJson(title, keywordsA, keywordsB) {
  const r = scorePoliticalDimension(title, keywordsA, keywordsB);
  const pro_Russian = Math.round((r.percentA / 100) * 100) / 100;
  const pro_Ukranian = Math.round((r.percentB / 100) * 100) / 100;
  const fromDimension = Math.max(pro_Russian, pro_Ukranian);
  const fromPolitical = scorePolitic(title);
  const politic = Math.round(Math.max(fromDimension, fromPolitical) * 100) / 100;
  return { politic, pro_Russian, pro_Ukranian };
}

document.getElementById('score-json').addEventListener('click', async () => {
  const paste = document.getElementById('list-paste').value.trim();
  if (!paste) {
    document.getElementById('json-status').textContent = 'Paste a list first.';
    return;
  }
  const titles = parseTitlesFromPaste(paste);
  if (titles.length === 0) {
    document.getElementById('json-status').textContent = 'No titles parsed. Use one title per line or blocks separated by blank lines.';
    return;
  }
  const opts = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  const keywordsA = opts.keywordsA || DEFAULTS.keywordsA;
  const keywordsB = opts.keywordsB || DEFAULTS.keywordsB;
  document.getElementById('json-status').textContent = 'Scoring ' + titles.length + ' titles…';
  const videos = titles.map((title) => {
    const s = scoreTitleForJson(title, keywordsA, keywordsB);
    return { title, politic: s.politic, pro_Russian: s.pro_Russian, pro_Ukranian: s.pro_Ukranian };
  });
  const json = JSON.stringify({ videos }, null, 2);
  document.getElementById('json-output').value = json;
  document.getElementById('json-status').textContent = 'Done. ' + titles.length + ' videos scored.';
  document.getElementById('copy-json').classList.remove('hidden');
});

document.getElementById('copy-json').addEventListener('click', async () => {
  const json = document.getElementById('json-output').value;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(json);
    } else {
      document.getElementById('json-output').select();
      document.execCommand('copy');
    }
    document.getElementById('json-status').textContent = 'JSON copied to clipboard.';
  } catch (_) {
    document.getElementById('json-status').textContent = 'Select and copy the JSON manually.';
  }
});
