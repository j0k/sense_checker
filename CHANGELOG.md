# Changelog

All notable changes to Sense Checker are documented here.

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
