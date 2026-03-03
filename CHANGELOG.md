# Changelog

All notable changes to Sense Checker are documented here.

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
