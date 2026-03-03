const DEFAULTS = {
  topicA: 'proRussian',
  topicB: 'proUkrainian',
  keywordsA: 'russia, putin, kremlin, moscow, donbass, russian army, russian forces, novorossiya',
  keywordsB: 'ukraine, zelensky, kyiv, ukrainian army, ukrainian forces, ukrainian, donbas',
  useAI: false,
  aiProvider: 'openai',
  apiKey: '',
  customBaseUrl: '',
};

function el(id) {
  return document.getElementById(id);
}

function showStatus(msg) {
  const s = el('status');
  s.textContent = msg;
}

async function load() {
  const keys = ['topicA', 'topicB', 'keywordsA', 'keywordsB', 'useAI', 'aiProvider', 'apiKey', 'customBaseUrl'];
  const o = await chrome.storage.sync.get(keys);
  el('topicA').value = o.topicA ?? DEFAULTS.topicA;
  el('topicB').value = o.topicB ?? DEFAULTS.topicB;
  el('keywordsA').value = o.keywordsA ?? DEFAULTS.keywordsA;
  el('keywordsB').value = o.keywordsB ?? DEFAULTS.keywordsB;
  el('useAI').checked = o.useAI ?? DEFAULTS.useAI;
  el('aiProvider').value = o.aiProvider ?? DEFAULTS.aiProvider;
  el('apiKey').value = o.apiKey ?? DEFAULTS.apiKey;
  el('customBaseUrl').value = o.customBaseUrl ?? DEFAULTS.customBaseUrl;
  toggleCustomUrl();
}
function toggleCustomUrl() {
  el('customUrlGroup').style.display = el('aiProvider').value === 'custom' ? 'block' : 'none';
}

function setDefaults() {
  el('topicA').value = DEFAULTS.topicA;
  el('topicB').value = DEFAULTS.topicB;
  el('keywordsA').value = DEFAULTS.keywordsA;
  el('keywordsB').value = DEFAULTS.keywordsB;
  showStatus('Reset to proRussian / proUkrainian defaults.');
}

async function save() {
  const topicA = el('topicA').value.trim() || DEFAULTS.topicA;
  const topicB = el('topicB').value.trim() || DEFAULTS.topicB;
  const keywordsA = el('keywordsA').value.trim() || DEFAULTS.keywordsA;
  const keywordsB = el('keywordsB').value.trim() || DEFAULTS.keywordsB;
  const useAI = el('useAI').checked;
  const aiProvider = el('aiProvider').value;
  const apiKey = el('apiKey').value.trim();
  const customBaseUrl = el('customBaseUrl').value.trim();
  await chrome.storage.sync.set({
    topicA, topicB, keywordsA, keywordsB,
    useAI, aiProvider, apiKey, customBaseUrl,
  });
  let msg = 'Saved. Topics: ' + topicA + ' vs ' + topicB;
  if (useAI && apiKey) msg += '. AI checker: ' + aiProvider + '.';
  showStatus(msg);
}

el('save').addEventListener('click', save);
el('defaults').addEventListener('click', setDefaults);
el('aiProvider').addEventListener('change', toggleCustomUrl);
load();
