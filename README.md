# Productivity Clock — Chrome Extension

A lightweight, privacy-first Chrome extension for tracking reading sessions and Pomodoro cycles — directly from your browser toolbar. All data is stored locally in Chrome. Nothing is ever sent to any server.

> **Companion website →** [productive-clock.netlify.app](https://productive-clock.netlify.app/)
> Full web app with analog clock, themes, productivity calendar, monthly reports, and streaks.
> The extension and website share the same local storage keys, so data recorded in the extension appears on the website automatically in the same browser — no sync needed.

---

## Features

### Reading Mode
- Count-up timer for reading and study sessions
- Optional session name
- Daily focus goal (hours + minutes) with a live progress bar
- Pause and resume without losing a second — every moment is banked accurately
- Goal achieved indicator

### Pomodoro Mode
- **Work time** — 1 to 120 minutes, fully configurable
- **Break time** — short rest between each focus block (set to 0 to skip breaks)
- **Loop break** — extra rest gap between complete cycles, separate from the per-cycle break
- **Cycle limit** — choose exactly how many cycles to run, or set to 0 for infinite. Maximum is auto-calculated from your chosen times so it never exceeds 24 hours
- Native Chrome desktop notifications at the end of every phase

### Pomodoro Inside Reading
Start a Pomodoro directly from an active reading session without interrupting it. Configure settings inline, start, and both timers contribute to the same daily total.

### Live Icon Badge
The extension icon reflects your current state at all times — even when the popup is closed.

| Badge | Color | State |
|-------|-------|-------|
| ▶ | Orange | Pomodoro focus running |
| ☕ | Blue | Pomodoro break |
| ⏺ | Purple | Loop break phase |
| ⏸ | Warm grey | Pomodoro paused |
| ▶ | Teal | Reading session running |
| ⏸ | Muted teal | Reading session paused |
| *(blank)* | — | Idle |

### Daily Stats
- Today's total focus time visible at a glance
- Goal progress bar
- Full stats page with day-by-day history (opens in a new tab)
- Clear Today button with double-confirm guard

### Privacy
No accounts. No servers. No analytics. No trackers. All data lives exclusively in your browser via `chrome.storage.local`.

---

## Tech Stack

- **Manifest V3** Chrome Extension
- Vanilla HTML, CSS, JavaScript — zero dependencies, zero frameworks
- `chrome.storage.local` for persistence
- `chrome.alarms` for background timer banking and Pomodoro phase flips
- `chrome.notifications` for native desktop alerts
- `chrome.action` badge API for icon state display

---

## Storage Keys

The extension shares the same storage keys as the companion website, so both work with the same local data in the same browser.

| Key | Purpose |
|-----|---------|
| `productivity-clock-data-v1` | Daily totals, session labels, running session state |
| `productivity-clock-pomo-state-v1` | Active Pomodoro phase, timer, cycle count |
| `productivity-clock-pomo-v1` | Saved Pomodoro settings (work/break/loopbreak/cycles) |
| `productivity-clock-goal-v1` | Daily focus goal |

---

## Install Locally (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select this repository folder
6. The Productivity Clock icon will appear in your toolbar

---

## File Structure

```
productivity-clock-extension/
├── manifest.json       — MV3 extension manifest
├── background.js       — Service worker: timer banking, Pomodoro alarms, badge, notifications
├── popup.html          — Extension popup UI
├── popup.js            — Popup logic: reading timer, Pomodoro controls, goal, render
├── index.html          — Full stats page (opens via "Full Stats →" button)
├── script.js           — Stats page logic
├── styles.css          — Stats page styles
├── storage.js          — Shared storage utilities for stats page
├── logo.svg            — Extension logo
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Related

- **Companion Web App** — [productive-clock.netlify.app](https://productive-clock.netlify.app/)
- **Web App Repository** — [github.com/Kangaeruhito14/Productivity-CLock](https://github.com/Kangaeruhito14/Productivity-CLock)

---

## License

MIT — free to use, modify, and distribute.
