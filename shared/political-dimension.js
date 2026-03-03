/**
 * Scores text on a political dimension defined by two keyword sets.
 * Returns { scoreA, scoreB, percentA, percentB } where percentA + percentB = 100.
 * percentA = how much the text aligns with topic A (e.g. proRussian), percentB with topic B (e.g. proUkrainian).
 */
function scorePoliticalDimension(text, keywordsA, keywordsB) {
  const lower = (text || '').toLowerCase();
  const norm = (list) => (list || []).map((k) => k.trim().toLowerCase()).filter(Boolean);

  const listA = norm(typeof keywordsA === 'string' ? keywordsA.split(/[\s,]+/) : keywordsA);
  const listB = norm(typeof keywordsB === 'string' ? keywordsB.split(/[\s,]+/) : keywordsB);

  let countA = 0;
  let countB = 0;
  for (const k of listA) {
    if (k.length < 2) continue;
    const regex = new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
    countA += (lower.match(regex) || []).length;
  }
  for (const k of listB) {
    if (k.length < 2) continue;
    const regex = new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
    countB += (lower.match(regex) || []).length;
  }

  const total = countA + countB;
  let percentA = 50;
  let percentB = 50;
  if (total > 0) {
    percentA = Math.round((countA / total) * 100);
    percentB = 100 - percentA;
  }
  return { countA, countB, percentA, percentB };
}
