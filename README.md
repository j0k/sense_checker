# Sense Checker

Chrome extension that checks **Sense**, **Emotions**, and **Propaganda** for YouTube videos. Use it to get a quick read on whether a video’s title and description look factual, emotionally charged, or propagandistic.

## Features

- **Sense** – Coherence and factual framing (e.g. clear vs sensational or unclear)
- **Emotions** – How much emotionally charged language is used
- **Propaganda** – Presence of phrases often associated with manipulation or one-sided messaging

Analysis is based on the current video’s **title**, **channel name**, and **description** (no video or audio processing).

- **Political dimension** – Define two topics (e.g. **proRussian** vs **proUkrainian**) and optional keyword lists. The extension scores each video on this axis and shows a **wind rose** (compass-style) plus a bar. See [Political_dimension.md](Political_dimension.md) for topics relevant today and the wind rose idea.

- **AI checker (optional)** – Use **OpenAI** (GPT), **DeepSeek**, or any **OpenAI-compatible** API as the analyzer. In Settings, enable “Use AI for analysis”, pick a provider, and add your API key. Analysis then uses the AI for Sense, Emotions, Propaganda, and the political dimension; if the API fails or is not configured, the built-in rule-based checker is used.

## Screenshots

Screenshots of the extension popup are in the [`screen/`](screen/) folder.

**When you’re not on a YouTube video** — the popup asks you to open a video page:

![Popup when not on a video](screen/popup-no-video.png)

**On a YouTube video** — the popup shows the video title and a “Check this video” button:

![Popup on a video, before running check](screen/popup-before-check.png)

**After clicking Check** — Sense, Emotions, and Propaganda scores plus a short summary:

![Popup with results](screen/popup-with-results.png)

## Installation

1. **Clone or download** this repo.

2. **Icons (optional)**  
   Icons are already generated in `icons/`. To regenerate:
   ```bash
   npm install
   npm run generate-icons
   ```

3. **Load the extension in Chrome**
   - Open `chrome://extensions/`
   - Turn on **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `sense_checker` folder (the one that contains `manifest.json`)

4. **Use it**
   - Go to any YouTube watch page (`youtube.com/watch?v=...`)
   - Click the Sense Checker icon in the toolbar
   - Click **Check this video** to see Sense, Emotions, and Propaganda scores and a short summary
   - **Settings (political topics):** click “Settings (political topics)” in the popup to set two labels (e.g. **proRussian** and **proUkrainian**) and comma-separated keywords for each. The analysis then shows a **wind rose** (W↔E axis) and a bar for your topic pair.
   - **Analyze a list:** open the options page and use “Analyze a list of video URLs” to paste multiple YouTube URLs (one per line) and get a table of scores for each video on your political dimension.
   - **AI checker:** in Settings, under “AI checker”, enable “Use AI for analysis”, choose **OpenAI**, **DeepSeek**, or **Custom** (and set the API base URL), and enter your API key. The extension will use the AI for “Check this video”; on API error it falls back to the built-in checker.

## Project structure

```
sense_checker/
├── Political_dimension.md   # Political topics (actual today) and wind rose
├── manifest.json       # Extension manifest (Manifest V3)
├── popup/
│   ├── popup.html      # Popup UI
│   ├── popup.css       # Styles
│   └── popup.js        # Logic + analyzer
├── content/
│   └── content.js      # Runs on YouTube (optional hooks)
├── options/            # Political dimension settings (proRussian / proUkrainian, keywords)
│   ├── options.html
│   ├── options.css
│   └── options.js
├── list/               # Analyze multiple video URLs on the political dimension
│   ├── list.html
│   ├── list.css
│   └── list.js
├── shared/
│   ├── political-dimension.js  # Keyword-based scorer for two topics
│   └── ai-checker.js            # OpenAI/DeepSeek/custom API caller for analysis
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   └── icon48.png
├── screen/              # Screenshots for README
│   ├── popup-no-video.png
│   ├── popup-before-check.png
│   └── popup-with-results.png
├── scripts/
│   └── generate-icons.js
└── package.json
```

## License

MIT
