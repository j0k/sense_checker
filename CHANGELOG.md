# Changelog

All notable changes to Sense Checker are documented here.

## [0.1.0] - 2026-03-04

**Note:** v0.1 is untested. This version was written in Cursor today.

### Added

- Chrome extension (Manifest V3) for YouTube video and Shorts analysis
- **Sense, Emotions & Propaganda** checks on current video (title, channel, description)
- **Political dimension:** two configurable topics (e.g. proRussian vs proUkrainian) with keyword-based scoring
- **AI checker (optional):** OpenAI, DeepSeek, or any OpenAI-compatible API for analysis; fallback to rule-based
- **YouTube Shorts** support: analyze Shorts and see which emotions the content touches (fear, joy, anger, sadness, etc.)
- **Analyze list:** paste multiple YouTube URLs and get political dimension scores per video
- Options page: political topics, keywords, AI provider and API key
- Screenshots in `screen/` folder

### Technical

- Popup UI, content script on YouTube, shared modules (political-dimension, emotion-tags, ai-checker)
- Icons generated via `npm run generate-icons`
