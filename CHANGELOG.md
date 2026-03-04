# Changelog

All notable changes to Sense Checker are documented here.

## [1.4.0] - 2026-03-04

### Added

- **Sense–politics embedding (t-SNE-like)** — New `shared/sense-politics-embedding.js`: extracts a high-dimensional feature vector from text (length, caps, emotion/propaganda/keyword counts, etc.), compares it to anchor vectors (neutral, emotional, topic A, topic B, propaganda) via Gaussian similarity, and projects to 2D (sense axis, politics axis). Sense and political dimension scores from this pipeline are used in the popup and in the “Sense Analyze” overlay when using the rule-based analyzer.

### Technical

- Background loads `sense-politics-embedding.js`, runs embedding in addition to `runSenseAnalysis`, and returns embedding-based sense and politicsA/politicsB. Popup “Check this video” now requests analysis from the background so it receives the same pipeline.

---

## [1.3.0] - 2026-03-04

### Added

- **Sense Analyze in three-dot menu** — “Sense Analyze” is now added as a menu item inside the video’s three-dot dropdown (after “Report”), in addition to the existing button in the action row on watch pages. Works on feed, search, and watch; uses the clicked video card or current page data.

---

## [1.1.0] - 2026-03-04

### Added

- **Mark political videos on feed** — When you’re on the YouTube home feed or search results (not on a watch page), the popup shows a **“Mark political videos”** panel. You choose a **threshold** (e.g. mark if either political topic ≥ 30%). **Make** scans the visible videos using your saved political dimension (Topic A vs Topic B and keywords) and reports how many are above the threshold. **Not interested** then clicks YouTube’s “Not interested” on each of those videos. Two steps: first see which videos are marked, then apply “Not interested” in one go. Uses your saved topics (e.g. proRussian vs proUkrainian); configure them in Settings.

### Technical

- Content script: `getVisibleVideos` (ytd-video-renderer, ytd-rich-item-renderer, etc.) and `clickNotInterested(videoIds)` (opens menu, clicks “Not interested”). Messaging from popup via `chrome.tabs.sendMessage`.

---

## [1.0.0] - 2026-03-04

**Final release.** First stable version.

### Added

- Chrome extension (Manifest V3) for YouTube videos and Shorts
- **Sense, Emotions & Propaganda** — score current video (title, channel, description)
- **Political dimension** — two topics (e.g. proRussian vs proUkrainian), keyword-based scoring and optional AI
- **AI checker (optional)** — OpenAI, DeepSeek, or custom OpenAI-compatible API; fallback to rule-based
- **YouTube Shorts** — detect Shorts URLs, “Check this Short”, and show **emotions touched** (fear, joy, anger, sadness, surprise, etc.)
- **Analyze list** — paste multiple YouTube URLs, get political dimension table
- Options page: political topics, keywords, AI provider and API key
- Screenshots in `screen/` folder

### Technical

- Popup, content script, shared modules (political-dimension, emotion-tags, ai-checker)
- Icons: `npm run generate-icons`

---

## [0.1.0] - 2026-03-04

Initial development (untested, written in Cursor). Superseded by 1.0.0.
