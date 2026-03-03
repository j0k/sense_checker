/**
 * Detect which emotions the text touches (fear, joy, anger, etc.) from keywords.
 * Used for YouTube Shorts emotion-focused analysis.
 */
const EMOTION_KEYWORDS = {
  fear: ['fear', 'scared', 'afraid', 'terror', 'panic', 'horror', 'anxious', 'worry', 'worried', 'dread', 'terrifying', 'nightmare', 'creepy'],
  joy: ['happy', 'joy', 'love', 'excited', 'amazing', 'fun', 'laugh', 'smile', 'hope', 'hopeful', 'wonderful', 'great', 'best', 'awesome', 'celebrate', 'joyful'],
  anger: ['angry', 'rage', 'hate', 'furious', 'outrage', 'mad', 'frustration', 'frustrated', 'annoyed', 'furious', 'rage', 'hate'],
  sadness: ['sad', 'cry', 'grief', 'loss', 'heartbreaking', 'depressing', 'miserable', 'tears', 'miss', 'gone', 'tragic', 'devastating'],
  surprise: ['surprise', 'shocked', 'unexpected', 'wow', 'incredible', 'unbelievable', 'mind-blowing', 'astonishing', 'never expected'],
  disgust: ['disgust', 'gross', 'repulsive', 'horrible', 'revolting', 'sickening'],
  trust: ['trust', 'honest', 'reliable', 'truth', 'real', 'genuine', 'sincere'],
  anticipation: ['anticipation', 'expect', 'waiting', 'curious', 'excited for', 'can\'t wait', 'looking forward'],
};

function getEmotionsTouched(text) {
  const lower = (text || '').toLowerCase();
  const scores = {};
  const touched = [];
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      const regex = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      count += (lower.match(regex) || []).length;
    }
    scores[emotion] = count;
    if (count > 0) touched.push(emotion);
  }
  const labels = touched.map((e) => e.charAt(0).toUpperCase() + e.slice(1));
  return { emotions: labels, touched, scores };
}
