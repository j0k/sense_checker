/**
 * Call an OpenAI-compatible chat API (OpenAI, DeepSeek, or custom) to analyze
 * video title/description for Sense, Emotions, Propaganda, and political dimension.
 * Returns { sense, emotions, propaganda, summary, percentA, percentB } or throws.
 */
const AI_PROVIDERS = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  custom: { baseUrl: '', model: 'gpt-4o-mini' },
};

function getAIEndpoint(provider, customBaseUrl) {
  const p = AI_PROVIDERS[provider] || AI_PROVIDERS.openai;
  let base = p.baseUrl;
  if (provider === 'custom' && customBaseUrl) {
    base = customBaseUrl.replace(/\/+$/, '');
  }
  return base + '/chat/completions';
}

function buildPrompt(text, topicA, topicB) {
  const dimension = topicA && topicB ? ` and where it stands between "${topicA}" (0-100) and "${topicB}" (0-100). percentA + percentB should equal 100.` : '';
  return `Analyze this YouTube video title and description. Reply with ONLY a valid JSON object, no other text.

Text to analyze:
---
${text.slice(0, 6000)}
---

Respond with exactly this structure (numbers 0-100, summary one short sentence):
{
  "sense": <number>,
  "emotions": <number>,
  "propaganda": <number>,
  "summary": "<one short sentence>",
  "percentA": <number>,
  "percentB": <number>
}
${topicA && topicB ? '' : 'Ignore percentA/percentB and set both to 50.'}
`;
}

function parseAIResponse(content) {
  const raw = (content || '').trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  const o = JSON.parse(jsonMatch[0]);
  const sense = Math.max(0, Math.min(100, Number(o.sense) || 50));
  const emotions = Math.max(0, Math.min(100, Number(o.emotions) || 50));
  const propaganda = Math.max(0, Math.min(100, Number(o.propaganda) || 0));
  const percentA = Math.max(0, Math.min(100, Number(o.percentA) || 50));
  const percentB = 100 - percentA;
  return {
    sense,
    emotions,
    propaganda,
    summary: String(o.summary || '').trim() || 'AI analysis completed.',
    percentA,
    percentB,
  };
}

async function callAIChecker(text, opts) {
  const { apiKey, provider, customBaseUrl, topicA, topicB } = opts || {};
  if (!apiKey || !provider) throw new Error('AI not configured');
  const url = getAIEndpoint(provider, customBaseUrl);
  const p = AI_PROVIDERS[provider] || AI_PROVIDERS.openai;
  const model = provider === 'custom' ? (opts.customModel || 'gpt-4o-mini') : p.model;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a concise analyst. Reply only with valid JSON, no markdown or explanation.',
        },
        {
          role: 'user',
          content: buildPrompt(text, topicA, topicB),
        },
      ],
      max_tokens: 400,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('AI API error: ' + (res.status + ' ' + err.slice(0, 200)));
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');
  return parseAIResponse(content);
}
