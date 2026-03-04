/**
 * Sense–politics embedding: t-SNE-like pipeline.
 * 1) Extract a high-dimensional feature vector from text.
 * 2) Compare to anchor vectors (neutral, emotional, topic A, topic B, propaganda).
 * 3) Project to 2D (sense axis, politics axis) via similarity-weighted combination.
 * Use for richer sense and political-dimension scoring and optional 2D visualization.
 */

(function (global) {
  'use strict';

  const EMOTION_HIGH = ['love', 'hate', 'angry', 'fear', 'joy', 'rage', 'outrage', 'devastating', 'shocking', 'heartbreaking', 'terrifying', 'desperate', 'jaw-dropping', 'powerful'];
  const EMOTION_MED = ['happy', 'sad', 'excited', 'worried', 'proud', 'upset', 'surprised', 'frustrated', 'insane', 'crazy', 'best', 'worst', 'great', 'bad'];
  const PROPAGANDA_PHRASES = ['they don\'t want you to know', 'wake up', 'sheeple', 'mainstream media', 'fake news', 'open your eyes', 'they\'re lying', 'don\'t trust', 'brainwash', 'truth they hide'];
  const PROPAGANDA_WORDS = ['conspiracy', 'elite', 'globalist', 'agenda', 'narrative', 'cover-up', 'propaganda', 'censored', 'manipulation', 'biased'];
  const CLICKBAIT_PATTERNS = ['you won\'t believe', 'secret', 'exposed', 'they don\'t want', 'never expected', 'insane', 'shocking', 'ultimate', 'everything you need'];

  /**
   * Feature indices: [0] wordCountNorm, [1] capsRatio, [2] exclamations, [3] hasQuestion,
   * [4] clickbaitScore, [5] emotionHigh, [6] emotionMed, [7] propagandaPhrase, [8] propagandaWord,
   * [9] keywordACount, [10] keywordBCount, [11] lengthNorm
   */
  const N_FEATURES = 12;

  function normalizeKeywordList(list) {
    if (!list) return [];
    const arr = typeof list === 'string' ? list.split(/[\s,]+/) : list;
    return arr.map((k) => k.trim().toLowerCase()).filter((k) => k.length >= 2);
  }

  function countMatches(text, keywords) {
    const lower = text.toLowerCase();
    let n = 0;
    for (const k of keywords) {
      const re = new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      n += (lower.match(re) || []).length;
    }
    return n;
  }

  /**
   * Extract a fixed-length feature vector from text.
   * @param {string} text
   * @param {{ keywordsA?: string|string[], keywordsB?: string|string[] }} [options]
   * @returns {number[]}
   */
  function extractFeatures(text, options) {
    const t = text || '';
    const words = t.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const lower = t.toLowerCase();

    const capsMatches = t.match(/\b[A-Z]{2,}\b/g);
    const capsRatio = wordCount > 0 ? (capsMatches ? capsMatches.length : 0) / wordCount : 0;
    const exclamations = (t.match(/!+/g) || []).length;
    const hasQuestion = /\?/.test(t) ? 1 : 0;
    let clickbaitScore = 0;
    for (const p of CLICKBAIT_PATTERNS) {
      if (new RegExp('\\b' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(t)) clickbaitScore += 1;
    }
    clickbaitScore = Math.min(1, clickbaitScore / 3);

    let emotionHigh = 0;
    for (const w of EMOTION_HIGH) if (lower.includes(w)) emotionHigh += 1;
    emotionHigh = Math.min(1, emotionHigh / 4);
    let emotionMed = 0;
    for (const w of EMOTION_MED) if (lower.includes(w)) emotionMed += 1;
    emotionMed = Math.min(1, emotionMed / 5);

    let propagandaPhrase = 0;
    for (const p of PROPAGANDA_PHRASES) if (lower.includes(p)) propagandaPhrase += 1;
    propagandaPhrase = Math.min(1, propagandaPhrase / 2);
    let propagandaWord = 0;
    for (const w of PROPAGANDA_WORDS) {
      const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      if (re.test(t)) propagandaWord += 1;
    }
    propagandaWord = Math.min(1, propagandaWord / 3);

    const kwA = normalizeKeywordList(options && options.keywordsA);
    const kwB = normalizeKeywordList(options && options.keywordsB);
    const countA = kwA.length ? countMatches(t, kwA) : 0;
    const countB = kwB.length ? countMatches(t, kwB) : 0;
    const totalKw = countA + countB;
    const keywordANorm = totalKw > 0 ? countA / (totalKw + 1) : 0.5;
    const keywordBNorm = totalKw > 0 ? countB / (totalKw + 1) : 0.5;

    const wordCountNorm = Math.min(1, wordCount / 50);
    const lengthNorm = Math.min(1, (t.length || 0) / 500);

    return [
      wordCountNorm,
      Math.min(1, capsRatio * 5),
      Math.min(1, exclamations / 5),
      hasQuestion,
      clickbaitScore,
      emotionHigh,
      emotionMed,
      propagandaPhrase,
      propagandaWord,
      keywordANorm,
      keywordBNorm,
      lengthNorm,
    ];
  }

  /**
   * Anchor vectors in feature space (hand-tuned prototypes).
   * Each row = one anchor; columns = same order as extractFeatures.
   * neutral, emotional, topicA, topicB, propaganda
   */
  const ANCHORS = [
    [0.4, 0, 0, 0.2, 0, 0, 0.1, 0, 0, 0.5, 0.5, 0.3],   // neutral
    [0.2, 0.2, 0.6, 0, 0.3, 0.8, 0.6, 0, 0, 0.5, 0.5, 0.2], // emotional
    [0.3, 0.1, 0.2, 0, 0.2, 0.2, 0.2, 0.3, 0.2, 0.9, 0.1, 0.2], // topic A
    [0.3, 0.1, 0.2, 0, 0.2, 0.2, 0.2, 0.3, 0.2, 0.1, 0.9, 0.2], // topic B
    [0.2, 0.3, 0.4, 0, 0.6, 0.3, 0.4, 0.8, 0.7, 0.5, 0.5, 0.2], // propaganda
  ];

  function squaredDistance(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
    return s;
  }

  /**
   * Gaussian kernel similarity: k(v,a) = exp(-||v-a||^2 / (2*sigma^2)).
   * Larger sigma => smoother; we use sigma so that typical distances give 0.1–0.9.
   */
  function gaussianSimilarity(v, a, sigma) {
    const d2 = squaredDistance(v, a);
    return Math.exp(-d2 / (2 * (sigma * sigma)));
  }

  /**
   * Project feature vector to 2D and derive sense + politics scores.
   * Uses similarities to anchors and maps to (x, y): x = politics axis (-1..1), y = sense (0..1).
   * @param {number[]} features
   * @param {{ sigma?: number }} [opts]
   * @returns {{ x: number, y: number, sense: number, politicsA: number, politicsB: number, similarities: number[] }}
   */
  function projectTo2D(features, opts) {
    const sigma = (opts && opts.sigma) != null ? opts.sigma : 0.8;
    const sim = ANCHORS.map((a) => gaussianSimilarity(features, a, sigma));

    const neutral = sim[0];
    const emotional = sim[1];
    const topicA = sim[2];
    const topicB = sim[3];
    const propaganda = sim[4];

    // Sense: high when close to neutral, low when emotional or propaganda-heavy
    const senseRaw = neutral * (1 - 0.4 * emotional) * (1 - 0.5 * propaganda);
    const y = Math.max(0, Math.min(1, senseRaw));
    const sense = Math.round(y * 100);

    // Politics: x in [-1, 1]; positive = more B, negative = more A
    const politicsX = topicB - topicA;
    const x = Math.max(-1, Math.min(1, politicsX));
    const total = topicA + topicB;
    let politicsA = 50;
    let politicsB = 50;
    if (total > 0) {
      politicsA = Math.round((topicA / total) * 100);
      politicsB = 100 - politicsA;
    }

    return { x, y, sense, politicsA, politicsB, similarities: sim };
  }

  /**
   * Full pipeline: text -> features -> 2D projection and scores.
   * @param {string} text
   * @param {{ keywordsA?: string|string[], keywordsB?: string|string[], sigma?: number }} [options]
   * @returns {{ sense: number, politicsA: number, politicsB: number, x: number, y: number, features: number[] }}
   */
  function computeSensePoliticsEmbedding(text, options) {
    const features = extractFeatures(text, options);
    const proj = projectTo2D(features, options);
    return {
      sense: proj.sense,
      politicsA: proj.politicsA,
      politicsB: proj.politicsB,
      x: proj.x,
      y: proj.y,
      features,
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { extractFeatures, projectTo2D, computeSensePoliticsEmbedding };
  } else {
    global.SensePoliticsEmbedding = {
      extractFeatures,
      projectTo2D,
      computeSensePoliticsEmbedding,
    };
  }
})(typeof self !== 'undefined' ? self : this);
