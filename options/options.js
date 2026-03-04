const DEFAULTS = {
  topicA: 'proRussian',
  topicB: 'proUkrainian',
  keywordsA: 'russia, putin, kremlin, moscow, donbass, russian army, russian forces, novorossiya',
  keywordsB: 'ukraine, zelensky, kyiv, ukrainian army, ukrainian forces, ukrainian, donbas',
  propTopicA: 'state narrative',
  propTopicB: 'independent',
  propKeywordsA: 'official, state, government, approved, mainstream narrative',
  propKeywordsB: 'independent, critical, alternative, fact-check, expose',
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
  const keys = ['topicA', 'topicB', 'keywordsA', 'keywordsB', 'propTopicA', 'propTopicB', 'propKeywordsA', 'propKeywordsB', 'useAI', 'aiProvider', 'apiKey', 'customBaseUrl'];
  const o = await chrome.storage.sync.get(keys);
  el('topicA').value = o.topicA ?? DEFAULTS.topicA;
  el('topicB').value = o.topicB ?? DEFAULTS.topicB;
  el('keywordsA').value = o.keywordsA ?? DEFAULTS.keywordsA;
  el('keywordsB').value = o.keywordsB ?? DEFAULTS.keywordsB;
  el('propTopicA').value = o.propTopicA ?? DEFAULTS.propTopicA;
  el('propTopicB').value = o.propTopicB ?? DEFAULTS.propTopicB;
  el('propKeywordsA').value = o.propKeywordsA ?? DEFAULTS.propKeywordsA;
  el('propKeywordsB').value = o.propKeywordsB ?? DEFAULTS.propKeywordsB;
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
  el('propTopicA').value = DEFAULTS.propTopicA;
  el('propTopicB').value = DEFAULTS.propTopicB;
  el('propKeywordsA').value = DEFAULTS.propKeywordsA;
  el('propKeywordsB').value = DEFAULTS.propKeywordsB;
  showStatus('Reset to defaults (political + propaganda).');
}

async function save() {
  const topicA = el('topicA').value.trim() || DEFAULTS.topicA;
  const topicB = el('topicB').value.trim() || DEFAULTS.topicB;
  const keywordsA = el('keywordsA').value.trim() || DEFAULTS.keywordsA;
  const keywordsB = el('keywordsB').value.trim() || DEFAULTS.keywordsB;
  const propTopicA = el('propTopicA').value.trim() || DEFAULTS.propTopicA;
  const propTopicB = el('propTopicB').value.trim() || DEFAULTS.propTopicB;
  const propKeywordsA = el('propKeywordsA').value.trim() || DEFAULTS.propKeywordsA;
  const propKeywordsB = el('propKeywordsB').value.trim() || DEFAULTS.propKeywordsB;
  const useAI = el('useAI').checked;
  const aiProvider = el('aiProvider').value;
  const apiKey = el('apiKey').value.trim();
  const customBaseUrl = el('customBaseUrl').value.trim();
  await chrome.storage.sync.set({
    topicA, topicB, keywordsA, keywordsB,
    propTopicA, propTopicB, propKeywordsA, propKeywordsB,
    useAI, aiProvider, apiKey, customBaseUrl,
  });
  let msg = 'Saved. Political: ' + topicA + ' vs ' + topicB;
  if (propKeywordsA || propKeywordsB) msg += '. Propaganda: ' + propTopicA + ' vs ' + propTopicB;
  if (useAI && apiKey) msg += '. AI: ' + aiProvider + '.';
  showStatus(msg);
}

el('save').addEventListener('click', save);
el('defaults').addEventListener('click', setDefaults);
el('aiProvider').addEventListener('change', toggleCustomUrl);
load();
