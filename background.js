// background.js — MV3 service worker

const STORAGE_KEY    = "productivity-clock-data-v1";
const POMO_STATE_KEY = "productivity-clock-pomo-state-v1";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => resolve(result[key] ?? null));
  });
}

function setStorage(key, value) {
  return new Promise((resolve) => chrome.storage.local.set({ [key]: value }, resolve));
}

// ── Notifications ──────────────────────────────────────────────────────────────

function notify(title, message) {
  try {
    chrome.notifications.create(`pomo-${Date.now()}`, {
      type: "basic", iconUrl: "icons/icon48.png",
      title, message, priority: 1,
    });
  } catch {}
}

// ── Badge ──────────────────────────────────────────────────────────────────────
// Priority: pomo > reading.  Colors: pomo=orange/blue/purple, reading=teal, paused variants.

function setBadge(pomo, reading) {
  try {
    if (pomo?.active) {
      let text, color;
      if (pomo.paused)                     { text = "⏸"; color = "#9e7c66"; }
      else if (pomo.phase === "break")     { text = "☕"; color = "#3e7e96"; }
      else if (pomo.phase === "loopbreak") { text = "⏺"; color = "#7a5c9a"; }
      else                                 { text = "▶"; color = "#c9654a"; }
      chrome.action.setBadgeText({ text });
      chrome.action.setBadgeBackgroundColor({ color });
      return;
    }
    if (reading?.isRunning) {
      chrome.action.setBadgeText({ text: "▶" });
      chrome.action.setBadgeBackgroundColor({ color: "#3e7e96" });
      return;
    }
    if (reading?.paused) {
      chrome.action.setBadgeText({ text: "⏸" });
      chrome.action.setBadgeBackgroundColor({ color: "#5a8090" });
      return;
    }
    chrome.action.setBadgeText({ text: "" });
  } catch {}
}

async function restoreBadge() {
  const [pomoRaw, dataRaw] = await Promise.all([
    getStorage(POMO_STATE_KEY),
    getStorage(STORAGE_KEY),
  ]);
  let pomo = null, reading = null;
  try { if (pomoRaw) pomo    = JSON.parse(pomoRaw); } catch {}
  try { if (dataRaw) reading = JSON.parse(dataRaw)?.running; } catch {}
  setBadge(pomo, reading);
}

// ── Alarm setup ────────────────────────────────────────────────────────────────

function ensureTimerAlarm() {
  chrome.alarms.get("timerTick", (alarm) => {
    if (!alarm) chrome.alarms.create("timerTick", { periodInMinutes: 1 });
  });
}

chrome.runtime.onInstalled.addListener(() => { ensureTimerAlarm(); restoreBadge(); });
chrome.runtime.onStartup.addListener(()   => { ensureTimerAlarm(); restoreBadge(); });

// ── Message handler ────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "POMO_SCHEDULE") {
    chrome.alarms.clear("pomoPhase", () => {
      if (msg.phaseEndAt && msg.phaseEndAt > Date.now())
        chrome.alarms.create("pomoPhase", { when: msg.phaseEndAt });
    });
    if (msg.pomoState) setBadge(msg.pomoState, null); // pomo active — reading state irrelevant
    sendResponse({ ok: true });
  } else if (msg.type === "POMO_CANCEL") {
    chrome.alarms.clear("pomoPhase");
    restoreBadge(); // reads reading session state too — avoids clearing badge if reading is still running
    sendResponse({ ok: true });
  } else if (msg.type === "BADGE_UPDATE") {
    setBadge(msg.pomoState || null, msg.readingState || null);
    sendResponse({ ok: true });
  }
  return true;
});

chrome.notifications.onClicked.addListener((_id) => {
  try { chrome.action.openPopup(); } catch {}
});

// ── Alarm handler ──────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "timerTick")      await handleTimerTick();
  else if (alarm.name === "pomoPhase") await handlePomoPhaseFlip();
});

// ── Focus timer tick ───────────────────────────────────────────────────────────
// Every minute: bank elapsed time, keep sessionBankedMs current, restore badge.

async function handleTimerTick() {
  // Restore badge in case service worker was idle and restarted
  await restoreBadge();

  const raw = await getStorage(STORAGE_KEY);
  if (!raw) return;

  let data;
  try { data = JSON.parse(raw); } catch { return; }

  const r = data.running;
  if (!r || !r.isRunning || !r.activeStart) return;

  const now         = new Date();
  const activeStart = new Date(r.activeStart);
  if (now <= activeStart) return;

  let bankedThisTick = 0;
  let cursor = new Date(activeStart);
  while (cursor < now) {
    const dayKey       = getLocalDateKey(cursor);
    const nextMidnight = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    const sliceEnd     = nextMidnight < now ? nextMidnight : now;
    const sliceMs      = sliceEnd.getTime() - cursor.getTime();
    if (sliceMs > 0) {
      data.days         = data.days || {};
      data.days[dayKey] = (data.days[dayKey] || 0) + sliceMs;
      bankedThisTick   += sliceMs;
    }
    cursor = sliceEnd;
  }

  // Keep sessionBankedMs current so popup count-up is correct after pomo ends
  r.sessionBankedMs = (r.sessionBankedMs || 0) + bankedThisTick;
  r.activeStart     = now.toISOString();
  r.lastDateKey     = getLocalDateKey(now);

  await setStorage(STORAGE_KEY, JSON.stringify(data));
}

// ── Pomodoro phase flip ────────────────────────────────────────────────────────
// Phases: focus → break → loopbreak → focus  (any phase may be 0s and skipped)

async function handlePomoPhaseFlip() {
  const raw = await getStorage(POMO_STATE_KEY);
  if (!raw) return;

  let pomo;
  try { pomo = JSON.parse(raw); } catch { return; }
  if (!pomo.active || pomo.paused) return;

  const focusSec     = pomo.focusSec     != null ? pomo.focusSec     : 1500;
  const breakSec     = pomo.breakSec     != null ? pomo.breakSec     : 0;
  const loopBreakSec = pomo.loopBreakSec != null ? pomo.loopBreakSec : 0;
  const maxCycles    = pomo.maxCycles    || 0;  // 0 = infinite

  if (pomo.phase === "focus") {
    // ── Focus phase ended ──
    pomo.cycles = (pomo.cycles || 0) + 1;

    // Check if all cycles done
    if (maxCycles > 0 && pomo.cycles >= maxCycles) {
      pomo.active = false; pomo.endTime = 0; pomo.remainingMs = 0;
      await setStorage(POMO_STATE_KEY, JSON.stringify(pomo));
      await restoreBadge(); // may show reading badge if session still running
      notify("🎉 Pomodoro complete!",
        `All ${pomo.cycles} cycle${pomo.cycles !== 1 ? "s" : ""} done. Great work!`);
      return;
    }

    // Move to break, loopbreak, or straight back to focus
    const tag = maxCycles > 0 ? `${pomo.cycles}/${maxCycles}` : `${pomo.cycles}`;
    if (breakSec > 0) {
      pomo.phase = "break"; pomo.endTime = Date.now() + breakSec * 1000;
      notify("Focus done! 🍅", `Cycle ${tag} complete — take a break.`);
    } else if (loopBreakSec > 0) {
      pomo.phase = "loopbreak"; pomo.endTime = Date.now() + loopBreakSec * 1000;
      notify("Focus done! 🍅", `Cycle ${tag} complete — loop break started.`);
    } else {
      pomo.phase = "focus"; pomo.endTime = Date.now() + focusSec * 1000;
      notify("Focus done! 🍅", `Cycle ${tag} complete — starting next.`);
    }

  } else if (pomo.phase === "break") {
    // ── Break phase ended ──
    if (loopBreakSec > 0) {
      pomo.phase = "loopbreak"; pomo.endTime = Date.now() + loopBreakSec * 1000;
      notify("Break done! ☕", "Loop break started — sit back and relax.");
    } else {
      pomo.phase = "focus"; pomo.endTime = Date.now() + focusSec * 1000;
      notify("Break over! ☕", "Time to focus again.");
    }

  } else {
    // ── Loop break phase ended ──
    pomo.phase = "focus"; pomo.endTime = Date.now() + focusSec * 1000;
    notify("Ready! 🚀", "Loop break done — starting next cycle.");
  }

  pomo.remainingMs = pomo.endTime - Date.now();
  await setStorage(POMO_STATE_KEY, JSON.stringify(pomo));
  setBadge(pomo);
  chrome.alarms.create("pomoPhase", { when: pomo.endTime });
}
