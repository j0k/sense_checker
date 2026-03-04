/**
 * Shared Sense/Emotions/Propaganda analyzer. Used by popup and background.
 */
function runSenseAnalysis(text) {
  const analyzer = new SenseEmotionsPropagandaAnalyzer();
  return analyzer.analyze(text || '');
}

class SenseEmotionsPropagandaAnalyzer {
  constructor() {
    this.emotionWords = {
      high: ['love', 'hate', 'angry', 'fear', 'joy', 'cry', 'rage', 'outrage', 'devastating', 'incredible', 'shocking', 'heartbreaking', 'amazing', 'terrifying', 'hopeful', 'desperate', 'jaw-dropping', 'goosebumps', 'wild', 'powerful'],
      medium: ['happy', 'sad', 'excited', 'worried', 'proud', 'upset', 'calm', 'nervous', 'surprised', 'disappointed', 'frustrated', 'relieved', 'insane', 'crazy', 'best', 'worst', 'great', 'bad', 'fun', 'hard'],
    };
    this.propagandaPhrases = [
      'they don\'t want you to know', 'wake up', 'sheeple', 'mainstream media', 'fake news', 'wake up people', 'open your eyes', 'they\'re lying', 'don\'t trust', 'brainwash', 'truth they hide',
    ];
    this.propagandaWords = [
      'conspiracy', 'elite', 'globalist', 'agenda', 'narrative', 'cover-up', 'propaganda', 'censored', 'manipulation', 'biased', 'coverup',
    ];
  }

  analyze(text) {
    const lower = (text || '').toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const sense = this.scoreSense(words, lower);
    const emotions = this.scoreEmotions(lower);
    const propaganda = this.scorePropaganda(lower);
    const summary = this.buildSummary(sense, emotions, propaganda);
    return { sense, emotions, propaganda, summary };
  }

  scoreSense(words, fullText) {
    if (words.length < 2) return 40;
    const hasQuestion = /\?/.test(fullText);
    const allCapsRatio = (fullText.match(/\b[A-Z]{2,}\b/g) || []).length / Math.max(words.length, 1);
    const exclamations = (fullText.match(/!+/g) || []).length;
    const hasClickbait = /\b(you won't believe|secret|exposed|they don't want|never expected|insane|crazy|shocking|ultimate|everything you need)\b/i.test(fullText);
    let score = 65;
    if (words.length >= 10) score += 5;
    if (hasQuestion) score += 5;
    if (allCapsRatio > 0.2) score -= 20;
    else if (allCapsRatio > 0.1) score -= 10;
    if (exclamations > 3) score -= 15;
    else if (exclamations > 1) score -= 5;
    if (hasClickbait) score -= 15;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  scoreEmotions(text) {
    let count = 0;
    for (const w of this.emotionWords.high) {
      if (text.includes(w)) count += 3;
    }
    for (const w of this.emotionWords.medium) {
      if (text.includes(w)) count += 1;
    }
    const score = Math.min(100, 15 + count * 6);
    return Math.round(score);
  }

  scorePropaganda(text) {
    let count = 0;
    for (const phrase of this.propagandaPhrases) {
      if (text.includes(phrase)) count += 2;
    }
    for (const w of this.propagandaWords) {
      const re = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      if (re.test(text)) count += 1;
    }
    const score = Math.min(100, count * 12);
    return Math.round(score);
  }

  buildSummary(sense, emotions, propaganda) {
    const parts = [];
    if (sense >= 70) parts.push('Content appears relatively factual and coherent.');
    else if (sense < 50) parts.push('Title/description may use sensational or unclear framing.');
    if (emotions > 60) parts.push('Emotionally charged language detected.');
    if (propaganda > 40) parts.push('Some phrases often associated with propaganda or manipulation were found—consider multiple sources.');
    return parts.length ? parts.join(' ') : 'No strong signals. Consider watching with a critical eye.';
  }
}
