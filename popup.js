// popup.js — two distinct modes: Work (count-up) + Pomodoro (countdown)
// Both accumulate to the same daily total. Goal tracks that daily total.

const STORAGE_KEY    = "productivity-clock-data-v1";
const POMO_STATE_KEY = "productivity-clock-pomo-state-v1";
const POMO_KEY       = "productivity-clock-pomo-v1";
const GOAL_KEY       = "productivity-clock-goal-v1";

// ── Format helpers ─────────────────────────────────────────────────────────────

function getLocalDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function fmtMs(ms) {
  if (!ms || ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s%3600)/60), sec = s%60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0)           return `${h}h`;
  if (m > 0 && sec > 0) return `${m}m ${sec}s`;
  if (m > 0)           return `${m}m`;
  return `${sec}s`;
}

// Format for goal text: always shows h + m (omits zero parts but keeps it readable)
function fmtGoal(ms) {
  if (!ms || ms <= 0) return "0m";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0)           return `${h}h`;
  return `${m}m`;
}

// MM:SS or H:MM:SS countdown display
function fmtCountdown(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "0:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s%3600)/60), sec = s%60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${m}:${String(sec).padStart(2,"0")}`;
}

function emptyRunning() {
  return { isRunning: false, paused: false, pomoStarted: false, sessionStart: null, activeStart: null, lastDateKey: null, label: "", sessionBankedMs: 0 };
}

function clamp(v, lo, hi) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : lo;
}

// Instantly cap a number input to its own max attribute while the user is typing.
// Min enforcement is left to the change handler (so the user can clear-and-retype freely).
function clampOnInput(el) {
  el.addEventListener("input", () => {
    const v = parseInt(el.value, 10);
    if (!Number.isFinite(v)) return;
    const hi = parseInt(el.max, 10);
    const lo = parseInt(el.min, 10);
    if (Number.isFinite(hi) && v > hi) el.value = hi;
    else if (Number.isFinite(lo) && v < lo) el.value = lo;
  });
}

// ── Storage helpers ────────────────────────────────────────────────────────────

const sg = keys => new Promise(r => chrome.storage.local.get(keys, r));
const ss = obj  => new Promise(r => chrome.storage.local.set(obj, r));

async function getData() {
  try {
    const r = await sg([STORAGE_KEY]);
    if (!r[STORAGE_KEY]) return { days: {}, labels: {}, running: emptyRunning() };
    const d = JSON.parse(r[STORAGE_KEY]);
    return {
      days:    (d.days    && typeof d.days    === "object") ? d.days    : {},
      labels:  (d.labels  && typeof d.labels  === "object") ? d.labels  : {},
      running: (d.running && typeof d.running === "object") ? d.running : emptyRunning(),
    };
  } catch { return { days: {}, labels: {}, running: emptyRunning() }; }
}

async function saveData(d) {
  try { await ss({ [STORAGE_KEY]: JSON.stringify(d) }); } catch {}
}

async function getPomoState() {
  try {
    const r = await sg([POMO_STATE_KEY, POMO_KEY]);
    // Read persisted settings
    let focusSec = 1500, breakSec = 300, breakEnabled = true, maxCycles = 0, loopBreakSec = 0;
    if (r[POMO_KEY]) {
      try {
        const s = JSON.parse(r[POMO_KEY]);
        focusSec     = s.focusSec    != null ? clamp(s.focusSec,    60, 7200) : 1500;
        breakSec     = s.breakSec    != null ? clamp(s.breakSec,     0, 3600) : 300;
        breakEnabled = s.breakEnabled !== false;
        maxCycles    = clamp(s.maxCycles    != null ? s.maxCycles    : 0, 0, 9999);
        loopBreakSec = clamp(s.loopBreakSec != null ? s.loopBreakSec : 0, 0, 3600);
      } catch {}
    }
    const base = {
      active: false, paused: false, phase: "focus",
      endTime: 0, remainingMs: 0, cycles: 0, label: "",
      focusSec, breakSec, breakEnabled, maxCycles, loopBreakSec,
    };
    if (r[POMO_STATE_KEY]) {
      try {
        const ps = JSON.parse(r[POMO_STATE_KEY]);
        return Object.assign(base, {
          active:       !!ps.active,
          paused:       !!ps.paused,
          phase:        (ps.phase === "break" || ps.phase === "loopbreak") ? ps.phase : "focus",
          endTime:      (Number.isFinite(ps.endTime)     && ps.endTime     > 0) ? ps.endTime     : 0,
          remainingMs:  (Number.isFinite(ps.remainingMs) && ps.remainingMs > 0) ? ps.remainingMs : 0,
          cycles:       Number.isFinite(ps.cycles) && ps.cycles >= 0 ? Math.floor(ps.cycles) : 0,
          label:        typeof ps.label === "string" ? ps.label.slice(0, 100) : "",
          focusSec:     ps.focusSec    != null ? clamp(ps.focusSec,    60, 7200) : focusSec,
          breakSec:     ps.breakSec    != null ? clamp(ps.breakSec,     0, 3600) : breakSec,
          breakEnabled: ps.breakEnabled !== false,
          maxCycles:    clamp(ps.maxCycles    != null ? ps.maxCycles    : maxCycles,    0, 9999),
          loopBreakSec: clamp(ps.loopBreakSec != null ? ps.loopBreakSec : loopBreakSec, 0, 3600),
        });
      } catch {}
    }
    return base;
  } catch {
    return {
      active: false, paused: false, phase: "focus",
      endTime: 0, remainingMs: 0, cycles: 0, label: "",
      focusSec: 1500, breakSec: 300, breakEnabled: true, maxCycles: 0, loopBreakSec: 0,
    };
  }
}

async function savePomoState(p) {
  try { await ss({ [POMO_STATE_KEY]: JSON.stringify(p) }); } catch {}
}

async function savePomoSettings(focusSec, breakSec, breakEnabled, maxCycles, loopBreakSec) {
  try { await ss({ [POMO_KEY]: JSON.stringify({ focusSec, breakSec, breakEnabled, maxCycles: maxCycles || 0, loopBreakSec: loopBreakSec || 0 }) }); } catch {}
}

async function getGoalHours() {
  try {
    const r = await sg([GOAL_KEY]);
    if (!r[GOAL_KEY]) return 0;
    const v = parseFloat(r[GOAL_KEY]);
    return (Number.isFinite(v) && v > 0) ? clamp(v, 0, 24) : 0;
  } catch { return 0; }
}

async function saveGoalHours(hours) {
  try {
    const v = clamp(hours, 0, 24);
    await ss({ [GOAL_KEY]: String(v > 0 ? v : 0) });
  } catch {}
}

// Live today total = stored + running elapsed (if running today)
function getLiveDayMs(d) {
  try {
    const key    = getLocalDateKey(new Date());
    const stored = d.days && Number.isFinite(d.days[key]) ? Math.max(0, d.days[key]) : 0;
    const r      = d.running;
    if (!r?.isRunning || !r.activeStart || r.lastDateKey !== key) return stored;
    const t = new Date(r.activeStart).getTime();
    if (!Number.isFinite(t)) return stored;
    return stored + Math.max(0, Date.now() - t);
  } catch { return 0; }
}

// Elapsed time for this work session — supports pause/resume via sessionBankedMs
function getSessionElapsedMs(d) {
  try {
    const r      = d?.running;
    if (!r) return 0;
    const banked = (Number.isFinite(r.sessionBankedMs) && r.sessionBankedMs > 0) ? r.sessionBankedMs : 0;
    if (r.isRunning && r.activeStart) {
      const t = new Date(r.activeStart).getTime();
      if (!Number.isFinite(t)) return banked;
      return banked + Math.max(0, Date.now() - t);
    }
    return banked; // paused → shows banked time; idle → 0 (sessionBankedMs is 0)
  } catch { return 0; }
}

// ── App state ──────────────────────────────────────────────────────────────────

let data       = null;
let pomo       = null;
let goalHours  = 0;          // decimal hours; 0 = no goal set
let activeMode = "work";  // "work" | "pomo"
let clearPhase = 0;
let clearTimer = null;

// ── DOM helper ─────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

// ── Badge ──────────────────────────────────────────────────────────────────────
// Routes through background.js for reliability — background's service worker
// context is more persistent than the popup context for chrome.action calls.

function setBadge(pomoState, readingState) {
  try {
    chrome.runtime.sendMessage({
      type: "BADGE_UPDATE",
      pomoState:    pomoState    || null,
      readingState: readingState || null,
    }).catch(() => {});
  } catch {}
}

// ── Loops calculation ──────────────────────────────────────────────────────────

function calcMaxLoops(focusSec, breakSec, loopBreakSec) {
  const cycleS = (focusSec || 0) + (breakSec || 0) + (loopBreakSec || 0);
  return cycleS > 0 ? Math.floor(86400 / cycleS) : 0;
}

function updateLoopsDisplay() {
  const maxL = calcMaxLoops(pomo?.focusSec || 1500, pomo?.breakSec || 0, pomo?.loopBreakSec || 0);
  const hint = $("pomoLoopsHint");
  if (hint) hint.textContent = `(0 = ∞ · max ${maxL})`;
  const loopsEl = $("pomoLoops");
  if (loopsEl) loopsEl.max = maxL;
  const inlineHint = $("pomoInlineLoopsHint");
  if (inlineHint) inlineHint.textContent = `(0 = ∞ · max ${maxL})`;
  const inlineLoopsEl = $("pomoInlineLoops");
  if (inlineLoopsEl) inlineLoopsEl.max = maxL;
}

// ── Mode tabs ──────────────────────────────────────────────────────────────────

document.querySelectorAll(".tab").forEach(t =>
  t.addEventListener("click", () => { activeMode = t.dataset.mode; syncTabs(); })
);

function syncTabs() {
  document.querySelectorAll(".tab").forEach(t =>
    t.classList.toggle("active", t.dataset.mode === activeMode)
  );

  const isWork = activeMode === "work";
  $("goalSection").hidden = !isWork;
  $("pomoCfg").hidden     = isWork;

  const btn = $("startBtn");
  if (isWork) {
    btn.className   = "btn-start mode-work";
    btn.textContent = "⏱️ Start Work Session";
  } else {
    btn.className   = "btn-start mode-pomo";
    btn.textContent = "🍅 Start Pomodoro";
    // Sync pomo inputs each time the pomo tab is shown
    if (pomo) {
      $("pomoWorkMin").value   = Math.max(1, Math.round((pomo.focusSec ?? 1500) / 60));
      $("pomoBreakMin").value  = Math.round((pomo.breakSec ?? 0) / 60);
      $("pomoLoopBreak").value = Math.round((pomo.loopBreakSec ?? 0) / 60);
      $("pomoLoops").value     = pomo.maxCycles ?? 0;
      updateLoopsDisplay();
    }
  }
}

// ── Panel switching ────────────────────────────────────────────────────────────

function showPanel(which) {
  $("idlePanel").hidden    = which !== "idle";
  $("runningPanel").hidden = which !== "running";
  $("pomoPanel").hidden    = which !== "pomo";
}

// ── Render ─────────────────────────────────────────────────────────────────────

function render() {
  if (!data || !pomo) return;

  const todayMs     = getLiveDayMs(data);
  const sessRunning = !!data.running?.isRunning;
  const sessPaused  = !!data.running?.paused;
  const sessActive  = sessRunning || sessPaused;
  const pomoRunning = !!pomo.active;

  // Today value (always live)
  $("todayVal").textContent = fmtMs(todayMs);

  // Status chip
  const chip = $("statusChip");
  const lbl  = $("statusLabel");
  if (sessRunning || pomoRunning) {
    chip.classList.add("live");
    const name = (pomoRunning ? (pomo.label || "Pomodoro") : (data.running.label || "")).slice(0, 40);
    lbl.textContent = name || "Running";
  } else if (sessPaused) {
    chip.classList.remove("live");
    lbl.textContent = "Paused";
  } else {
    chip.classList.remove("live");
    lbl.textContent = "Idle";
  }

  // Today card: visible only when idle (hidden during active sessions to avoid distraction)
  $("todayCard").hidden = sessActive || pomoRunning;

  // Goal bar in today card (only matters when card is visible)
  if (!sessActive && !pomoRunning) renderGoalBar(todayMs);

  // Which panel to show — pomo takes priority; work panel shows for both running + paused
  if (pomoRunning) {
    showPanel("pomo");
    renderPomoPanel();
  } else if (sessActive) {
    showPanel("running");
    renderRunningPanel(todayMs);
  } else {
    showPanel("idle");
    syncTabs();       // ensure pomoCfg visibility matches the active tab
    syncGoalInputs();
    if (pomo) {
      $("pomoWorkMin").value   = Math.max(1, Math.round((pomo.focusSec ?? 1500) / 60));
      $("pomoBreakMin").value  = Math.round((pomo.breakSec ?? 0) / 60);
      $("pomoLoopBreak").value = Math.round((pomo.loopBreakSec ?? 0) / 60);
      $("pomoLoops").value     = pomo.maxCycles ?? 0;
      updateLoopsDisplay();
    }
  }
}

function renderGoalBar(todayMs) {
  const goalMs  = goalHours * 3600000;
  const barWrap = $("goalBarWrap");
  if (goalHours <= 0) { barWrap.hidden = true; return; }

  barWrap.hidden = false;
  const pct  = Math.min(100, (todayMs / goalMs) * 100);
  const done = pct >= 100;

  $("goalFill").style.width = `${pct.toFixed(1)}%`;
  $("goalFill").classList.toggle("done", done);

  const row   = $("goalBarRow");
  const left  = $("goalBarLeft");
  const right = $("goalBarRight");
  row.classList.toggle("done", done);

  if (done) {
    left.textContent  = "🎉 Daily goal achieved!";
    right.textContent = "";
  } else {
    left.textContent  = `${fmtGoal(todayMs)} of ${fmtGoal(goalMs)}`;
    right.textContent = `${Math.floor(pct)}%`;
  }
}

function syncGoalInputs() {
  const totalMin = Math.round(goalHours * 60);
  $("goalH").value = Math.floor(totalMin / 60);
  $("goalM").value = totalMin % 60;
}

function renderRunningPanel(todayMs) {
  const r        = data.running;
  const isPaused = !!r?.paused;
  const lbl      = (r?.label || "⏱️ Work").replace(/^⏱️\s*/, "").trim() || "Work session";
  $("runningName").textContent    = lbl;
  $("sessionElapsed").textContent = fmtCountdown(getSessionElapsedMs(data));

  // Pause button; Pomo Mode button + inline settings reset when state changes
  $("pauseBtn").textContent    = isPaused ? "▶ Resume" : "⏸ Pause";
  $("pomoModeBtn").hidden      = false;
  $("pomoModeBtn").textContent = "🍅 Pomodoro";
  $("pomoInline").hidden       = true;

  // Goal section in running card
  const goalMs   = goalHours * 3600000;
  const goalWrap = $("runGoalWrap");
  if (goalHours <= 0) { goalWrap.hidden = true; return; }
  goalWrap.hidden = false;
  const pct    = Math.min(100, (todayMs / goalMs) * 100);
  const done   = pct >= 100;
  const textEl = $("runGoalText");
  const fillEl = $("runGoalFill");
  fillEl.style.width = `${pct.toFixed(1)}%`;
  fillEl.classList.toggle("done", done);
  textEl.classList.toggle("done", done);
  textEl.textContent = done
    ? "🎉 Daily goal achieved!"
    : `${fmtGoal(todayMs)} of ${fmtGoal(goalMs)} goal`;
}

function renderPomoPanel() {
  const p           = pomo;
  const isBreak     = p.phase === "break";
  const isLoopBreak = p.phase === "loopbreak";

  const badge = $("pomoPhaseBadge");
  badge.textContent = isLoopBreak ? "LOOP BREAK" : (isBreak ? "BREAK" : "FOCUS");
  badge.className   = `pomo-badge${(isBreak || isLoopBreak) ? " break" : ""}`;

  const timer = $("pomoTimer");
  timer.className = `pomo-big-time${(isBreak || isLoopBreak) ? " break" : ""}`;
  const rem = p.paused
    ? Math.max(0, p.remainingMs || 0)
    : Math.max(0, (p.endTime || 0) - Date.now());
  timer.textContent = fmtCountdown(rem);

  const nameEl = $("pomoSessionName");
  if (p.label) { nameEl.textContent = p.label; nameEl.hidden = false; }
  else          { nameEl.hidden = true; }

  const c         = Math.max(0, Math.floor(p.cycles || 0));
  const maxCycles = p.maxCycles || 0;
  $("pomoCycles").textContent = maxCycles > 0
    ? `${c} / ${maxCycles} cycles`
    : (c === 1 ? "1 cycle completed" : `${c} cycles completed`);
  $("pomoPauseBtn").textContent = p.paused ? "▶ Resume" : "⏸ Pause";
}

// ── Live tick (every second) ───────────────────────────────────────────────────

setInterval(() => {
  if (!data) return;
  const todayMs = getLiveDayMs(data);

  // Today card: only update when visible (hidden during active sessions)
  if (!$("todayCard").hidden) {
    $("todayVal").textContent = fmtMs(todayMs);
    renderGoalBar(todayMs);
  }

  // Work running: update elapsed + goal bar (also when paused — elapsed is static but harmless)
  if (!$("runningPanel").hidden && (data.running?.isRunning || data.running?.paused)) {
    $("sessionElapsed").textContent = fmtCountdown(getSessionElapsedMs(data));
    if (goalHours > 0 && !$("runGoalWrap").hidden) {
      const goalMs = goalHours * 3600000;
      const pct    = Math.min(100, (todayMs / goalMs) * 100);
      const done   = pct >= 100;
      $("runGoalFill").style.width = `${pct.toFixed(1)}%`;
      $("runGoalFill").classList.toggle("done", done);
      const te = $("runGoalText");
      te.classList.toggle("done", done);
      te.textContent = done ? "🎉 Daily goal achieved!" : `${fmtGoal(todayMs)} of ${fmtGoal(goalMs)} goal`;
    }
  }

  // Pomo countdown (fast-path: no storage read)
  if (!$("pomoPanel").hidden && pomo?.active && !pomo?.paused && pomo?.endTime) {
    $("pomoTimer").textContent = fmtCountdown(Math.max(0, pomo.endTime - Date.now()));
  }
}, 1000);

// ── Goal inputs ────────────────────────────────────────────────────────────────

async function applyGoal() {
  const rawH = parseInt($("goalH").value, 10);
  const rawM = parseInt($("goalM").value, 10);
  const h = clamp(Number.isFinite(rawH) ? rawH : 0, 0, 23);
  const m = clamp(Number.isFinite(rawM) ? rawM : 0, 0, 59);
  $("goalH").value = h;
  $("goalM").value = m;
  goalHours = h + m / 60;
  await saveGoalHours(goalHours);
  renderGoalBar(getLiveDayMs(data || { days: {}, labels: {}, running: emptyRunning() }));
}

$("goalH").addEventListener("change", applyGoal);
$("goalM").addEventListener("change", applyGoal);
[$("goalH"), $("goalM")].forEach(el =>
  el.addEventListener("wheel", e => e.preventDefault(), { passive: false })
);

// ── Pomo time inputs ───────────────────────────────────────────────────────────

async function applyPomoSettings() {
  const rawW  = parseInt($("pomoWorkMin").value,   10);
  const rawB  = parseInt($("pomoBreakMin").value,  10);
  const rawLB = parseInt($("pomoLoopBreak").value, 10);
  const rawL  = parseInt($("pomoLoops").value,     10);
  const wMin     = clamp(Number.isFinite(rawW)  ? rawW  : 25, 1, 120);
  const bMin     = clamp(Number.isFinite(rawB)  ? rawB  : 5,  0,  60);
  const lbMin    = clamp(Number.isFinite(rawLB) ? rawLB : 0,  0,  60);
  const maxL     = calcMaxLoops(wMin * 60, bMin * 60, lbMin * 60);
  const loops    = clamp(Number.isFinite(rawL)  ? rawL  : 0,  0,  maxL || 999);
  $("pomoWorkMin").value   = wMin;
  $("pomoBreakMin").value  = bMin;
  $("pomoLoopBreak").value = lbMin;
  $("pomoLoops").value     = loops;
  const focusSec = wMin * 60, breakSec = bMin * 60, loopBreakSec = lbMin * 60, breakEnabled = bMin > 0;
  if (pomo) { pomo.focusSec = focusSec; pomo.breakSec = breakSec; pomo.breakEnabled = breakEnabled; pomo.maxCycles = loops; pomo.loopBreakSec = loopBreakSec; }
  await savePomoSettings(focusSec, breakSec, breakEnabled, loops, loopBreakSec);
  updateLoopsDisplay();
}

$("pomoWorkMin").addEventListener("change",  applyPomoSettings);
$("pomoBreakMin").addEventListener("change", applyPomoSettings);
[$("pomoWorkMin"), $("pomoBreakMin")].forEach(el =>
  el.addEventListener("wheel", e => e.preventDefault(), { passive: false })
);

// ── Start button ───────────────────────────────────────────────────────────────

$("startBtn").addEventListener("click", async () => {
  if (activeMode === "pomo") await startPomo();
  else await startReading();  // work mode
});

async function startReading() {
  try {
    const d = await getData();
    if (d.running?.isRunning || d.running?.paused) return; // guard: already active
    const name  = ($("sessionName").value || "").trim().slice(0, 100);
    const label = name ? `⏱️ ${name}` : "⏱️ Work";
    const now   = new Date();
    d.running = {
      isRunning:       true,
      paused:          false,
      pomoStarted:     false,
      sessionStart:    now.toISOString(),
      activeStart:     now.toISOString(),
      lastDateKey:     getLocalDateKey(now),
      label,
      sessionBankedMs: 0,
    };
    await saveData(d);
    data = d;
    setBadge(null, d.running);
    render();
  } catch {}
}

async function startPomo() {
  try {
    await applyPomoSettings();
    const p    = await getPomoState();
    const name = ($("sessionName").value || "").trim().slice(0, 100);
    const safeWork = clamp(p.focusSec, 60, 7200);

    p.active       = true;
    p.paused       = false;
    p.phase        = "focus";
    p.endTime      = Date.now() + safeWork * 1000;
    p.remainingMs  = safeWork * 1000;
    p.cycles       = 0;
    p.label        = name;
    p.maxCycles    = clamp(parseInt($("pomoLoops").value, 10) || 0, 0, 999);
    p.loopBreakSec = clamp(pomo?.loopBreakSec || 0, 0, 3600);

    await savePomoState(p);
    pomo = p;
    setBadge(pomo);
    chrome.runtime.sendMessage({ type: "POMO_SCHEDULE", phaseEndAt: p.endTime, pomoState: p }).catch(() => {});

    // Ensure main session running so pomo time counts toward daily total
    const d = await getData();
    if (d.running?.paused) {
      // Resume paused reading session rather than creating a new one
      const now = new Date();
      d.running.isRunning   = true;
      d.running.paused      = false;
      d.running.activeStart = now.toISOString();
      d.running.lastDateKey = getLocalDateKey(now);
      await saveData(d);
      data = d;
    } else if (!d.running?.isRunning) {
      const now = new Date();
      d.running = {
        isRunning:       true,
        paused:          false,
        pomoStarted:     true,
        sessionStart:    now.toISOString(),
        activeStart:     now.toISOString(),
        lastDateKey:     getLocalDateKey(now),
        label:           name || "Pomodoro",
        sessionBankedMs: 0,
      };
      await saveData(d);
      data = d;
    }
    render();
  } catch {}
}

// Launch pomo from within an active work session — work keeps running in background
// Uses in-memory pomo settings (updated by pomoInlineStart before this is called)
async function startPomoFromReading() {
  try {
    if (pomo?.active) return;
    const d        = await getData();
    const rawLabel = d.running?.label || "";
    const name     = rawLabel.replace(/^⏱️\s*/, "").trim();
    // Use in-memory settings — already updated by pomoInlineStart
    const focusSec    = clamp(pomo?.focusSec    || 1500, 60, 7200);
    const breakSec    = clamp(pomo?.breakSec    || 0,     0, 3600);
    const loopBreakSec = clamp(pomo?.loopBreakSec || 0,   0, 3600);
    const breakEnabled = pomo?.breakEnabled !== false;

    const p = Object.assign({}, pomo || {});
    p.active        = true;
    p.paused        = false;
    p.phase         = "focus";
    p.endTime       = Date.now() + focusSec * 1000;
    p.remainingMs   = focusSec * 1000;
    p.cycles        = 0;
    p.label         = name;
    p.focusSec      = focusSec;
    p.breakSec      = breakSec;
    p.loopBreakSec  = loopBreakSec;
    p.breakEnabled  = breakEnabled;
    p.maxCycles     = clamp(pomo?.maxCycles || 0, 0, 999);

    await savePomoState(p);
    pomo = p;
    setBadge(pomo);
    chrome.runtime.sendMessage({ type: "POMO_SCHEDULE", phaseEndAt: p.endTime, pomoState: p }).catch(() => {});
    // Reading session stays running — no changes to data
    render();
  } catch {}
}

// ── Stop session ───────────────────────────────────────────────────────────────

async function stopSession() {
  try {
    const d = await getData();
    const r = d.running;

    if (r?.paused) {
      // Time already banked on pause — just clear the session
      const today = getLocalDateKey(new Date());
      if (r.label) { d.labels = d.labels || {}; if (!d.labels[today]) d.labels[today] = r.label.slice(0, 100); }
      d.running = emptyRunning();
      await saveData(d);
      data = d;
      setBadge(null, null);
      render();
      return;
    }

    if (!r?.isRunning || !r.activeStart) { d.running = emptyRunning(); await saveData(d); data = d; setBadge(null, null); render(); return; }

    const now   = new Date();
    const t     = new Date(r.activeStart).getTime();
    if (!Number.isFinite(t)) { d.running = emptyRunning(); await saveData(d); data = d; setBadge(null, null); render(); return; }

    const today = getLocalDateKey(now);
    let cursor  = new Date(t);
    while (cursor < now) {
      const dayKey   = getLocalDateKey(cursor);
      const nextMid  = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
      const sliceEnd = nextMid < now ? nextMid : now;
      const ms       = sliceEnd.getTime() - cursor.getTime();
      if (ms > 0) {
        d.days = d.days || {};
        d.days[dayKey] = Math.max(0, (Number.isFinite(d.days[dayKey]) ? d.days[dayKey] : 0) + ms);
      }
      cursor = sliceEnd;
    }
    if (r.label) { d.labels = d.labels || {}; if (!d.labels[today]) d.labels[today] = r.label.slice(0, 100); }
    d.running = emptyRunning();
    await saveData(d);
    data = d;
    setBadge(null, null);
    render();
  } catch { try { render(); } catch {} }
}

$("stopBtn").addEventListener("click", stopSession);

// Pause / Resume work session
$("pauseBtn").addEventListener("click", async () => {
  try {
    const d = await getData();
    const r = d.running;
    if (!r) return;

    if (r.paused) {
      // Resume: set new activeStart, mark running
      const now = new Date();
      r.isRunning   = true;
      r.paused      = false;
      r.activeStart = now.toISOString();
      r.lastDateKey = getLocalDateKey(now);
      await saveData(d);
      data = d;
      setBadge(null, d.running);
    } else if (r.isRunning) {
      // Pause: bank elapsed since last activeStart
      const now = new Date();
      const t   = new Date(r.activeStart).getTime();
      if (Number.isFinite(t)) {
        const elapsed = Math.max(0, now.getTime() - t);
        const key     = getLocalDateKey(now);
        d.days        = d.days || {};
        d.days[key]   = Math.max(0, (Number.isFinite(d.days[key]) ? d.days[key] : 0) + elapsed);
        r.sessionBankedMs = Math.max(0, (r.sessionBankedMs || 0) + elapsed);
      }
      r.isRunning   = false;
      r.paused      = true;
      r.activeStart = null;
      await saveData(d);
      data = d;
      setBadge(null, d.running);
    }
    render();
  } catch {}
});

// Launch pomodoro from within work session — toggles inline settings form
$("pomoModeBtn").addEventListener("click", async () => {
  const inline = $("pomoInline");
  if (!inline.hidden) {
    // Toggle off (cancel)
    inline.hidden = true;
    $("pomoModeBtn").textContent = "🍅 Pomodoro";
    return;
  }
  // Toggle on — populate inputs from saved pomo settings
  $("pomoInlineWork").value      = Math.max(1, Math.round((pomo?.focusSec || 1500) / 60));
  $("pomoInlineBreak").value     = Math.round((pomo?.breakSec || 0) / 60);
  $("pomoInlineLoopBreak").value = Math.round((pomo?.loopBreakSec || 0) / 60);
  $("pomoInlineLoops").value     = pomo?.maxCycles || 0;
  updateLoopsDisplay();
  inline.hidden = false;
  $("pomoModeBtn").textContent = "✕ Cancel";
});

$("pomoInlineStart").addEventListener("click", async () => {
  try {
    const rawW  = parseInt($("pomoInlineWork").value,      10);
    const rawB  = parseInt($("pomoInlineBreak").value,     10);
    const rawLB = parseInt($("pomoInlineLoopBreak").value, 10);
    const rawL  = parseInt($("pomoInlineLoops").value,     10);
    const wMin     = clamp(Number.isFinite(rawW)  ? rawW  : 25, 1, 120);
    const bMin     = clamp(Number.isFinite(rawB)  ? rawB  : 5,  0,  60);
    const lbMin    = clamp(Number.isFinite(rawLB) ? rawLB : 0,  0,  60);
    const maxL     = calcMaxLoops(wMin * 60, bMin * 60, lbMin * 60);
    const loops    = clamp(Number.isFinite(rawL)  ? rawL  : 0,  0,  maxL || 999);
    $("pomoInlineWork").value      = wMin;
    $("pomoInlineBreak").value     = bMin;
    $("pomoInlineLoopBreak").value = lbMin;
    $("pomoInlineLoops").value     = loops;
    const focusSec = wMin * 60, breakSec = bMin * 60, loopBreakSec = lbMin * 60, breakEnabled = bMin > 0;
    // Update in-memory pomo so startPomoFromReading picks up the new values
    if (pomo) { pomo.focusSec = focusSec; pomo.breakSec = breakSec; pomo.breakEnabled = breakEnabled; pomo.maxCycles = loops; pomo.loopBreakSec = loopBreakSec; }
    await savePomoSettings(focusSec, breakSec, breakEnabled, loops, loopBreakSec);
    $("pomoInline").hidden       = true;
    $("pomoModeBtn").textContent = "🍅 Pomodoro";
    await startPomoFromReading();
  } catch {}
});

[$("pomoInlineWork"), $("pomoInlineBreak"), $("pomoInlineLoopBreak"), $("pomoInlineLoops")].forEach(el =>
  el.addEventListener("wheel", e => e.preventDefault(), { passive: false })
);

$("pomoLoops").addEventListener("change",     applyPomoSettings);
$("pomoLoops").addEventListener("wheel",     e => e.preventDefault(), { passive: false });
$("pomoLoopBreak").addEventListener("change", applyPomoSettings);
$("pomoLoopBreak").addEventListener("wheel",  e => e.preventDefault(), { passive: false });

// Real-time max clamping — applied to every numeric input in the popup.
[
  $("goalH"), $("goalM"),
  $("pomoWorkMin"), $("pomoBreakMin"), $("pomoLoopBreak"), $("pomoLoops"),
  $("pomoInlineWork"), $("pomoInlineBreak"), $("pomoInlineLoopBreak"), $("pomoInlineLoops"),
].forEach(clampOnInput);

// ── Pomo controls ──────────────────────────────────────────────────────────────

$("pomoPauseBtn").addEventListener("click", async () => {
  try {
    const p = await getPomoState();
    if (!p.active) return;
    if (p.paused) {
      const safe = clamp(p.remainingMs || 0, 0, 86400000);
      p.paused  = false;
      p.endTime = Date.now() + safe;
      chrome.runtime.sendMessage({ type: "POMO_SCHEDULE", phaseEndAt: p.endTime, pomoState: p }).catch(() => {});
    } else {
      p.remainingMs = Math.max(0, (p.endTime || 0) - Date.now());
      p.paused      = true;
      p.endTime     = 0;
      chrome.runtime.sendMessage({ type: "POMO_CANCEL" }).catch(() => {});
    }
    await savePomoState(p);
    pomo = p;
    setBadge(pomo);
    renderPomoPanel();
  } catch {}
});

$("pomoEndBtn").addEventListener("click", async () => {
  try {
    const d = await getData();
    const p = await getPomoState();
    const pomoStartedSession = !!d.running?.pomoStarted;

    p.active = false; p.paused = false; p.endTime = 0; p.remainingMs = 0;
    await savePomoState(p);
    pomo = p;
    chrome.runtime.sendMessage({ type: "POMO_CANCEL" }).catch(() => {});

    if (pomoStartedSession) {
      // Pomo auto-created the session — stop it too (stopSession clears badge)
      setBadge(null, null);
      await stopSession();
    } else {
      // Reading was started independently — keep it running; show reading badge
      setBadge(null, d.running);
      data = d;
      render();
    }
  } catch { try { render(); } catch {} }
});

// ── Clear Today ────────────────────────────────────────────────────────────────

$("clearBtn").addEventListener("click", async () => {
  const btn = $("clearBtn");

  if (clearPhase === 0) {
    // First click: wait for confirmation
    clearPhase = 1;
    btn.textContent = "⚠ Confirm clear?";
    btn.classList.add("confirm");
    clearTimer = setTimeout(() => {
      clearPhase = 0;
      try { btn.textContent = "🗑 Clear Today"; btn.classList.remove("confirm"); } catch {}
    }, 3000);
    return;
  }

  // Second click within 3 s — clear today
  clearTimeout(clearTimer);
  clearPhase = 0;
  btn.textContent = "✓ Cleared";
  btn.classList.remove("confirm");
  setTimeout(() => { try { btn.textContent = "🗑 Clear Today"; } catch {} }, 1800);

  try {
    const key = getLocalDateKey(new Date());
    const d   = await getData();
    d.days    = d.days || {};
    d.days[key] = 0;
    if (d.labels && typeof d.labels === "object") delete d.labels[key];
    // Stop any running or paused session for today
    if ((d.running?.isRunning || d.running?.paused) && d.running.lastDateKey === key) {
      d.running = emptyRunning();
    }
    await saveData(d);
    data = d;

    // Stop any active pomo
    if (pomo?.active) {
      pomo.active = false; pomo.paused = false; pomo.endTime = 0; pomo.remainingMs = 0;
      await savePomoState(pomo);
      chrome.runtime.sendMessage({ type: "POMO_CANCEL" }).catch(() => {});
    }
    setBadge(null, null); // always clear badge on full reset
    render();
  } catch {}
});

// ── Full Stats ─────────────────────────────────────────────────────────────────

$("openBtn").addEventListener("click", () => {
  try {
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
    window.close();
  } catch {}
});

// ── React to external storage changes (main tab / background) ─────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  try {
    if (changes[STORAGE_KEY]) {
      try {
        const raw = changes[STORAGE_KEY].newValue;
        data = raw ? JSON.parse(raw) : { days: {}, labels: {}, running: emptyRunning() };
      } catch { data = { days: {}, labels: {}, running: emptyRunning() }; }
      render();
    }
    if (changes[POMO_STATE_KEY]) {
      try {
        const raw = changes[POMO_STATE_KEY].newValue;
        if (raw) pomo = Object.assign({}, pomo || {}, JSON.parse(raw));
      } catch {}
      render();
    }
    if (changes[GOAL_KEY]) {
      try {
        const v = parseFloat(changes[GOAL_KEY].newValue);
        goalHours = (Number.isFinite(v) && v > 0) ? clamp(v, 0, 24) : 0;
        syncGoalInputs();
        renderGoalBar(getLiveDayMs(data || { days: {}, labels: {}, running: emptyRunning() }));
      } catch {}
    }
  } catch {}
});

// ── Init ───────────────────────────────────────────────────────────────────────

async function init() {
  try {
    [data, pomo, goalHours] = await Promise.all([getData(), getPomoState(), getGoalHours()]);
  } catch {
    data      = data      || { days: {}, labels: {}, running: emptyRunning() };
    pomo      = pomo      || { active: false, paused: false, phase: "focus", endTime: 0, remainingMs: 0, cycles: 0, label: "", focusSec: 1500, breakSec: 300, breakEnabled: true };
    goalHours = goalHours || 0;
  }
  try { syncTabs(); render(); } catch {}
}

init();
