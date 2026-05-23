const STORAGE_KEY     = "productivity-clock-data-v1";
const GOAL_KEY        = "productivity-clock-goal-v1";
const GOAL_DATE_KEY        = "productivity-clock-goal-date-v1";
const GOAL_CELEBRATED_KEY  = "productivity-clock-goal-celebrated-v1";
const TOUR_KEY        = "productivity-clock-tour-v1";
const THEME_KEY       = "productivity-clock-theme-v1";
const POMO_KEY        = "productivity-clock-pomo-v1";
const POMO_STATE_KEY  = "productivity-clock-pomo-state-v1";
const TIME_FORMAT_KEY = "productivity-clock-fmt-v1";

// ---- THEMES ----------------------------------------------------------------

const THEMES = {
  warm: {
    "--bg": "#f6f0e8", "--ink": "#1e1916", "--muted": "#7a6354",
    "--card": "rgba(255,248,238,0.92)", "--stroke": "rgba(201,101,74,0.12)",
    "--surface": "rgba(252,240,224,0.80)",
    "--accent-bg": "rgba(201,101,74,0.13)", "--teal-bg": "rgba(74,127,148,0.11)",
    "--green-bg": "rgba(87,138,94,0.13)",
    "--accent": "#c9654a", "--accent-strong": "#a8432e",
    "--teal": "#4a7f94", "--gold": "#c49b3c", "--green": "#578a5e",
    "--shadow": "0 28px 60px rgba(170,55,15,0.12)",
    "--chart-box": "rgba(20, 14, 28, 0.93)",
  },
  dark: {
    "--bg": "#0e1320", "--ink": "#dde4ee", "--muted": "#7a8898",
    "--card": "rgba(18,24,36,0.94)", "--stroke": "rgba(220,234,248,0.09)",
    "--surface": "rgba(255,255,255,0.05)",
    "--accent-bg": "rgba(230,121,89,0.13)", "--teal-bg": "rgba(61,184,200,0.11)",
    "--green-bg": "rgba(68,168,122,0.12)",
    "--accent": "#e67959", "--accent-strong": "#cc5a3a",
    "--teal": "#3db8c8", "--gold": "#d4a740", "--green": "#44a87a",
    "--shadow": "0 28px 60px rgba(0,0,0,0.55)",
    "--chart-box": "rgba(4, 6, 14, 0.97)",
  },
  ocean: {
    "--bg": "#d6e8f4", "--ink": "#0a2438", "--muted": "#3c6480",
    "--card": "rgba(200,232,254,0.88)", "--stroke": "rgba(21,104,160,0.14)",
    "--surface": "rgba(178,220,248,0.74)",
    "--accent-bg": "rgba(21,104,160,0.13)", "--teal-bg": "rgba(32,132,184,0.11)",
    "--green-bg": "rgba(61,142,112,0.13)",
    "--accent": "#1568a0", "--accent-strong": "#0d4d80",
    "--teal": "#2084b8", "--gold": "#4ab8d8", "--green": "#3d8e70",
    "--shadow": "0 28px 60px rgba(0,70,150,0.15)",
    "--chart-box": "rgba(4, 16, 44, 0.94)",
  },
  forest: {
    "--bg": "#e2eddc", "--ink": "#182c18", "--muted": "#4a6448",
    "--card": "rgba(216,242,210,0.90)", "--stroke": "rgba(63,115,72,0.15)",
    "--surface": "rgba(196,228,188,0.76)",
    "--accent-bg": "rgba(63,115,72,0.13)", "--teal-bg": "rgba(58,107,96,0.12)",
    "--green-bg": "rgba(43,92,58,0.14)",
    "--accent": "#3f7348", "--accent-strong": "#2d5535",
    "--teal": "#3a6b60", "--gold": "#7a9e40", "--green": "#2b5c3a",
    "--shadow": "0 28px 60px rgba(25,75,20,0.14)",
    "--chart-box": "rgba(4, 18, 8, 0.94)",
  },
  dusk: {
    "--bg": "#ece3f5", "--ink": "#1e1230", "--muted": "#6a5280",
    "--card": "rgba(232,218,255,0.92)", "--stroke": "rgba(112,64,168,0.14)",
    "--surface": "rgba(212,192,248,0.74)",
    "--accent-bg": "rgba(112,64,168,0.13)", "--teal-bg": "rgba(104,82,184,0.12)",
    "--green-bg": "rgba(94,72,160,0.13)",
    "--accent": "#7040a8", "--accent-strong": "#522e90",
    "--teal": "#6852b8", "--gold": "#b87aca", "--green": "#5e48a0",
    "--shadow": "0 28px 60px rgba(80,24,160,0.15)",
    "--chart-box": "rgba(16, 6, 32, 0.94)",
  },
};

// Particle colours per theme (r,g,b) + scale multiplier for opacity on light backgrounds
const CANVAS_COLORS = {
  warm:   { r: 160, g:  70, b:  45, scale: 2.8 },
  dark:   { r:  61, g: 184, b: 200, scale: 1.0 },
  ocean:  { r:  21, g:  90, b: 160, scale: 2.8 },
  forest: { r:  45, g: 100, b:  55, scale: 2.8 },
  dusk:   { r: 110, g:  50, b: 168, scale: 2.8 },
};

let canvasRGB = CANVAS_COLORS.warm;

function applyTheme(name) {
  const t = THEMES[name];
  if (!t) return;
  const root = document.documentElement;
  Object.entries(t).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute("data-theme", name);
  canvasRGB = CANVAS_COLORS[name] || CANVAS_COLORS.warm;
  document.querySelectorAll(".theme-dot").forEach((d) =>
    d.classList.toggle("active", d.dataset.theme === name)
  );
  Store.set(THEME_KEY, name);
}

function initTheme() {
  applyTheme(state._theme || "warm");
  // Theme dots are now inside the settings panel; wired in initSettings()
}

// ---- TIME OF DAY -----------------------------------------------------------

const TOD_RANGES = [
  [0,  5,  "late-night"],
  [5,  7,  "sunrise"],
  [7,  11, "morning"],
  [11, 14, "midday"],
  [14, 17, "afternoon"],
  [17, 20, "evening"],
  [20, 24, "night"],
];

const TOD_LABELS = {
  "late-night": "Late Night", "sunrise": "Sunrise", "morning": "Morning",
  "midday": "Midday", "afternoon": "Afternoon", "evening": "Evening", "night": "Night",
};

function getCurrentTOD() {
  const h = new Date().getHours();
  for (const [s, e, n] of TOD_RANGES) if (h >= s && h < e) return n;
  return "night";
}

const TOD_GRADIENTS = {
  "late-night": "linear-gradient(180deg, #060412 0%, #0a0820 55%, #110630 100%)",
  "sunrise":    "linear-gradient(180deg, #3d1a78 0%, #8b3a9b 18%, #e05f5f 42%, #f4a261 63%, #fdd17a 82%, #fff3b0 100%)",
  "morning":    "linear-gradient(180deg, #74b3e8 0%, #a8d8ea 40%, #f0f8ff 75%, #fff9f0 100%)",
  "midday":     "linear-gradient(180deg, #3a85cc 0%, #74b7e8 40%, #c8e8f8 70%, #eef7ff 100%)",
  "afternoon":  "linear-gradient(180deg, #6ea8d8 0%, #aeccea 45%, #ffe5b0 75%, #fff5e0 100%)",
  "evening":    "linear-gradient(180deg, #2a1060 0%, #7b2fa0 16%, #cc4b7a 34%, #f06030 53%, #f5a030 68%, #ffd080 84%, #fff0c0 100%)",
  "night":      "linear-gradient(180deg, #080414 0%, #12062a 45%, #0a1830 75%, #102030 100%)",
};

let _currentTOD = null;
let _todTimer    = null;

function applyTOD() {
  const tod = getCurrentTOD();
  const tz  = document.querySelector(".timezone");
  if (tz) tz.textContent = `Local time · ${TOD_LABELS[tod] || ""}`;

  if (tod === _currentTOD) return;

  const overlay     = document.getElementById("bgOverlay");
  const newGradient = TOD_GRADIENTS[tod];

  if (!overlay || !newGradient) {
    // Fallback: instant swap
    document.documentElement.setAttribute("data-tod", tod);
    _currentTOD = tod;
    return;
  }

  // Cancel any in-flight transition
  if (_todTimer) { clearTimeout(_todTimer); _todTimer = null; }

  // Place the incoming gradient on the overlay and fade it in
  overlay.style.background  = newGradient;
  overlay.style.transition  = "none";
  overlay.style.opacity     = "0";
  void overlay.offsetWidth; // force reflow so the reset lands
  overlay.style.transition  = "";
  overlay.style.opacity     = "1";

  // After the fade completes: bake the new gradient into the base, snap overlay away
  _todTimer = setTimeout(() => {
    document.documentElement.setAttribute("data-tod", tod);
    overlay.style.transition = "none";
    overlay.style.opacity    = "0";
    requestAnimationFrame(() => { overlay.style.transition = ""; });
    _currentTOD = tod;
    _todTimer   = null;
  }, 2600);
}

function initTOD() {
  _currentTOD = getCurrentTOD();
  document.documentElement.setAttribute("data-tod", _currentTOD);
  const tz = document.querySelector(".timezone");
  if (tz) tz.textContent = `Local time · ${TOD_LABELS[_currentTOD] || ""}`;
  setInterval(applyTOD, 60_000);
}

// ---- CANVAS BACKGROUND ANIMATION ------------------------------------------
// Clock-tick marks (tiny rectangles) float upward like sparks.
// Expanding rings grow from random points and fade — like a clock's ripple.

const PARTICLES = [];

function mkRgba(r, g, b, a) { return `rgba(${r},${g},${b},${a.toFixed(3)})`; }

function mkTick(W, H, randomY) {
  const maxLife = Math.random() * 420 + 180;
  return {
    type: "tick",
    x: Math.random() * W,
    y: randomY ? Math.random() * H : H + 20,
    pw: Math.random() * 1.6 + 0.5,
    ph: Math.random() * 10 + 4,
    angle: Math.random() * Math.PI,
    vx: (Math.random() - 0.5) * 0.28,
    vy: -(Math.random() * 0.55 + 0.18),
    op: 0, maxOp: Math.random() * 0.18 + 0.04,
    life: randomY ? Math.floor(Math.random() * maxLife) : 0,
    maxLife,
  };
}

function mkRing(W, H, randomLife) {
  const maxLife = Math.random() * 260 + 110;
  return {
    type: "ring",
    x: Math.random() * W,
    y: Math.random() * H,
    radius: 0,
    maxRadius: Math.random() * 95 + 35,
    op: 0, maxOp: Math.random() * 0.11 + 0.03,
    life: randomLife ? Math.floor(Math.random() * maxLife) : 0,
    maxLife,
  };
}

function stepTick(p, W, H) {
  p.life++; p.angle += 0.003; p.x += p.vx; p.y += p.vy;
  const t = p.life / p.maxLife;
  p.op = t < 0.15 ? (t / 0.15) * p.maxOp
       : t > 0.78 ? ((1 - t) / 0.22) * p.maxOp
       : p.maxOp;
  if (p.life >= p.maxLife || p.y < -30) Object.assign(p, mkTick(W, H, false));
}

function stepRing(p, W, H) {
  p.life++;
  const t = p.life / p.maxLife;
  p.radius = t * p.maxRadius;
  p.op = (1 - t) * p.maxOp;
  if (p.life >= p.maxLife) Object.assign(p, mkRing(W, H, false));
}

function drawP(p, ctx) {
  const { r, g, b, scale = 1.0 } = canvasRGB;
  const op = Math.min(p.op * scale, 0.55);
  ctx.save();
  if (p.type === "tick") {
    ctx.fillStyle = mkRgba(r, g, b, op);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillRect(-p.pw / 2, -p.ph / 2, p.pw, p.ph);
  } else {
    ctx.strokeStyle = mkRgba(r, g, b, op);
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ---- BUBBLE PARTICLES (mouse-reactive) -------------------------------------

const BUBBLES = [];
const bubbleMouse = { x: null, y: null };

function mkBubble(W, H, randomLife) {
  const maxLife = Math.random() * 700 + 400;
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    radius: Math.random() * 26 + 9,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    wander: Math.random() * Math.PI * 2,  // wandering angle
    op: 0,
    maxOp: Math.random() * 0.55 + 0.25,
    life: randomLife ? Math.floor(Math.random() * maxLife) : 0,
    maxLife,
  };
}

function stepBubble(b, W, H) {
  // Gentle wander force — slowly rotates the bubble's drift direction
  b.wander += (Math.random() - 0.5) * 0.08;
  b.vx += Math.cos(b.wander) * 0.013;
  b.vy += Math.sin(b.wander) * 0.013;

  // Mouse repulsion — pushes bubble away when cursor comes near
  if (bubbleMouse.x !== null) {
    const dx = b.x - bubbleMouse.x, dy = b.y - bubbleMouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const repelR = 110 + b.radius;
    if (dist < repelR && dist > 0.5) {
      const strength = ((repelR - dist) / repelR) * 0.95;
      b.vx += (dx / dist) * strength;
      b.vy += (dy / dist) * strength;
    }
  }

  // Damping + speed cap
  b.vx *= 0.955;
  b.vy *= 0.955;
  const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  if (spd > 2.2) { b.vx = b.vx / spd * 2.2; b.vy = b.vy / spd * 2.2; }

  b.x += b.vx;
  b.y += b.vy;

  // Soft boundary push (keeps bubbles on screen)
  const m = 40;
  if (b.x < m)     b.vx += 0.18;
  if (b.x > W - m) b.vx -= 0.18;
  if (b.y < m)     b.vy += 0.18;
  if (b.y > H - m) b.vy -= 0.18;

  // Opacity fade in/out over lifetime
  b.life++;
  const fadeTicks = 70;
  if (b.life < fadeTicks)               b.op = (b.life / fadeTicks) * b.maxOp;
  else if (b.life > b.maxLife - fadeTicks) b.op = ((b.maxLife - b.life) / fadeTicks) * b.maxOp;
  else                                  b.op = b.maxOp;

  if (b.life >= b.maxLife) Object.assign(b, mkBubble(W, H, false));
}

function drawBubble(b, ctx) {
  const r = canvasRGB.r, g = canvasRGB.g, bc = canvasRGB.b;
  const op = b.op;
  if (op <= 0.005) return;
  ctx.save();
  ctx.globalAlpha = op;

  // Translucent body — radial gradient off-centre for a 3D feel
  const gx = b.x - b.radius * 0.22, gy = b.y - b.radius * 0.28;
  const grad = ctx.createRadialGradient(gx, gy, 0, b.x, b.y, b.radius);
  grad.addColorStop(0,   `rgba(${r},${g},${bc},0.06)`);
  grad.addColorStop(0.55,`rgba(${r},${g},${bc},0.03)`);
  grad.addColorStop(1,   `rgba(${r},${g},${bc},0.11)`);
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Outer rim
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${r},${g},${bc},0.38)`;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Faint inner rim for depth
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius * 0.86, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${r},${g},${bc},0.07)`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Primary highlight (top-left)
  ctx.beginPath();
  ctx.arc(b.x - b.radius * 0.27, b.y - b.radius * 0.30, b.radius * 0.21, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.60)";
  ctx.fill();

  // Tiny secondary gleam (bottom-right)
  ctx.beginPath();
  ctx.arc(b.x + b.radius * 0.30, b.y + b.radius * 0.26, b.radius * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fill();

  ctx.restore();
}

// ---- CANVAS ----------------------------------------------------------------

function initCanvas() {
  const cv = document.getElementById("bgCanvas");
  if (!cv) return;
  const ctx = cv.getContext("2d");

  function resize() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  // Track mouse for bubble repulsion (raw pixels, not normalised)
  window.addEventListener("mousemove", (e) => {
    bubbleMouse.x = e.clientX;
    bubbleMouse.y = e.clientY;
  }, { passive: true });
  window.addEventListener("mouseleave", () => { bubbleMouse.x = bubbleMouse.y = null; }, { passive: true });

  // Touch support — treat touch as "mouse" for repulsion
  window.addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
      bubbleMouse.x = e.touches[0].clientX;
      bubbleMouse.y = e.touches[0].clientY;
    }
  }, { passive: true });
  window.addEventListener("touchend", () => { bubbleMouse.x = bubbleMouse.y = null; }, { passive: true });

  const W = () => cv.width, H = () => cv.height;
  for (let i = 0; i < 30; i++) PARTICLES.push(mkTick(W(), H(), true));
  for (let i = 0; i <  5; i++) PARTICLES.push(mkRing(W(), H(), true));
  for (let i = 0; i < 15; i++) BUBBLES.push(mkBubble(W(), H(), true));

  (function frame() {
    ctx.clearRect(0, 0, W(), H());
    PARTICLES.forEach((p) => {
      p.type === "tick" ? stepTick(p, W(), H()) : stepRing(p, W(), H());
      drawP(p, ctx);
    });
    BUBBLES.forEach((b) => {
      stepBubble(b, W(), H());
      drawBubble(b, ctx);
    });
    requestAnimationFrame(frame);
  })();
}

// ---- ELEMENTS --------------------------------------------------------------

const elements = {
  hourHand: document.getElementById("hourHand"),
  minuteHand: document.getElementById("minuteHand"),
  secondHand: document.getElementById("secondHand"),
  digitalTime: document.getElementById("digitalTime"),
  digitalDate: document.getElementById("digitalDate"),
  clockFace: document.getElementById("clockFace"),
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  clearTodayBtn: document.getElementById("clearTodayBtn"),
  sessionTime: document.getElementById("sessionTime"),
  sessionMeta: document.getElementById("sessionMeta"),
  timerStatus: document.getElementById("timerStatus"),
  todayTotal: document.getElementById("todayTotal"),
  todayPointsSummary: document.getElementById("todayPointsSummary"),
  todayStatusSummary: document.getElementById("todayStatusSummary"),
  todayHours: document.getElementById("todayHours"),
  todayPoints: document.getElementById("todayPoints"),
  todayRating: document.getElementById("todayRating"),
  historyList: document.getElementById("historyList"),
  monthLabel: document.getElementById("monthLabel"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  calendarDays: document.getElementById("calendarDays"),
  selectedDateLabel: document.getElementById("selectedDateLabel"),
  selectedDateHours: document.getElementById("selectedDateHours"),
  selectedDateRating: document.getElementById("selectedDateRating"),
  selectedDatePoints: document.getElementById("selectedDatePoints"),
  weekStripLabel: document.getElementById("weekStripLabel"),
  weekStripDays: document.getElementById("weekStripDays"),
  goalStreakCurrent: document.getElementById("goalStreakCurrent"),
  goalStreakBest: document.getElementById("goalStreakBest"),
  reportMonth: document.getElementById("reportMonth"),
  monthHours: document.getElementById("monthHours"),
  monthPoints: document.getElementById("monthPoints"),
  monthPercent: document.getElementById("monthPercent"),
  monthProgress: document.getElementById("monthProgress"),
  monthNote: document.getElementById("monthNote"),
  monthBestDay: document.getElementById("monthBestDay"),
  monthGoalHitDays: document.getElementById("monthGoalHitDays"),
  weekdayPatternRow: document.getElementById("weekdayPatternRow"),
  monthTrendValue: document.getElementById("monthTrendValue"),
  streakValue: document.getElementById("streakValue"),
  pomoToggleBtn: document.getElementById("pomoToggleBtn"),
  pomoSection: document.getElementById("pomoSection"),
  pomoPhaseLabel: document.getElementById("pomoPhaseLabel"),
  pomoTime: document.getElementById("pomoTime"),
  pomoCyclesNote: document.getElementById("pomoCyclesNote"),
  goalFill: document.getElementById("goalFill"),
  goalEditBtn: document.getElementById("goalEditBtn"),
};

// ---- STATE -----------------------------------------------------------------

const state = {
  currentMonth: new Date(),
  selectedDateKey: getLocalDateKey(new Date()),
  // All persistent values start as safe defaults;
  // the async init() function overwrites them from chrome.storage before any UI is shown.
  data:       { days: {}, labels: {}, running: { isRunning: false, sessionStart: null, activeStart: null, lastDateKey: null } },
  goal:       8,
  timeFormat: "hr-min",
  pomo:       { enabled: false, phase: "focus", endTime: null, cycles: 0, focusSec: 1500, breakSec: 300, breakEnabled: true },
  // Cached single-value storage keys (avoids async reads in hot paths)
  _theme:         "warm",
  _goalSetDate:   "",
  _goalCelebrated:"",
  _tourDone:      false,
};

// Transient session label chosen at start (not persisted mid-session)
let pendingSessionLabel = "";
const bodyScrollLocks = new Set();

// ---- PERSISTENCE -----------------------------------------------------------

async function loadData() {
  try {
    const raw = await Store.get(STORAGE_KEY);
    if (!raw) return defaultData();
    const p = JSON.parse(raw);
    return {
      days:    p.days    || {},
      labels:  p.labels  || {},
      running: p.running || emptyRunning(),
    };
  } catch { return defaultData(); }
}

function defaultData() {
  return { days: {}, labels: {}, running: emptyRunning() };
}

function emptyRunning() {
  return { isRunning: false, sessionStart: null, activeStart: null, lastDateKey: null };
}

async function loadGoal() {
  try {
    const r = await Store.get(GOAL_KEY);
    const v = r ? parseFloat(r) : 8;
    return Number.isFinite(v) && v > 0 ? v : 8;
  } catch { return 8; }
}

function saveGoal(v)       { Store.set(GOAL_KEY, String(v)); }
function loadGoalDate()    { return state._goalSetDate; }
function saveGoalDate(key) { state._goalSetDate = key; Store.set(GOAL_DATE_KEY, key); }
function goalAlreadySetToday() { return state._goalSetDate === getLocalDateKey(new Date()); }
function saveData()        { Store.set(STORAGE_KEY, JSON.stringify(state.data)); }

async function loadPomoSettings() {
  try {
    const raw = await Store.get(POMO_KEY);
    if (!raw) return { focusSec: 1500, breakSec: 300, breakEnabled: true };
    const p = JSON.parse(raw);
    // Migrate old focusMin/breakMin format
    const fSec = p.focusSec ?? (p.focusMin ? p.focusMin * 60 : 1500);
    const bSec = p.breakSec ?? (p.breakMin ? p.breakMin * 60 : 300);
    return {
      focusSec:     Math.max(1, Math.min(86399, Math.round(fSec))),
      breakSec:     Math.max(0, Math.min(86399, Math.round(bSec))),
      breakEnabled: p.breakEnabled !== false,
    };
  } catch { return { focusSec: 1500, breakSec: 300, breakEnabled: true }; }
}
function savePomoSettings() {
  Store.set(POMO_KEY, JSON.stringify({
    focusSec: state.pomo.focusSec, breakSec: state.pomo.breakSec, breakEnabled: state.pomo.breakEnabled,
  }));
}

function savePomoState() {
  const p = state.pomo;
  const ps = {
    active:       !!p.enabled,
    paused:       false,
    phase:        p.phase || "focus",
    endTime:      p.endTime || 0,
    remainingMs:  p.endTime ? Math.max(0, p.endTime - Date.now()) : 0,
    cycles:       p.cycles || 0,
    focusSec:     p.focusSec,
    breakSec:     p.breakSec,
    breakEnabled: p.breakEnabled,
    label:        pendingSessionLabel || "",
  };
  Store.set(POMO_STATE_KEY, JSON.stringify(ps));
  if (p.enabled && p.endTime && p.endTime > Date.now()) {
    chrome.runtime.sendMessage({ type: "POMO_SCHEDULE", phaseEndAt: p.endTime }).catch(() => {});
  } else {
    chrome.runtime.sendMessage({ type: "POMO_CANCEL" }).catch(() => {});
  }
}
function pomoFocusMs() { return state.pomo.focusSec * 1000; }
function pomoBreakMs() {
  return (state.pomo.breakEnabled && state.pomo.breakSec > 0) ? state.pomo.breakSec * 1000 : 0;
}
async function loadTimeFormat() {
  const f = await Store.get(TIME_FORMAT_KEY);
  return ["hr","hr-min","hr-min-sec"].includes(f) ? f : "hr-min";
}

// ---- DATE UTILS ------------------------------------------------------------

function getLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function getMidnight(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function getNextMidnight(dateKey) {
  const mn = getMidnight(dateKey);
  mn.setDate(mn.getDate() + 1);
  return mn;
}

function hoursFromMs(ms) { return ms / 36e5; }
function formatHours(ms) { return hoursFromMs(ms).toFixed(2); }  // kept for chart math

// Format a duration (ms) as a human-readable string obeying state.timeFormat
function formatTime(ms) {
  const totalS = Math.floor(ms / 1000);
  const h = Math.floor(totalS / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  const fmt = state.timeFormat;
  if (fmt === "hr") return `${(ms / 3600000).toFixed(2)} hrs`;
  if (fmt === "hr-min-sec") {
    if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`;
    if (m > 0) return `${m}m ${String(s).padStart(2,"0")}s`;
    return `${s}s`;
  }
  // hr-min (default)
  if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
  return `${m}m`;
}
// Format a pomo countdown (ms remaining) — always MM:SS or H:MM:SS regardless of time format
function formatCountdown(ms) {
  const totalS = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalS / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2,"0")}:${String(Math.floor((s % 3600) / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
}

function formatDigitalTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function formatLongDate(date) {
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatShortDate(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { month: "short", day: "numeric" });
}

function currentGoalHours() {
  return state.goal > 0 ? state.goal : 8;
}

function lockBodyScroll(source) {
  if (!source) return;
  bodyScrollLocks.add(source);
  document.body.style.overflow = "hidden";
}

function unlockBodyScroll(source) {
  if (!source) return;
  bodyScrollLocks.delete(source);
  if (bodyScrollLocks.size === 0) {
    document.body.style.overflow = "";
  }
}

function ratingForHours(h, goal) {
  // goal defaults to the current daily goal (or 8h if unset)
  const g = (goal > 0 ? goal : currentGoalHours());
  // Tier thresholds are all fractions of the daily goal.
  // Note: goals >= ~12h make Premium (2×) unreachable in a 24h day — by design.
  if (h >= g * 2)   return { label: "Premium",       className: "status-premium" };
  if (h >= g * 1.5) return { label: "Excellent",     className: "status-excellent" };
  if (h >= g)       return { label: "Perfect",       className: "status-perfect" };
  if (h >= g / 2)   return { label: "Good",          className: "status-good" };
  if (h >= g / 4)   return { label: "Average",       className: "status-avg" };
  return                    { label: "Below average", className: "status-low" };
}

// ---- TIME TRACKING ---------------------------------------------------------

function addMsToDay(dateKey, ms) {
  state.data.days[dateKey] = (state.data.days[dateKey] || 0) + ms;
}

function allocateMsAcrossDays(start, end) {
  let cur = new Date(start);
  while (cur < end) {
    const key = getLocalDateKey(cur);
    const nxt = getNextMidnight(key);
    const slice = (end < nxt ? end : nxt) - cur;
    if (slice > 0) addMsToDay(key, slice);
    cur = end < nxt ? end : nxt;
  }
}

function getLiveDayMs(dateKey) {
  let total = state.data.days[dateKey] || 0;
  const r = state.data.running;
  if (r.isRunning && r.lastDateKey === dateKey) {
    const now = new Date(), as = new Date(r.activeStart);
    if (now > as) total += now - as;
  }
  return total;
}

function getMonthTotalMs(year, monthIndex) {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2,"0")}`;
  let total = Object.entries(state.data.days)
    .filter(([k]) => k.startsWith(prefix))
    .reduce((s, [, v]) => s + v, 0);
  const r = state.data.running;
  if (r.isRunning && r.lastDateKey && r.lastDateKey.startsWith(prefix)) {
    const now = new Date(), as = new Date(r.activeStart);
    if (now > as) total += now - as;
  }
  return total;
}

// ---- STREAK ----------------------------------------------------------------

function calculateStreak() {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (getLiveDayMs(getLocalDateKey(d)) > 0) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function refreshStreak() {
  if (!elements.streakValue) return;
  const s = calculateStreak();
  elements.streakValue.textContent = (s === 1 ? "1 day" : `${s} days`) + (s >= 3 ? " 🔥" : "");
}

// ---- GOAL BAR --------------------------------------------------------------

function refreshGoalBar() {
  if (!elements.goalFill || !elements.goalEditBtn) return;
  const ms   = getLiveDayMs(getLocalDateKey(new Date()));
  const goal = currentGoalHours();
  const pct  = Math.min((hoursFromMs(ms) / goal) * 100, 100);
  elements.goalFill.style.width    = `${pct.toFixed(1)}%`;
  elements.goalEditBtn.textContent = formatTime(goal * 3600000);

  const todayKey       = getLocalDateKey(new Date());
  const celebratedDate = state._goalCelebrated;

  if (pct >= 100 && celebratedDate !== todayKey) {
    state._goalCelebrated = todayKey;
    Store.set(GOAL_CELEBRATED_KEY, todayKey);
    burstConfetti();
  }
}

function editGoal() {
  const modal = document.getElementById("goalModal");
  if (!modal) return;

  const locked   = goalAlreadySetToday();
  const card     = modal.querySelector(".modal-card");
  const warn     = document.getElementById("goalModalWarn");
  const okBtn    = document.getElementById("goalModalOk");
  const titleEl  = modal.querySelector(".modal-title");

  // Apply / remove locked state on the card
  if (card)    card.classList.toggle("goal-modal-locked", locked);
  if (warn)    warn.hidden = !locked;
  if (okBtn)   okBtn.disabled = locked;
  if (titleEl) titleEl.textContent = locked ? "Today's goal" : "Set your focus target";

  const totalSec = Math.round(state.goal * 3600);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const fmt = state.timeFormat;

  // Ensure rows are shown/hidden correctly for the current format
  const floatRow = document.getElementById("goalFloatRow");
  const hmRow    = document.getElementById("goalHMRow");
  const goalSEls = document.querySelectorAll(".goal-s-input, .goal-s-unit");
  if (floatRow) floatRow.hidden = fmt !== "hr";
  if (hmRow)    hmRow.hidden    = fmt === "hr";
  goalSEls.forEach(el => { el.hidden = fmt !== "hr-min-sec"; });

  let focusEl;
  if (fmt === "hr") {
    const floatEl = document.getElementById("goalModalInput");
    if (floatEl) { floatEl.value = (totalSec / 3600).toFixed(2); floatEl.readOnly = locked; }
    focusEl = locked ? null : floatEl;
  } else {
    const hEl = document.getElementById("goalModalH");
    const mEl = document.getElementById("goalModalM");
    const sEl = document.getElementById("goalModalS");
    if (hEl) { hEl.value = h; hEl.readOnly = locked; }
    if (mEl) { mEl.value = m; mEl.readOnly = locked; }
    if (sEl) { sEl.value = s; sEl.readOnly = locked; }
    focusEl = locked ? null : hEl;
  }

  modal.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    modal.classList.add("open");
    if (focusEl) { focusEl.focus(); focusEl.select(); }
  }));
}

function closeGoalModal() {
  const modal = document.getElementById("goalModal");
  if (!modal) return;
  modal.classList.remove("open");
  setTimeout(() => {
    modal.hidden = true;
    _goalConfirmPending = false;
    // Reset all transient UI back to clean defaults
    modal.querySelector(".modal-card")?.classList.remove("goal-modal-locked");
    const okBtn = document.getElementById("goalModalOk");
    if (okBtn) { okBtn.disabled = false; okBtn.textContent = "Save Goal"; okBtn.classList.remove("goal-ok-confirm"); }
    const confirmWarn = document.getElementById("goalModalConfirmWarn");
    if (confirmWarn) confirmWarn.hidden = true;
    [document.getElementById("goalModalInput"),
     document.getElementById("goalModalH"),
     document.getElementById("goalModalM"),
     document.getElementById("goalModalS")].forEach(el => { if (el) el.readOnly = false; });
  }, 350);
}

let _goalConfirmPending = false;

function _readGoalInputs() {
  const fmt = state.timeFormat;
  if (fmt === "hr") {
    const val = parseFloat(document.getElementById("goalModalInput")?.value || "0");
    return isNaN(val) ? 0 : Math.max(0, val);
  }
  const h = Math.max(0, parseInt(document.getElementById("goalModalH")?.value || "0", 10) || 0);
  const m = Math.max(0, Math.min(59, parseInt(document.getElementById("goalModalM")?.value || "0", 10) || 0));
  const s = fmt === "hr-min-sec"
    ? Math.max(0, Math.min(59, parseInt(document.getElementById("goalModalS")?.value || "0", 10) || 0))
    : 0;
  return h + m / 60 + s / 3600;
}

function doSaveGoal() {
  // Already locked — should not reach here, but guard anyway
  if (goalAlreadySetToday()) { closeGoalModal(); return; }

  const okBtn       = document.getElementById("goalModalOk");
  const confirmWarn = document.getElementById("goalModalConfirmWarn");

  if (!_goalConfirmPending) {
    // Step 1 — show the once-per-day warning, wait for second click to confirm
    _goalConfirmPending = true;
    if (confirmWarn) confirmWarn.hidden = false;
    if (okBtn) {
      okBtn.textContent = "Yes, Save";
      okBtn.classList.add("goal-ok-confirm");
    }
    // Lock the inputs so the user can't change the value after seeing the warning
    [document.getElementById("goalModalInput"),
     document.getElementById("goalModalH"),
     document.getElementById("goalModalM"),
     document.getElementById("goalModalS")].forEach(el => { if (el) el.readOnly = true; });
    return;
  }

  // Step 2 — user confirmed; actually save
  const decimalHours = _readGoalInputs();
  if (decimalHours > 0) {
    state.goal = decimalHours;
    saveGoal(decimalHours);
    saveGoalDate(getLocalDateKey(new Date()));
    state._goalCelebrated = ""; Store.remove(GOAL_CELEBRATED_KEY);
    refreshAll();
  }
  closeGoalModal();
}

// ---- CONFETTI --------------------------------------------------------------

function burstConfetti() {
  const VW = window.innerWidth, VH = window.innerHeight;
  const colors = [
    "#f2c14e","#f5d76e","#e8b84b",   // gold family
    "#f17c58","#ef6a3f","#e85d3a",   // warm accent
    "#2f8f9d","#3db8c8","#56cfe1",   // teal family
    "#4c956c","#57b87a","#c3e6cb",   // green
    "#e2a8e4","#b87aca","#ffffff",   // purple + white
  ];

  function spawn(x, y, tx, ty, size, isRibbon, color, delay, dur) {
    const p = document.createElement("span");
    p.className = "confetti-piece";
    const rot = Math.random() * 900 - 450;
    p.style.setProperty("--tx", `${tx}px`);
    p.style.setProperty("--ty", `${ty}px`);
    p.style.setProperty("--rot", `${rot}deg`);
    p.style.setProperty("--dur", `${dur}s`);
    p.style.setProperty("--delay", `${delay}s`);
    p.style.setProperty("--sf", `${0.5 + Math.random() * 0.4}`);
    p.style.left   = `${x}px`;
    p.style.top    = `${y}px`;
    p.style.background = color;
    if (isRibbon) {
      p.style.width  = `${size * 3.5}px`;
      p.style.height = `${size * 0.9}px`;
      p.style.borderRadius = "2px";
    } else {
      p.style.width  = `${size}px`;
      p.style.height = `${size}px`;
      p.style.borderRadius = Math.random() > 0.45 ? "50%" : "3px";
    }
    document.body.appendChild(p);
    p.addEventListener("animationend", () => p.remove(), { once: true });
  }

  // ── Phase 1: Burst from viewport center-top (60 pieces, immediate) ──
  const bx = VW / 2, by = VH * 0.12;
  for (let i = 0; i < 60; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = 220 + Math.random() * 320;
    const gravity = VH * 0.55 + Math.random() * VH * 0.35;
    const tx = Math.cos(angle) * speed * (0.7 + Math.random() * 0.6);
    const ty = Math.sin(angle) * speed * 0.5 + gravity;
    const size = 6 + Math.random() * 10;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const ribbon = Math.random() > 0.42;
    spawn(bx, by, tx, ty, size, ribbon, color, Math.random() * 0.18, 2.2 + Math.random() * 0.8);
  }

  // ── Phase 2: Cascade rain from random top positions (80 pieces, slight delay) ──
  for (let i = 0; i < 80; i++) {
    const x  = Math.random() * VW;
    const tx = (Math.random() - 0.5) * 180;
    const ty = VH * 0.65 + Math.random() * VH * 0.42;
    const size = 5 + Math.random() * 11;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const ribbon = Math.random() > 0.38;
    spawn(x, -10, tx, ty, size, ribbon, color, 0.08 + Math.random() * 0.55, 2.4 + Math.random() * 1.2);
  }

  // ── Goal toast ──
  const toast = document.createElement("div");
  toast.className = "goal-toast";
  toast.innerHTML = '<span class="goal-toast-icon">★</span> Daily Goal Reached!';
  document.body.appendChild(toast);
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
}

// ---- CARD SHIMMER ----------------------------------------------------------

function shimmerCard(cardEl) {
  if (!cardEl) return;
  const el = document.createElement("span");
  el.className = "card-shimmer";
  cardEl.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

// ---- POMODORO --------------------------------------------------------------

function playChime(isFocusEnd) {
  try {
    const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
    const ctx = new AC();
    (isFocusEnd ? [440, 660, 880] : [880, 660]).forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = "sine";
      const t = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t); osc.stop(t + 0.45);
    });
  } catch (_) {}
}

function updatePomoDisplay() {
  if (!elements.pomoSection) return;
  const p = state.pomo;
  if (!p.enabled) {
    elements.pomoSection.hidden = true;
    elements.pomoToggleBtn.textContent = "Pomodoro";
    elements.pomoToggleBtn.classList.remove("pomo-active");
    if (elements.startBtn && !state.data.running.isRunning) elements.startBtn.textContent = "Start Working";
    return;
  }
  elements.pomoSection.hidden = false;
  elements.pomoToggleBtn.textContent = "Pomodoro on";
  elements.pomoToggleBtn.classList.add("pomo-active");
  if (elements.startBtn && !state.data.running.isRunning) elements.startBtn.textContent = "Start Focus";
  if (p.endTime) {
    elements.pomoTime.textContent = formatCountdown(Math.max(0, p.endTime - Date.now()));
  } else {
    const durMs = p.phase === "focus" ? pomoFocusMs() : pomoBreakMs();
    elements.pomoTime.textContent = formatCountdown(durMs);
  }
  elements.pomoPhaseLabel.textContent  = p.phase === "focus" ? "Focus" : "Break";
  elements.pomoPhaseLabel.className    = `pomo-phase-label${p.phase === "break" ? " break" : ""}`;
  elements.pomoCyclesNote.textContent  = p.cycles === 1 ? "1 cycle completed" : `${p.cycles} cycles completed`;
}

function tickPomodoro() {
  const p = state.pomo;
  if (!p.enabled || !p.endTime) return;
  if (Date.now() >= p.endTime) {
    if (p.phase === "focus") {
      p.cycles++;
      playChime(true);
      if (pomoBreakMs() > 0) {
        p.phase    = "break";
        p.endTime  = Date.now() + pomoBreakMs();
        focusTotalMs = pomoBreakMs();
      } else {
        p.endTime = null;
        if (readingPomoActive) showSplitPomoDone(); else showFocusDonePrompt();
      }
    } else {
      p.endTime = null;
      if (readingPomoActive) showSplitPomoDone(); else showFocusDonePrompt();
    }
    savePomoState();
  }
  updatePomoDisplay();
  if (readingPomoActive) updateSplitFocusPanel(); else updateFocusOverlay();
}

// ─── Focus Mode Overlay ───────────────────────────────────────────────────────

let focusTotalMs    = 0;
let focusHideTimer  = null;
let focusFromReading = false;  // true when standalone focus was spawned from reading split

function openFocusOverlay() {
  const ov = document.getElementById("focusOverlay");
  if (!ov) return;
  if (focusHideTimer) { clearTimeout(focusHideTimer); focusHideTimer = null; }
  document.getElementById("focusBody").hidden = false;
  document.getElementById("focusDoneWrap").hidden = true;
  focusTotalMs = pomoFocusMs();
  ov.hidden = false;
  ov.removeAttribute("inert");
  ov.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    ov.classList.add("is-open");
    updateFocusOverlay();
  });
  lockBodyScroll("focus");
}

function closeFocusOverlay() {
  const ov = document.getElementById("focusOverlay");
  if (!ov) return;
  ov.classList.remove("is-open");
  ov.setAttribute("aria-hidden", "true");
  ov.setAttribute("inert", "");
  if (focusHideTimer) clearTimeout(focusHideTimer);
  focusHideTimer = setTimeout(() => {
    ov.hidden = true;
    focusHideTimer = null;
  }, 560);
  unlockBodyScroll("focus");
}

function focusOverlayIsOpen() {
  const ov = document.getElementById("focusOverlay");
  return !!ov && ov.classList.contains("is-open");
}

function updateFocusOverlay() {
  if (!focusOverlayIsOpen()) return;
  const p = state.pomo;
  const isBreak = p.phase === "break";
  const countdown  = document.getElementById("focusCountdown");
  const phaseLabel = document.getElementById("focusPhaseLabel");
  const subLabel   = document.getElementById("focusSubLabel");
  const ringFill   = document.getElementById("focusRingFill");

  if (p.endTime) {
    const rem  = Math.max(0, p.endTime - Date.now());
    const circ = 2 * Math.PI * 86; // 540.35
    if (countdown) {
      countdown.textContent = formatCountdown(rem);
      countdown.classList.toggle("has-hours", rem >= 3600000);
    }
    if (ringFill && focusTotalMs > 0) {
      const pct = Math.min(1, rem / focusTotalMs);
      ringFill.style.strokeDashoffset = String(circ * (1 - pct));
    }
  }

  if (phaseLabel) {
    phaseLabel.textContent = isBreak ? "BREAK" : "FOCUS";
    phaseLabel.classList.toggle("is-break", isBreak);
  }
  if (countdown) countdown.classList.toggle("is-break", isBreak);
  if (subLabel)  subLabel.textContent = isBreak ? "Rest your eyes. Breathe." : "Stay in the zone.";
  if (ringFill) {
    const cs = getComputedStyle(document.documentElement);
    ringFill.style.stroke = isBreak
      ? (cs.getPropertyValue("--teal").trim() || "#39d0e0")
      : (cs.getPropertyValue("--accent").trim() || "#ff7b54");
  }
}

function showFocusDonePrompt() {
  const body     = document.getElementById("focusBody");
  const done     = document.getElementById("focusDoneWrap");
  const cyclesEl = document.getElementById("focusDoneCycles");
  if (body) body.hidden = true;
  if (done) done.hidden = false;
  if (cyclesEl) {
    const n = state.pomo.cycles;
    cyclesEl.textContent = `${n} cycle${n !== 1 ? "s" : ""} completed`;
  }
}

function _focusEnd_returnOrStop() {
  state.pomo.endTime = null;
  state.pomo.enabled = false;
  savePomoState();
  closeFocusOverlay();
  if (focusFromReading) {
    focusFromReading = false;
    // Reading session is still running — reopen reading overlay
    openReadingOverlay();
  } else if (state.data.running.isRunning) {
    stopTimer();
  } else {
    updatePomoDisplay();
  }
}

function initFocusOverlay() {
  document.getElementById("focusStopBtn")?.addEventListener("click", _focusEnd_returnOrStop);

  document.getElementById("focusSameBtn")?.addEventListener("click", () => {
    const p = state.pomo;
    p.phase   = "focus";
    p.endTime = Date.now() + pomoFocusMs();
    focusTotalMs = pomoFocusMs();
    document.getElementById("focusBody").hidden    = false;
    document.getElementById("focusDoneWrap").hidden = true;
    updateFocusOverlay();
    updatePomoDisplay();
    savePomoState();
    playChime(false);
  });

  document.getElementById("focusNewBtn")?.addEventListener("click", () => {
    state.pomo.endTime = null;
    state.pomo.enabled = false;
    closeFocusOverlay();
    if (focusFromReading) {
      focusFromReading = false;
      openReadingOverlay();
    } else {
      if (state.data.running.isRunning) stopTimer();
      else updatePomoDisplay();
      document.querySelector(".timer-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  document.getElementById("focusQuitBtn")?.addEventListener("click", _focusEnd_returnOrStop);
}

// ─── Reading Mode Overlay ────────────────────────────────────────────────────

let readingPomoActive  = false;
let splitSelectedPanel = null;  // "reading" | "focus" | null
let readingHideTimer   = null;

function updateSplitSelection() {
  const rPanel       = document.getElementById("splitReadingPanel");
  const fPanel       = document.getElementById("splitFocusPanel");
  const splitEl      = document.getElementById("readingSplit");
  const panelStopBtn = document.getElementById("splitPanelStopBtn");
  if (!rPanel || !fPanel) return;
  const sel = splitSelectedPanel;
  rPanel.classList.toggle("is-selected", sel === "reading");
  rPanel.classList.toggle("is-dimmed",   sel === "focus");
  fPanel.classList.toggle("is-selected", sel === "focus");
  fPanel.classList.toggle("is-dimmed",   sel === "reading");
  if (splitEl) {
    splitEl.classList.toggle("has-selection",   sel !== null);
    splitEl.classList.toggle("focus-selected",  sel === "focus");
    splitEl.classList.toggle("reading-selected", sel === "reading");
  }
  if (panelStopBtn) {
    panelStopBtn.hidden = sel === null;
    if (sel) panelStopBtn.textContent = sel === "reading" ? "Stop Working" : "Stop Focus";
  }
}

function setSplitSelection(panel) {
  splitSelectedPanel = panel;
  updateSplitSelection();
}

function readingOverlayIsOpen() {
  const ov = document.getElementById("readingOverlay");
  return !!ov && ov.classList.contains("is-open");
}

function openReadingOverlay() {
  const ov = document.getElementById("readingOverlay");
  if (!ov) return;
  if (readingHideTimer) { clearTimeout(readingHideTimer); readingHideTimer = null; }
  splitSelectedPanel = null;
  updateSplitSelection();
  document.getElementById("readingMain").hidden    = false;
  document.getElementById("readingPomoSetup").hidden = true;
  document.getElementById("readingSplit").hidden   = true;
  document.getElementById("splitControls").hidden  = true;
  _writeTimeEntry("rovFocusH","rovFocusM","rovFocusS", state.pomo.focusSec);
  _writeTimeEntry("rovBreakH","rovBreakM","rovBreakS", state.pomo.breakSec);
  const rovBreak = document.getElementById("rovBreakCheck");
  if (rovBreak) rovBreak.checked = state.pomo.breakEnabled;
  const rovEntry = document.getElementById("rovBreakEntry");
  if (rovEntry) rovEntry.classList.toggle("disabled", !state.pomo.breakEnabled);
  const pomoBtn = document.getElementById("readingPomoToggle");
  if (pomoBtn) { pomoBtn.textContent = "Focus Mode"; pomoBtn.classList.remove("active"); }
  ov.hidden = false;
  ov.removeAttribute("inert");
  ov.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    ov.classList.add("is-open");
    updateReadingOverlay();
  });
  lockBodyScroll("reading");
}

function closeReadingOverlay() {
  const ov = document.getElementById("readingOverlay");
  if (!ov) return;
  ov.classList.remove("is-open");
  ov.setAttribute("aria-hidden", "true");
  ov.setAttribute("inert", "");
  if (readingHideTimer) clearTimeout(readingHideTimer);
  readingHideTimer = setTimeout(() => {
    ov.hidden = true;
    readingHideTimer = null;
  }, 560);
  unlockBodyScroll("reading");
  readingPomoActive  = false;
  splitSelectedPanel = null;
}

function formatElapsed(ms) {
  const totalS = Math.floor(ms / 1000);
  const h = Math.floor(totalS / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function updateReadingOverlay() {
  if (!readingOverlayIsOpen()) return;
  const r = state.data.running;
  const elapsed = r.sessionStart ? Math.max(0, Date.now() - new Date(r.sessionStart).getTime()) : 0;
  const fmt = formatElapsed(elapsed);
  const el1 = document.getElementById("readingElapsed");
  const el2 = document.getElementById("splitElapsed");
  if (el1) el1.textContent = fmt;
  if (el2) el2.textContent = fmt;

  const cs = getComputedStyle(document.documentElement);
  const accentColor = cs.getPropertyValue("--accent").trim() || "#ff7b54";
  const todayHours = hoursFromMs(getLiveDayMs(getLocalDateKey(new Date())));
  const pct = Math.min(1, state.goal > 0 ? todayHours / state.goal : 0);
  const CIRC_86 = 2 * Math.PI * 86;
  const CIRC_66 = 2 * Math.PI * 66;

  const rf = document.getElementById("readingRingFill");
  if (rf) { rf.style.strokeDashoffset = String(CIRC_86 * (1 - pct)); rf.style.stroke = accentColor; }
  const srf = document.getElementById("splitReadFill");
  if (srf) { srf.style.strokeDashoffset = String(CIRC_66 * (1 - pct)); srf.style.stroke = accentColor; }

  if (readingPomoActive) updateSplitFocusPanel();
}

function updateSplitFocusPanel() {
  const p = state.pomo;
  const isBreak = p.phase === "break";
  const countdown  = document.getElementById("splitCountdown");
  const focusLabel = document.getElementById("splitFocusLabel");
  const focusSub   = document.getElementById("splitFocusSub");
  const sfFill     = document.getElementById("splitFocusFill");
  const CIRC_66 = 2 * Math.PI * 66; // 414.69
  const cs = getComputedStyle(document.documentElement);

  if (focusLabel) { focusLabel.textContent = isBreak ? "BREAK" : "FOCUS"; focusLabel.classList.toggle("is-break", isBreak); }
  if (countdown)  { countdown.classList.toggle("is-break", isBreak); }
  if (focusSub)   { focusSub.textContent = isBreak ? "rest & breathe" : "stay focused"; }

  if (p.endTime) {
    const rem  = Math.max(0, p.endTime - Date.now());
    if (countdown) {
      countdown.textContent = formatCountdown(rem);
      countdown.classList.toggle("has-hours", rem >= 3600000);
    }
    if (sfFill && focusTotalMs > 0) {
      const pct = Math.min(1, rem / focusTotalMs);
      const col = isBreak ? (cs.getPropertyValue("--teal").trim() || "#39d0e0") : (cs.getPropertyValue("--accent").trim() || "#ff7b54");
      sfFill.style.strokeDashoffset = String(CIRC_66 * (1 - pct));
      sfFill.style.stroke = col;
    }
  }
}

function showSplitPomoDone() {
  const countEl  = document.getElementById("splitFocusCount");
  const doneEl   = document.getElementById("splitPomoDone");
  const cyclesEl = document.getElementById("splitDoneCycles");
  if (countEl) countEl.hidden = true;
  if (doneEl)  doneEl.hidden  = false;
  if (cyclesEl) {
    const n = state.pomo.cycles;
    cyclesEl.textContent = `${n} cycle${n !== 1 ? "s" : ""} completed`;
  }
}

function startReadingPomo() {
  const fSec = _readTimeEntry("rovFocusH","rovFocusM","rovFocusS", 1, 86399);
  const bSec = _readTimeEntry("rovBreakH","rovBreakM","rovBreakS", 0, 86399);
  const bEnabled = document.getElementById("rovBreakCheck")?.checked ?? true;
  state.pomo.focusSec     = fSec;
  state.pomo.breakSec     = bSec;
  state.pomo.breakEnabled = bEnabled && bSec > 0;
  savePomoSettings();

  state.pomo.enabled = true;
  state.pomo.phase   = "focus";
  state.pomo.cycles  = 0;
  state.pomo.endTime = Date.now() + pomoFocusMs();
  focusTotalMs       = pomoFocusMs();
  readingPomoActive  = true;

  document.getElementById("readingMain").hidden    = true;
  document.getElementById("readingSplit").hidden   = false;
  document.getElementById("splitControls").hidden  = false;
  document.getElementById("splitFocusCount").hidden = false;
  document.getElementById("splitPomoDone").hidden  = true;

  updateReadingOverlay();
  updatePomoDisplay();
}

function endReadingPomo() {
  state.pomo.enabled = false;
  state.pomo.endTime = null;
  readingPomoActive  = false;
  splitSelectedPanel = null;

  document.getElementById("readingSplit").hidden   = true;
  document.getElementById("splitControls").hidden  = true;
  document.getElementById("readingMain").hidden    = false;
  document.getElementById("readingPomoSetup").hidden = true;
  const pomoBtn = document.getElementById("readingPomoToggle");
  if (pomoBtn) { pomoBtn.textContent = "Focus Mode"; pomoBtn.classList.remove("active"); }

  updatePomoDisplay();
  updateReadingOverlay();
}

function initReadingOverlay() {
  // ── Reading-only controls ────────────────────────────────
  document.getElementById("readingPomoToggle")?.addEventListener("click", () => {
    const setup   = document.getElementById("readingPomoSetup");
    const btn     = document.getElementById("readingPomoToggle");
    const showing = !setup.hidden;
    setup.hidden  = showing;
    if (btn) btn.classList.toggle("active", !showing);
  });

  document.getElementById("readingPomoCancel")?.addEventListener("click", () => {
    document.getElementById("readingPomoSetup").hidden = true;
    document.getElementById("readingPomoToggle")?.classList.remove("active");
  });

  document.getElementById("readingPomoStart")?.addEventListener("click", startReadingPomo);

  document.getElementById("readingStopBtn")?.addEventListener("click", () => {
    closeReadingOverlay();
    stopTimer();
  });

  // ── Reading overlay break toggle ─────────────────────────
  const rovBreakCheck = document.getElementById("rovBreakCheck");
  const rovBreakEntry = document.getElementById("rovBreakEntry");
  if (rovBreakCheck) {
    rovBreakCheck.addEventListener("change", () => {
      if (rovBreakEntry) rovBreakEntry.classList.toggle("disabled", !rovBreakCheck.checked);
    });
  }

  // ── Split-view panel selection ───────────────────────────
  function onPanelClick(panelKey, e) {
    if (e.target.closest("button, input, label")) return; // let inner controls work
    setSplitSelection(splitSelectedPanel === panelKey ? null : panelKey);
  }
  document.getElementById("splitReadingPanel")?.addEventListener("click", (e) => onPanelClick("reading", e));
  document.getElementById("splitFocusPanel")  ?.addEventListener("click", (e) => onPanelClick("focus",   e));

  // ── Split-view stop buttons ──────────────────────────────

  // "Stop Session" — always ends everything
  document.getElementById("splitStopBtn")?.addEventListener("click", () => {
    splitSelectedPanel = null;
    closeReadingOverlay();
    stopTimer();
  });

  // "Stop [Reading / Focus]" — stops only the selected panel
  document.getElementById("splitPanelStopBtn")?.addEventListener("click", () => {
    if (splitSelectedPanel === "focus") {
      // End focus, reading-only continues
      endReadingPomo();

    } else if (splitSelectedPanel === "reading") {
      // Stop reading session; focus continues in standalone overlay
      const savedPhase   = state.pomo.phase;
      const savedEndTime = state.pomo.endTime;
      const savedCycles  = state.pomo.cycles;
      const savedTotal   = focusTotalMs;
      splitSelectedPanel = null;
      stopTimer();                  // saves session, resets pomo.enabled
      state.pomo.enabled  = true;
      state.pomo.phase    = savedPhase;
      state.pomo.endTime  = savedEndTime;
      state.pomo.cycles   = savedCycles;
      focusFromReading    = false;
      openFocusOverlay();
      focusTotalMs = savedTotal;    // restore after openFocusOverlay() resets it
    }
  });

  // ── Round-complete prompt inside focus panel ─────────────
  document.getElementById("splitSameTimeBtn")?.addEventListener("click", () => {
    document.getElementById("splitFocusCount").hidden = false;
    document.getElementById("splitPomoDone").hidden   = true;
    state.pomo.phase   = "focus";
    state.pomo.endTime = Date.now() + pomoFocusMs();
    focusTotalMs       = pomoFocusMs();
    updateSplitFocusPanel();
    updatePomoDisplay();
    playChime(false);
  });

  document.getElementById("splitEndPomoBtn")?.addEventListener("click", endReadingPomo);
}

function togglePomodoro() {
  state.pomo.enabled = !state.pomo.enabled;
  if (!state.pomo.enabled) state.pomo.endTime = null;
  updatePomoDisplay();
  savePomoState();
}

// ---- CLOCK -----------------------------------------------------------------

function updateClock() {
  const now = new Date(), s = now.getSeconds(), m = now.getMinutes() + s / 60, h = (now.getHours() % 12) + m / 60;
  elements.secondHand.style.transform = `translateX(-50%) rotate(${s * 6}deg)`;
  elements.minuteHand.style.transform = `translateX(-50%) rotate(${m * 6}deg)`;
  elements.hourHand.style.transform   = `translateX(-50%) rotate(${h * 30}deg)`;
  elements.digitalTime.textContent    = formatDigitalTime(now);
  elements.digitalDate.textContent    = formatLongDate(now);
}

function buildClockTicks() {
  if (!elements.clockFace) return;
  for (let i = 0; i < 60; i++) {
    const t = document.createElement("span");
    t.className = i % 5 === 0 ? "tick bold" : "tick";
    t.style.transform = `translateX(-50%) rotate(${i * 6}deg)`;
    elements.clockFace.appendChild(t);
  }
}

// ---- DISPLAY / SUMMARY -----------------------------------------------------

function refreshTodaySummary() {
  const ms   = getLiveDayMs(getLocalDateKey(new Date()));
  const goal = currentGoalHours();
  const h    = hoursFromMs(ms), r = ratingForHours(h, goal);
  elements.todayTotal.textContent         = formatTime(ms);
  elements.todayPointsSummary.textContent = formatTime(ms);
  elements.todayHours.textContent         = formatTime(ms);
  elements.todayPoints.textContent        = formatTime(ms);
  // Status label + colour class on both display elements
  [elements.todayStatusSummary, elements.todayRating].forEach(el => {
    if (!el) return;
    el.textContent = r.label;
    el.className = el.className.replace(/\bstatus-\S+/g, "").trim();
    el.classList.add(r.className);
  });
}

function updateSessionDisplay() {
  const run = state.data.running;
  const activeLabel = document.getElementById("sessionActiveLabel");
  if (run.isRunning && run.sessionStart) {
    const start = new Date(run.sessionStart);
    elements.sessionTime.textContent = formatDuration(new Date() - start);
    elements.sessionMeta.textContent = `Started at ${formatDigitalTime(start)}`;
    elements.timerStatus.textContent = "Running";
    elements.timerStatus.className   = "pill running";
    if (activeLabel) activeLabel.textContent = pendingSessionLabel ? `"${pendingSessionLabel}"` : "";
  } else {
    elements.sessionTime.textContent = "00:00:00";
    elements.sessionMeta.textContent = "No active session";
    elements.timerStatus.textContent = "Paused";
    elements.timerStatus.className   = "pill";
    if (activeLabel) activeLabel.textContent = "";
  }
  elements.startBtn.disabled = run.isRunning;
  elements.stopBtn.disabled  = !run.isRunning;
  elements.startBtn.textContent = run.isRunning ? "Running…" : (state.pomo.enabled ? "Start Focus" : "Start Working");
}

function refreshHistory() {
  const today = new Date(), items = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = getLocalDateKey(d), ms = getLiveDayMs(key), h = hoursFromMs(ms), r = ratingForHours(h, currentGoalHours());
    const rawLabel = state.data.labels && state.data.labels[key];
    const labels = Array.isArray(rawLabel) ? rawLabel : (rawLabel ? [rawLabel] : []);
    items.push({ key, hours: formatTime(ms), label: r.label, className: r.className, tags: labels });
  }
  elements.historyList.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";
    const left = document.createElement("div");
    left.append(document.createTextNode(formatShortDate(item.key)));
    left.append(document.createElement("br"));

    const status = document.createElement("span");
    status.textContent = item.label;
    status.className = `history-status ${item.className}`;
    left.append(status);

    if (item.tags.length) {
      const tagsWrap = document.createElement("div");
      tagsWrap.className = "session-tags";
      item.tags.forEach((tagText) => {
        const tag = document.createElement("span");
        tag.className = "session-tag";
        tag.textContent = tagText;
        tagsWrap.appendChild(tag);
      });
      left.append(tagsWrap);
    }

    const right = document.createElement("div");
    right.textContent = item.hours;

    row.append(left, right);
    elements.historyList.appendChild(row);
  });
}

function renderCalendar() {
  const year = state.currentMonth.getFullYear(), mi = state.currentMonth.getMonth();
  const startWD = new Date(year, mi, 1).getDay();
  const daysInMonth = new Date(year, mi + 1, 0).getDate();
  const daysInPrev  = new Date(year, mi, 0).getDate();
  elements.monthLabel.textContent = state.currentMonth.toLocaleDateString([], { month: "long", year: "numeric" });
  elements.calendarDays.innerHTML = "";
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startWD + 1;
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    let dateKey = null, displayNum = dayNum;
    if (dayNum < 1) { displayNum = daysInPrev + dayNum; cell.classList.add("inactive"); }
    else if (dayNum > daysInMonth) { displayNum = dayNum - daysInMonth; cell.classList.add("inactive"); }
    else {
      dateKey = `${year}-${String(mi + 1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`;
      const ms = getLiveDayMs(dateKey), h = hoursFromMs(ms), r = ratingForHours(h, currentGoalHours());
      if (h > 0) cell.classList.add(r.className);
      if (dateKey === getLocalDateKey(new Date())) cell.classList.add("today");
      if (dateKey === state.selectedDateKey) cell.classList.add("selected");
      if (h > 0) { const hl = document.createElement("span"); hl.className = "day-hours"; hl.textContent = formatTime(ms); cell.appendChild(hl); }
    }
    const num = document.createElement("span"); num.className = "day-number"; num.textContent = displayNum;
    cell.prepend(num);
    if (dateKey) cell.dataset.dateKey = dateKey;
    elements.calendarDays.appendChild(cell);
  }
}

function updateDayDetail() {
  const key = state.selectedDateKey, ms = getLiveDayMs(key), h = hoursFromMs(ms), r = ratingForHours(h, currentGoalHours());
  const [y, m, d] = key.split("-").map(Number), date = new Date(y, m - 1, d);
  elements.selectedDateLabel.textContent = date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  elements.selectedDateHours.textContent = formatTime(ms);
  elements.selectedDateRating.textContent = r.label;
  elements.selectedDateRating.className  = `detail-pill ${r.className}`;
  elements.selectedDatePoints.textContent = formatTime(ms);
}

function calculateGoalStreaks(goalHours) {
  const today = new Date();
  let current = 0;
  for (let i = 0; i < 366; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (hoursFromMs(getLiveDayMs(getLocalDateKey(d))) >= goalHours) current++;
    else break;
  }

  const keys = Object.keys(state.data.days);
  const todayKey = getLocalDateKey(today);
  if (!keys.includes(todayKey)) keys.push(todayKey);
  if (!keys.length) return { current, best: current };

  keys.sort();
  const start = new Date(`${keys[0]}T00:00:00`);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let best = 0;
  let run = 0;
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = getLocalDateKey(d);
    if (hoursFromMs(getLiveDayMs(key)) >= goalHours) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }

  return { current, best: Math.max(best, current) };
}

function renderWeekStrip() {
  if (!elements.weekStripDays || !elements.weekStripLabel) return;

  const [y, m, d] = state.selectedDateKey.split("-").map(Number);
  const selected = new Date(y, (m || 1) - 1, d || 1);
  const anchor = Number.isNaN(selected.getTime()) ? new Date() : selected;
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  elements.weekStripLabel.textContent =
    `${start.toLocaleDateString([], { month: "short", day: "numeric" })} - ${end.toLocaleDateString([], { month: "short", day: "numeric" })}`;

  const goal = currentGoalHours();
  const todayKey = getLocalDateKey(new Date());
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = getLocalDateKey(date);
    days.push({
      key,
      dayLabel: date.toLocaleDateString([], { weekday: "narrow" }),
      hours: hoursFromMs(getLiveDayMs(key)),
      isToday: key === todayKey,
    });
  }

  const scaleMax = Math.max(goal, ...days.map((x) => x.hours), 0.5);
  elements.weekStripDays.innerHTML = "";

  days.forEach((item) => {
    const col = document.createElement("div");
    col.className = `week-strip-day${item.isToday ? " is-today" : ""}`;

    const dayLabel = document.createElement("span");
    dayLabel.className = "ws-day-label";
    dayLabel.textContent = item.dayLabel;

    const bar = document.createElement("span");
    bar.className = "ws-bar";
    const fill = document.createElement("span");
    fill.className = "ws-fill";
    fill.style.height = `${Math.min((item.hours / scaleMax) * 100, 100).toFixed(1)}%`;
    bar.appendChild(fill);

    const hours = document.createElement("span");
    hours.className = "ws-day-hours";
    hours.textContent = `${item.hours.toFixed(1)}h`;

    col.append(dayLabel, bar, hours);
    elements.weekStripDays.appendChild(col);
  });
}

function refreshCalendarInsights() {
  const goal = currentGoalHours();
  const streaks = calculateGoalStreaks(goal);

  if (elements.goalStreakCurrent) {
    elements.goalStreakCurrent.textContent = streaks.current === 1 ? "1 day" : `${streaks.current} days`;
  }
  if (elements.goalStreakBest) {
    elements.goalStreakBest.textContent = streaks.best === 1 ? "1 day" : `${streaks.best} days`;
  }

  renderWeekStrip();
}

// ---- MONTHLY CHART ---------------------------------------------------------

let gridHoverDay = -1;

/* ─────────────────────────────────────────────────────────────────────────
   renderMonthChart — LEFT: activity rings   RIGHT: month heatmap grid
   Both are drawn on the same canvas and respond to the current theme.
   ───────────────────────────────────────────────────────────────────────── */
function renderMonthChart() {
  const cv = document.getElementById("monthChart");
  if (!cv) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = cv.offsetWidth, cssH = cv.offsetHeight;
  if (!cssW || !cssH) return;
  cv.width = cssW * dpr; cv.height = cssH * dpr;
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);

  const W = cssW, H = cssH;
  const cs     = getComputedStyle(document.documentElement);
  const accent = cs.getPropertyValue("--accent").trim();
  const teal   = cs.getPropertyValue("--teal").trim();
  const ink    = cs.getPropertyValue("--ink").trim();
  const muted  = cs.getPropertyValue("--muted").trim();
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const trackA = isDark ? 0.12 : 0.09;

  const now = new Date();
  const year = state.currentMonth.getFullYear(), mi = state.currentMonth.getMonth();
  const daysInMonth = new Date(year, mi + 1, 0).getDate();
  const firstDay    = new Date(year, mi, 1).getDay();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === mi;
  const todayD = isCurrentMonth ? now.getDate() : -1;

  // ════════════════════════════════════════════════════════════════════════
  // LEFT PANEL — Activity Rings
  // ════════════════════════════════════════════════════════════════════════
  const RING_W = Math.min(H * 0.96, W * 0.40);
  const cx = RING_W / 2, cy = H / 2;
  const ringSize = Math.min(RING_W, H);

  // Selected day/week hours (from the month currently in view)
  const goal = state.goal > 0 ? state.goal : 8;
  const gold  = cs.getPropertyValue("--gold").trim() || "#c49b3c";
  const [sy, sm, sd] = state.selectedDateKey.split("-").map(Number);
  const selectedDate = new Date(sy, (sm || 1) - 1, sd || 1);
  const selectedInViewedMonth = selectedDate.getFullYear() === year && selectedDate.getMonth() === mi;
  const focusDate = selectedInViewedMonth ? selectedDate : new Date(year, mi, isCurrentMonth ? now.getDate() : 1);
  const focusDay = Math.max(1, Math.min(daysInMonth, focusDate.getDate()));

  const dayKey = `${year}-${String(mi + 1).padStart(2,"0")}-${String(focusDay).padStart(2,"0")}`;
  const dayH = hoursFromMs(getLiveDayMs(dayKey));
  // Cap at exactly 1.0 for ring display — over-goal shown via star badge, not a second arc
  const dayPct    = goal > 0 ? Math.min(dayH / goal, 1) : 0;
  const isOverGoal = goal > 0 && dayH > goal;
  const dayRingColor = (dayPct >= 1) ? gold : accent;  // gold ring when goal met

  // Week: each day's contribution capped at its own daily goal to prevent bleed-over
  const wStart = new Date(focusDate); wStart.setDate(focusDate.getDate() - focusDate.getDay()); wStart.setHours(0,0,0,0);
  let weekH = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(wStart); d.setDate(wStart.getDate() + i);
    if (d > focusDate) break;
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    weekH += Math.min(hoursFromMs(getLiveDayMs(k)), goal); // cap each day at goal
  }
  const weekPct = Math.min(weekH / (goal * 7), 1);

  const outerR = ringSize * 0.34;
  const outerW = ringSize * 0.090;
  const innerR = outerR - outerW - ringSize * 0.038;
  const innerW = outerW * 0.65;
  const clearR = innerR - innerW / 2 - 3; // safe radius for center text

  // Draw one arc ring — capped at 100%, no second-arc hack
  function drawRing(r, w, pct, color) {
    const trackColor = isDark ? `rgba(255,255,255,${trackA})` : `rgba(0,0,0,${trackA})`;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = trackColor; ctx.lineWidth = w; ctx.lineCap = "butt"; ctx.stroke();
    if (pct <= 0) return;
    const end = -Math.PI / 2 + pct * Math.PI * 2;
    ctx.save();
    ctx.shadowColor = hexToRgba(color, 0.55); ctx.shadowBlur = w * 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, end);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = "round"; ctx.stroke();
    ctx.restore();
  }

  drawRing(outerR, outerW, dayPct,  dayRingColor);
  drawRing(innerR, innerW, weekPct, teal);

  // ★ Star badge at 12 o'clock when over goal
  if (isOverGoal) {
    const starX = cx, starY = cy - outerR;
    const starR  = outerW * 0.88;
    ctx.save();
    ctx.beginPath(); ctx.arc(starX, starY, starR + 1.5, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "#0e1320" : "#f6f0e8";
    ctx.fill();
    ctx.font = `${Math.round(starR * 1.55)}px sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("★", starX, starY + 0.5);
    ctx.restore();
  }

  // Center text — all positions kept within clearR
  const bigFz  = Math.max(13, Math.round(clearR * 0.76));
  const lblFz  = Math.max(8,  Math.round(clearR * 0.36));
  const sub1Fz = Math.max(7,  Math.round(clearR * 0.29));
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  const hDisplay = formatTime(dayH * 3600000);
  const adjBigFz = hDisplay.length > 7 ? Math.max(10, Math.round(bigFz * 0.72)) : bigFz;
  ctx.font = `700 ${adjBigFz}px "IBM Plex Mono", monospace`;
  ctx.fillText(hDisplay, cx, cy - clearR * 0.28);
  ctx.fillStyle = muted;
  ctx.font = `500 ${lblFz}px "Space Grotesk", sans-serif`;
  ctx.fillText("focused", cx, cy + clearR * 0.22);
  ctx.font = `400 ${sub1Fz}px "Space Grotesk", sans-serif`;
  if (isOverGoal) {
    // Show bonus time instead of a confusing >100% percentage
    const bonusMs = (dayH - goal) * 3600000;
    ctx.fillStyle = gold;
    ctx.fillText(`★ +${formatTime(bonusMs)} bonus`, cx, cy + clearR * 0.60);
  } else {
    ctx.fillText(`${Math.round((dayH / goal) * 100)}% of ${formatTime(goal * 3600000)}`, cx, cy + clearR * 0.60);
  }
  ctx.textBaseline = "alphabetic";

  // Legend — dot colour matches the actual ring colour currently drawn
  const legY   = H - 9;
  const legDot = Math.max(3.5, ringSize * 0.030);
  const legFz  = Math.round(ringSize * 0.062);
  ctx.save();
  ctx.font = `400 ${legFz}px "Space Grotesk", sans-serif`;
  ctx.textAlign = "left"; ctx.textBaseline = "middle";

  // Day dot — uses dayRingColor (gold when goal met, accent otherwise)
  ctx.fillStyle = dayRingColor;
  ctx.beginPath(); ctx.arc(cx - RING_W * 0.20, legY, legDot, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = muted;
  ctx.fillText("Day", cx - RING_W * 0.20 + legDot + 3, legY);

  // Week dot — always teal
  ctx.fillStyle = teal;
  ctx.beginPath(); ctx.arc(cx + RING_W * 0.04, legY, legDot, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = muted;
  ctx.fillText("Week", cx + RING_W * 0.04 + legDot + 3, legY);

  ctx.textBaseline = "alphabetic";
  ctx.restore();

  // Divider — solid, very subtle
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(RING_W + 8, H * 0.10); ctx.lineTo(RING_W + 8, H * 0.90); ctx.stroke();

  // ════════════════════════════════════════════════════════════════════════
  // RIGHT PANEL — Month Heatmap Grid
  // ════════════════════════════════════════════════════════════════════════
  const GX   = RING_W + 18;
  const GW   = W - GX - 6;
  const HDR  = 16;
  const COLS = 7, ROWS = 6, GAP = 3;
  const cw   = (GW - GAP * (COLS - 1)) / COLS;
  const ch   = (H - HDR - GAP * (ROWS - 1)) / ROWS;
  const cr   = Math.min(cw, ch) * 0.26;

  // Weekday header row
  ["S","M","T","W","T","F","S"].forEach((lbl, i) => {
    ctx.fillStyle = hexToRgba(muted, isDark ? 0.55 : 0.62);
    ctx.font = `600 ${Math.round(cw * 0.40)}px "Space Grotesk", sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(lbl, GX + i * (cw + GAP) + cw / 2, HDR / 2);
  });
  ctx.textBaseline = "alphabetic";

  for (let d = 1; d <= daysInMonth; d++) {
    const idx = d - 1 + firstDay;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const cx2 = GX + col * (cw + GAP);
    const cy2 = HDR + row * (ch + GAP);

    const key = `${year}-${String(mi+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const h         = hoursFromMs(getLiveDayMs(key));
    const isToday   = d === todayD;
    const isFuture  = isCurrentMonth && d > now.getDate();
    const isHovered = d === gridHoverDay;
    const cellOver  = goal > 0 && h > goal;            // over-goal day
    const intensity = Math.min(h / goal, 1);            // always capped at 1.0

    // ── Cell background — over-goal days use gold tint, not weird saturation overflow ──
    ctx.save();
    if (isToday) {
      ctx.shadowColor = hexToRgba(cellOver ? gold : teal, 0.50); ctx.shadowBlur = 7;
      ctx.fillStyle = h > 0
        ? hexToRgba(cellOver ? gold : teal, 0.18 + intensity * 0.62)
        : hexToRgba(teal, 0.09);
    } else if (h > 0) {
      ctx.fillStyle = cellOver
        ? hexToRgba(gold, 0.22 + 0.68)   // solid gold tint for over-goal
        : hexToRgba(accent, 0.10 + intensity * 0.80);
    } else if (isFuture) {
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)";
    } else {
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
    }
    roundRect(ctx, cx2, cy2, cw, ch, cr); ctx.fill();

    // ── Border ring ──
    if (isToday || isHovered || cellOver) {
      ctx.strokeStyle = cellOver
        ? hexToRgba(gold, 0.90)
        : isToday ? hexToRgba(teal, 0.88) : hexToRgba(accent, 0.65);
      ctx.lineWidth = cellOver ? 1.8 : 1.5;
      roundRect(ctx, cx2 + 0.75, cy2 + 0.75, cw - 1.5, ch - 1.5, cr);
      ctx.stroke();
    }
    ctx.restore();

    // ── Day number ──
    const fSz = Math.max(7, Math.round(Math.min(cw, ch) * 0.38));
    ctx.font = `${isToday || cellOver ? 700 : 400} ${fSz}px "Space Grotesk", sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = (isToday || cellOver)
      ? (h > 0 ? "#fff" : hexToRgba(teal, 0.88))
      : h > 0
        ? (intensity > 0.55 ? "rgba(255,255,255,0.92)" : hexToRgba(ink, 0.84))
        : isFuture
          ? hexToRgba(muted, 0.38)
          : hexToRgba(muted, 0.74);
    if (cw >= 18 && ch >= 16) ctx.fillText(String(d), cx2 + cw / 2, cy2 + ch / 2);

    // ── Gold star in top-right corner for over-goal days ──
    if (cellOver && cw >= 20 && ch >= 18) {
      const starFz = Math.max(6, Math.round(Math.min(cw, ch) * 0.28));
      ctx.font = `${starFz}px sans-serif`;
      ctx.textAlign = "right"; ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillText("★", cx2 + cw - 2, cy2 + 2);
    }
    ctx.textBaseline = "alphabetic";
  }
}

// Helper: convert a CSS colour (hex or rgb/rgba) to rgba string with given alpha
function hexToRgba(color, alpha) {
  if (!color) return `rgba(150,150,150,${alpha})`;
  if (color.startsWith("#")) {
    const c = color.replace("#", "");
    const full = c.length === 3 ? c.split("").map(x => x + x).join("") : c;
    const r = parseInt(full.slice(0,2),16), g = parseInt(full.slice(2,4),16), b = parseInt(full.slice(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (color.startsWith("rgb")) {
    return color.replace(/rgba?\(/, "rgba(").replace(/,?\s*[\d.]+\)$/, `,${alpha})`);
  }
  return `rgba(150,150,150,${alpha})`;
}

// Helper: draw rounded rect (fallback for browsers without ctx.roundRect)
function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function initMonthChart() {
  const cv = document.getElementById("monthChart");
  const tip = document.getElementById("chartTooltip");
  if (!cv || !tip) return;

  const year = () => state.currentMonth.getFullYear();
  const mi   = () => state.currentMonth.getMonth();

  cv.addEventListener("mousemove", (e) => {
    const rect = cv.getBoundingClientRect();
    const W = rect.width, H = rect.height;

    // Mirror layout constants from renderMonthChart
    const RING_W = Math.min(H * 0.96, W * 0.40);
    const GX     = RING_W + 18;
    const GW     = W - GX - 6;
    const HDR    = 16;
    const COLS   = 7, ROWS = 6, GAP = 3;
    const cw     = (GW - GAP * (COLS - 1)) / COLS;
    const ch     = (H - HDR - GAP * (ROWS - 1)) / ROWS;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Only react in the grid area
    if (mouseX < GX || mouseX > GX + GW || mouseY < HDR) {
      if (gridHoverDay !== -1) { gridHoverDay = -1; tip.hidden = true; renderMonthChart(); }
      return;
    }

    const daysInMonth = new Date(year(), mi() + 1, 0).getDate();
    const firstDay    = new Date(year(), mi(), 1).getDay();
    const gx = mouseX - GX;
    const gy = mouseY - HDR;
    const col = Math.floor(gx / (cw + GAP));
    const row = Math.floor(gy / (ch + GAP));
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
      if (gridHoverDay !== -1) { gridHoverDay = -1; tip.hidden = true; renderMonthChart(); }
      return;
    }
    const d = row * COLS + col - firstDay + 1;
    if (d < 1 || d > daysInMonth) {
      if (gridHoverDay !== -1) { gridHoverDay = -1; tip.hidden = true; renderMonthChart(); }
      return;
    }

    gridHoverDay = d;
    const key  = `${year()}-${String(mi()+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const h    = hoursFromMs(getLiveDayMs(key));
    const date = new Date(year(), mi(), d);

    tip.hidden = false;
    document.getElementById("ctDate").textContent =
      date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    const tipGoal = state.goal > 0 ? state.goal : 8;
    const tipOver = h > tipGoal;
    // Keep tooltip value short — just the time, star prefix for over-goal days
    document.getElementById("ctVal").textContent = h > 0
      ? (tipOver ? `★ ${formatTime(h * 3600000)}` : formatTime(h * 3600000))
      : "—";

    // Position above the cell centre, clamped so tooltip never overflows the canvas
    const TOOLTIP_HALF = 60; // half of max-width (120px)
    const rawLeft = GX + col * (cw + GAP) + cw / 2;
    const clampedLeft = Math.max(TOOLTIP_HALF, Math.min(W - TOOLTIP_HALF, rawLeft));
    tip.style.left = `${clampedLeft}px`;
    tip.style.top  = `${HDR + row * (ch + GAP)}px`;
    renderMonthChart();
  }, { passive: true });

  cv.addEventListener("mouseleave", () => {
    gridHoverDay = -1;
    tip.hidden = true;
    renderMonthChart();
  }, { passive: true });

  const ro = new ResizeObserver(() => renderMonthChart());
  ro.observe(cv);
}

function updateMonthlyReport() {
  const year = state.currentMonth.getFullYear(), mi = state.currentMonth.getMonth();
  const totalMs = getMonthTotalMs(year, mi), totalH = hoursFromMs(totalMs);
  const daysInMonth = new Date(year, mi + 1, 0).getDate();
  const goal = currentGoalHours();
  const targetH = goal * daysInMonth;
  const pct = targetH === 0 ? 0 : (totalH / targetH) * 100;
  elements.reportMonth.textContent   = state.currentMonth.toLocaleDateString([], { month: "short", year: "numeric" });
  elements.monthHours.textContent    = formatTime(totalMs);
  elements.monthPoints.textContent   = formatTime(totalMs);
  elements.monthPercent.textContent  = `${pct.toFixed(1)}%`;
  elements.monthProgress.style.width = `${Math.min(pct, 100).toFixed(1)}%`;
  elements.monthNote.textContent     = `${formatTime(totalMs)} out of ${formatTime(targetH * 3600000)} goal`;

  if (elements.monthBestDay || elements.monthGoalHitDays || elements.weekdayPatternRow || elements.monthTrendValue) {
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(mi + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      const date = new Date(year, mi, day);
      days.push({ date, hours: hoursFromMs(getLiveDayMs(key)) });
    }

    const best = days.reduce((top, cur) => (cur.hours > top.hours ? cur : top), { date: null, hours: 0 });
    if (elements.monthBestDay) {
      elements.monthBestDay.textContent = best.hours > 0
        ? `${best.date.toLocaleDateString([], { month: "short", day: "numeric" })} — ${formatTime(best.hours * 3600000)}`
        : "No focused day yet";
    }

    const hitDays = days.filter((x) => x.hours >= goal).length;
    if (elements.monthGoalHitDays) {
      elements.monthGoalHitDays.textContent = `${hitDays} of ${daysInMonth} days`;
    }

    if (elements.weekdayPatternRow) {
      const sums = Array(7).fill(0);
      const counts = Array(7).fill(0);
      days.forEach((x) => {
        const wd = x.date.getDay();
        sums[wd] += x.hours;
        counts[wd] += 1;
      });
      const avgs = sums.map((sum, idx) => counts[idx] ? (sum / counts[idx]) : 0);
      const scale = Math.max(...avgs, goal / 2, 0.5);
      const labels = ["S", "M", "T", "W", "T", "F", "S"];

      elements.weekdayPatternRow.innerHTML = "";
      avgs.forEach((avg, idx) => {
        const item = document.createElement("div");
        item.className = "wp-item";

        const label = document.createElement("span");
        label.className = "wp-label";
        label.textContent = labels[idx];

        const bar = document.createElement("span");
        bar.className = "wp-bar";
        const fill = document.createElement("span");
        fill.className = "wp-fill";
        fill.style.height = `${Math.min((avg / scale) * 100, 100).toFixed(1)}%`;
        bar.appendChild(fill);

        const value = document.createElement("span");
        value.className = "wp-avg";
        value.textContent = formatTime(avg * 3600000);

        item.append(label, bar, value);
        elements.weekdayPatternRow.appendChild(item);
      });
    }

    if (elements.monthTrendValue) {
      const prevDate = new Date(year, mi - 1, 1);
      const py = prevDate.getFullYear();
      const pmi = prevDate.getMonth();
      const prevDaysInMonth = new Date(py, pmi + 1, 0).getDate();
      const prevTotalH = hoursFromMs(getMonthTotalMs(py, pmi));

      const prevPrefix = `${py}-${String(pmi + 1).padStart(2,"0")}`;
      const hasPrevData = Object.keys(state.data.days).some((k) => k.startsWith(prevPrefix));
      const currAvg = totalH / daysInMonth;
      const prevAvg = prevTotalH / prevDaysInMonth;
      const delta = currAvg - prevAvg;

      elements.monthTrendValue.className = "mtr-value";
      if (!hasPrevData) {
        elements.monthTrendValue.textContent = "No data for last month";
        elements.monthTrendValue.classList.add("mtr-flat");
      } else if (Math.abs(delta) < 0.01) {
        elements.monthTrendValue.textContent =
          `No change vs ${prevDate.toLocaleDateString([], { month: "long" })}`;
        elements.monthTrendValue.classList.add("mtr-flat");
      } else if (delta > 0) {
        elements.monthTrendValue.textContent =
          `+${formatTime(delta * 3600000)}/day vs ${prevDate.toLocaleDateString([], { month: "long" })} ↑`;
        elements.monthTrendValue.classList.add("mtr-up");
      } else {
        elements.monthTrendValue.textContent =
          `-${formatTime(Math.abs(delta) * 3600000)}/day vs ${prevDate.toLocaleDateString([], { month: "long" })} ↓`;
        elements.monthTrendValue.classList.add("mtr-down");
      }
    }
  }

  renderMonthChart();
}

function refreshAll() {
  refreshTodaySummary(); renderCalendar(); updateDayDetail();
  updateMonthlyReport(); refreshHistory(); refreshStreak(); refreshGoalBar(); refreshCalendarInsights();
}

// ---- DAY-CHANGE HANDLING ---------------------------------------------------

function handleDayChange(now) {
  const r = state.data.running;
  if (!r.isRunning || !r.lastDateKey) return;
  const curKey = getLocalDateKey(now);
  if (curKey === r.lastDateKey) return;
  let changed = false;
  while (r.lastDateKey !== curKey) {
    const lk = r.lastDateKey, mn = getNextMidnight(lk), as = new Date(r.activeStart);
    if (mn > as) addMsToDay(lk, mn - as);
    r.activeStart = mn.toISOString(); r.lastDateKey = getLocalDateKey(mn); changed = true;
  }
  if (changed) { saveData(); refreshAll(); }
}

function tickProductivity() {
  handleDayChange(new Date()); updateSessionDisplay(); refreshTodaySummary(); refreshGoalBar(); refreshStreak();
  if (state.selectedDateKey === getLocalDateKey(new Date())) updateDayDetail();
  refreshCalendarInsights();
  updateReadingOverlay();
}

// ---- TIMER ACTIONS ---------------------------------------------------------

function openSessionModal() {
  const modal = document.getElementById("sessionModal");
  const input = document.getElementById("sessionModalInput");
  if (!modal) return;
  input.value = "";
  modal.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    modal.classList.add("open");
    input.focus();
  }));
}

function closeSessionModal() {
  const modal = document.getElementById("sessionModal");
  if (!modal) return;
  modal.classList.remove("open");
  setTimeout(() => { modal.hidden = true; }, 350);
}

function doStartTimer(label) {
  pendingSessionLabel = label.trim();
  const r = state.data.running; if (r.isRunning) return;
  const now = new Date();
  r.isRunning = true; r.sessionStart = r.activeStart = now.toISOString(); r.lastDateKey = getLocalDateKey(now);
  saveData();
  if (state.pomo.enabled) {
    // Standalone focus mode — track time but open focus overlay directly
    state.pomo.phase   = "focus";
    state.pomo.endTime = Date.now() + pomoFocusMs();
    state.pomo.cycles  = 0;
    focusTotalMs       = pomoFocusMs();
    focusFromReading   = false;
    openFocusOverlay();
  } else {
    state.pomo.endTime = null;
    state.pomo.cycles  = 0;
    openReadingOverlay();
  }
  updatePomoDisplay();
  updateSessionDisplay(); refreshAll();
}

function startTimer() {
  if (state.data.running.isRunning) return;
  openSessionModal();
}

function stopTimer() {
  const r = state.data.running; if (!r.isRunning || !r.activeStart) return;
  const now = new Date(), as = new Date(r.activeStart);
  if (now > as) allocateMsAcrossDays(as, now);
  const label = pendingSessionLabel;
  if (label) {
    if (!state.data.labels) state.data.labels = {};
    const key = getLocalDateKey(now);
    if (!state.data.labels[key]) state.data.labels[key] = [];
    state.data.labels[key].unshift(label);
    state.data.labels[key] = state.data.labels[key].slice(0, 3);
  }
  pendingSessionLabel = "";
  r.isRunning = false;
  r.sessionStart = r.activeStart = r.lastDateKey = null;
  state.pomo.enabled = false;
  state.pomo.endTime = null;
  updatePomoDisplay();
  saveData(); updateSessionDisplay(); refreshAll();
  shimmerCard(document.querySelector(".timer-card"));
  if (readingOverlayIsOpen()) closeReadingOverlay();
}

function openClearModal() {
  const modal = document.getElementById("clearModal");
  if (!modal) return;
  modal.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add("open")));
}

function closeClearModal() {
  const modal = document.getElementById("clearModal");
  if (!modal) return;
  modal.classList.remove("open");
  setTimeout(() => { modal.hidden = true; }, 350);
}

function doClearToday() {
  const key = getLocalDateKey(new Date()), r = state.data.running;
  state.data.days[key] = 0; state._goalCelebrated = ""; Store.remove(GOAL_CELEBRATED_KEY);
  if (state.data.labels) delete state.data.labels[key];
  if (r.isRunning && r.lastDateKey === key) r.activeStart = new Date().toISOString();
  saveData(); refreshAll();
  closeClearModal();
}

function clearToday() {
  openClearModal();
}

function handleCalendarClick(e) {
  const t = e.target.closest(".calendar-day");
  if (!t || t.classList.contains("inactive") || !t.dataset.dateKey) return;
  state.selectedDateKey = t.dataset.dateKey; renderCalendar(); updateDayDetail(); refreshCalendarInsights();
}

function changeMonth(offset) {
  const next = new Date(state.currentMonth); next.setMonth(next.getMonth() + offset);
  state.currentMonth = next;
  const mk = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2,"0")}`;
  if (!state.selectedDateKey.startsWith(mk)) state.selectedDateKey = `${mk}-01`;
  refreshAll();
}

function catchUpRunningSession() {
  const r = state.data.running;
  if (!r.isRunning || !r.activeStart || !r.sessionStart) return;
  const now = new Date(), as = new Date(r.activeStart);
  if (now > as) { allocateMsAcrossDays(as, now); r.activeStart = now.toISOString(); r.lastDateKey = getLocalDateKey(now); saveData(); }
}

function sanitizeRunningState() {
  const r = state.data.running;
  if (r.isRunning && (!r.sessionStart || !r.activeStart || !r.lastDateKey)) {
    r.isRunning = false; r.sessionStart = r.activeStart = r.lastDateKey = null; saveData();
  }
}

// ---- 3D: CLOCK CARD TILT ---------------------------------------------------

function init3D() {
  const cc = document.querySelector(".clock-card"); if (!cc) return;
  cc.addEventListener("mousemove", (e) => {
    const rect = cc.getBoundingClientRect();
    const rx = -((e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)) * 8;
    const ry =  ((e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)) * 8;
    cc.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
  });
  cc.addEventListener("mouseleave", () => {
    cc.style.transition = "transform 0.55s cubic-bezier(0.23,1,0.32,1)";
    cc.style.transform = "";
    setTimeout(() => { cc.style.transition = ""; }, 600);
  });
  cc.addEventListener("mouseenter", () => { cc.style.transition = "transform 0.12s ease"; });
}

// ---- CARD LIFT + CURSOR SPOTLIGHT ------------------------------------------

function initCardLift() {
  if (window.matchMedia("(hover:none)").matches) return;
  document.querySelectorAll(".card").forEach((el) => {
    el.addEventListener("mouseenter", () => { el.style.transition = "transform 0.14s ease, box-shadow 0.14s ease"; });
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const { r: cr, g: cg, b: cb } = canvasRGB;
      const glow = isDark ? `rgba(255,255,255,0.22)` : `rgba(${cr},${cg},${cb},0.18)`;
      el.style.background  = `radial-gradient(circle at ${x}px ${y}px, ${glow} 0%, transparent 52%), var(--card)`;
      const nx = x / rect.width - 0.5, ny = y / rect.height - 0.5;
      el.style.boxShadow   = `${-nx * 24}px ${24 + Math.abs(ny) * 18}px 64px rgba(17,24,39,0.17), 0 4px 16px rgba(17,24,39,0.08)`;
      el.style.transform   = "translateY(-7px) scale(1.007)";
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = "all 0.5s cubic-bezier(0.23,1,0.32,1)";
      el.style.background = el.style.boxShadow = el.style.transform = "";
      setTimeout(() => { el.style.transition = ""; }, 550);
    });
  });
}

// ---- PARALLAX ORBS (rAF with idle drift) ------------------------------------

function initParallax() {
  const o1 = document.querySelector(".orb-one"),
        o2 = document.querySelector(".orb-two"),
        o3 = document.querySelector(".orb-three");
  if (!o1 || !o2 || !o3) return;
  let mx = 0, my = 0, ex = 0, ey = 0;
  if (window.DeviceOrientationEvent && window.matchMedia("(hover:none)").matches) {
    window.addEventListener("deviceorientation", (e) => {
      if (e.gamma != null) { mx = Math.max(-1, Math.min(1, e.gamma / 30)); my = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); }
    }, { passive: true });
  } else {
    document.addEventListener("mousemove", (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }
  (function frame() {
    ex += (mx - ex) * 0.038; ey += (my - ey) * 0.038;
    const t = Date.now() / 1000;
    o1.style.transform = `translate(${Math.sin(t * 0.25) * 22 + ex * -44}px, ${Math.cos(t * 0.19) * 18 + ey * -44}px)`;
    o2.style.transform = `translate(${Math.cos(t * 0.18) * 28 + ex *  34}px, ${Math.sin(t * 0.31) * 22 + ey *  34}px)`;
    o3.style.transform = `translate(${Math.sin(t * 0.36 + 1.2) * 16 + ex * -20}px, ${Math.cos(t * 0.27 + 0.8) * 20 + ey * -20}px)`;
    requestAnimationFrame(frame);
  })();
}

// ---- POMODORO TIME SETTINGS ------------------------------------------------

// Read h/m/s inputs → total seconds
// Float input ID is hId with trailing "H" replaced by "Float" (e.g. "pomoFocusH" → "pomoFocusFloat")
function _floatId(hId) { return hId.replace(/H$/, "Float"); }

// Read time inputs → total seconds, respecting current format
function _readTimeEntry(hId, mId, sId, minSec, maxSec) {
  if (state.timeFormat === "hr") {
    const floatEl = document.getElementById(_floatId(hId));
    const hrs = Math.max(0, parseFloat(floatEl?.value || "0") || 0);
    return Math.max(minSec, Math.min(maxSec, Math.round(hrs * 3600)));
  }
  const h = Math.max(0, parseInt(document.getElementById(hId)?.value  || "0", 10) || 0);
  const m = Math.max(0, parseInt(document.getElementById(mId)?.value  || "0", 10) || 0);
  const s = Math.max(0, parseInt(document.getElementById(sId)?.value  || "0", 10) || 0);
  return Math.max(minSec, Math.min(maxSec, h * 3600 + m * 60 + s));
}

// Populate all inputs (float + H/M/S) from total seconds
function _writeTimeEntry(hId, mId, sId, totalSec) {
  const safeSec = Math.max(0, Math.floor(totalSec || 0));
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);
  const s = safeSec % 60;

  // Always write H/M/S for when format changes
  const hEl = document.getElementById(hId), mEl = document.getElementById(mId), sEl = document.getElementById(sId);
  if (hEl) hEl.value = h;
  if (mEl) { mEl.max = "59"; mEl.value = m; }
  if (sEl) sEl.value = s;

  // Also write the float input
  const floatEl = document.getElementById(_floatId(hId));
  if (floatEl) floatEl.value = (safeSec / 3600).toFixed(2);
}

function initPomoSettings() {
  const breakCheck = document.getElementById("pomoBreakCheck");
  const breakEntry = document.getElementById("pomoBreakEntry");

  function syncBreakUI() {
    const enabled = state.pomo.breakEnabled;
    if (breakEntry) breakEntry.classList.toggle("disabled", !enabled);
    if (breakCheck) breakCheck.checked = enabled;
  }

  function applyFocusInputs() {
    const sec = _readTimeEntry("pomoFocusH","pomoFocusM","pomoFocusS", 1, 86399);
    state.pomo.focusSec = sec;
    savePomoSettings();
    if (state.pomo.enabled && state.pomo.phase === "focus" && state.pomo.endTime) {
      const elapsed = pomoFocusMs() - Math.max(0, state.pomo.endTime - Date.now());
      state.pomo.endTime = Date.now() + Math.max(0, pomoFocusMs() - elapsed);
    }
    updatePomoDisplay();
  }

  function applyBreakInputs() {
    const sec = _readTimeEntry("pomoBreakH","pomoBreakM","pomoBreakS", 0, 86399);
    state.pomo.breakSec = sec;
    state.pomo.breakEnabled = sec > 0 && (breakCheck?.checked ?? true);
    savePomoSettings();
    syncBreakUI();
    updatePomoDisplay();
  }

  if (breakCheck) {
    breakCheck.addEventListener("change", () => {
      state.pomo.breakEnabled = breakCheck.checked;
      savePomoSettings();
      syncBreakUI();
      updatePomoDisplay();
    });
  }

  ["pomoFocusH","pomoFocusM","pomoFocusS","pomoFocusFloat"].forEach(id =>
    document.getElementById(id)?.addEventListener("change", applyFocusInputs));
  ["pomoBreakH","pomoBreakM","pomoBreakS","pomoBreakFloat"].forEach(id =>
    document.getElementById(id)?.addEventListener("change", applyBreakInputs));

  // Sync inputs when pomo section becomes visible
  const section = document.getElementById("pomoSection");
  if (section) {
    new MutationObserver(() => {
      _writeTimeEntry("pomoFocusH","pomoFocusM","pomoFocusS", state.pomo.focusSec);
      _writeTimeEntry("pomoBreakH","pomoBreakM","pomoBreakS", state.pomo.breakSec);
      syncBreakUI();
    }).observe(section, { attributes: true, attributeFilter: ["hidden"] });
  }

  // Initial sync
  _writeTimeEntry("pomoFocusH","pomoFocusM","pomoFocusS", state.pomo.focusSec);
  _writeTimeEntry("pomoBreakH","pomoBreakM","pomoBreakS", state.pomo.breakSec);
  syncBreakUI();
}

// ---- TIME FORMAT -----------------------------------------------------------

function applyTimeFormat(fmt) {
  if (!["hr","hr-min","hr-min-sec"].includes(fmt)) fmt = "hr-min";
  state.timeFormat = fmt;
  Store.set(TIME_FORMAT_KEY, fmt);

  const isHr      = fmt === "hr";
  const isHrMin   = fmt === "hr-min";
  const isHMS     = fmt === "hr-min-sec";

  // Float input (hr mode only): show the decimal-hours input
  document.querySelectorAll(".pomo-float-input, .pomo-float-unit").forEach(el => {
    el.hidden = !isHr;
  });

  // H inputs+units: hidden in "hr" mode (float handles it)
  document.querySelectorAll(".pomo-h-input, .pomo-h-unit").forEach(el => {
    el.hidden = isHr;
  });

  // M inputs+units: hidden in "hr" mode (float covers the whole value)
  document.querySelectorAll(".pomo-m-input, .pomo-m-unit").forEach(el => {
    el.hidden = isHr;
  });

  // S inputs+units: only in "hr-min-sec" mode
  document.querySelectorAll(".pomo-s-input, .pomo-s-unit").forEach(el => {
    el.hidden = !isHMS;
  });

  // Sync radio buttons
  document.querySelectorAll('input[name="timeFmt"]').forEach(r => {
    r.checked = r.value === fmt;
  });

  // Goal modal: show float row vs H/M/S row
  const goalFloatRow = document.getElementById("goalFloatRow");
  const goalHMRow    = document.getElementById("goalHMRow");
  const goalSInput   = document.querySelectorAll(".goal-s-input, .goal-s-unit");
  if (goalFloatRow) goalFloatRow.hidden = !isHr;
  if (goalHMRow)    goalHMRow.hidden    = isHr;
  goalSInput.forEach(el => { el.hidden = !isHMS; });

  // Update hint text to match format
  const hint = document.getElementById("goalModalHint");
  if (hint) {
    if (isHr)    hint.textContent = "How many hours (decimal) do you aim to complete today?";
    else if (isHMS) hint.textContent = "How many hours, minutes and seconds do you aim to complete today?";
    else         hint.textContent = "How many hours and minutes do you aim to complete today?";
  }

  // Re-map current focus/break durations into the newly selected input layout.
  _writeTimeEntry("pomoFocusH","pomoFocusM","pomoFocusS", state.pomo.focusSec);
  _writeTimeEntry("pomoBreakH","pomoBreakM","pomoBreakS", state.pomo.breakSec);
  _writeTimeEntry("rovFocusH","rovFocusM","rovFocusS", state.pomo.focusSec);
  _writeTimeEntry("rovBreakH","rovBreakM","rovBreakS", state.pomo.breakSec);

  refreshAll();
}

// ---- SETTINGS PANEL --------------------------------------------------------

function initSettings() {
  const btn   = document.getElementById("settingsBtn");
  const panel = document.getElementById("settingsPanel");
  if (!btn || !panel) return;

  function openPanel()  { panel.hidden = false; btn.classList.add("active"); }
  function closePanel() { panel.hidden = true;  btn.classList.remove("active"); }
  function isPanelOpen(){ return !panel.hidden; }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    isPanelOpen() ? closePanel() : openPanel();
  });

  document.addEventListener("click", (e) => {
    if (isPanelOpen() && !panel.contains(e.target) && e.target !== btn) closePanel();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isPanelOpen()) closePanel();
  });

  // Theme dots
  document.querySelectorAll(".theme-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      applyTheme(dot.dataset.theme);
    });
  });

  // Time format radios
  document.querySelectorAll('input[name="timeFmt"]').forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.checked) applyTimeFormat(radio.value);
    });
  });

  // Apply initial format (show/hide inputs + set radio)
  applyTimeFormat(state.timeFormat);
}

// ---- KEYBOARD --------------------------------------------------------------

function initKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.code === "Space") { if (focusOverlayIsOpen() || readingOverlayIsOpen()) return; e.preventDefault(); state.data.running.isRunning ? stopTimer() : startTimer(); }
    else if (e.code === "Escape") {
      closeSessionModal(); closeGoalModal(); closeClearModal(); closeTour();
    }
  });
}

// ---- ONE-TIME TOUR ---------------------------------------------------------

const TOUR_STEPS = [
  { selector: null,            emoji: "👋", title: "Welcome to Productivity Clock",
    desc: "Track focus time, build streaks, stay intentional. 30-second tour — or skip anytime." },
  { selector: ".clock-card",   emoji: "🕐", title: "Live Clock",
    desc: "Real-time analog + digital clock. Move your mouse over it — it tilts like a physical object." },
  { selector: ".timer-display",emoji: "▶",  title: "Focus Timer",
    desc: "Hit Start — you'll be asked what you're working on. Hit Space anywhere to start/stop quickly." },
  { selector: "#pomoToggleBtn",emoji: "🍅", title: "Pomodoro Mode",
    desc: "Focus sprints + breaks. Adjust the minutes to match how you like to work, then toggle it on." },
  { selector: ".goal-row",     emoji: "🎯", title: "Daily Goal",
    desc: "Tracks progress toward your daily target. Click the hours to change it. Hit 100% for a surprise." },
  { selector: ".calendar-card",emoji: "📅", title: "Productivity Calendar",
    desc: "Every day is colour-coded. Tap any day to see details. Build those streaks!" },
  { selector: ".report-card",  emoji: "📊", title: "Monthly Report",
    desc: "Your cumulative focus hours for the month. Use it daily and watch the picture grow." },
];

let tourStep = 0;

function positionTourCard(targetEl) {
  const card = document.getElementById("tourCard");
  if (!card) return;
  if (!targetEl) {
    // Welcome step: true centre
    card.style.removeProperty("top");
    card.style.removeProperty("left");
    card.style.removeProperty("transform");
    card.classList.remove("near-target");
    return;
  }
  card.classList.add("near-target");
  const MARGIN = 16, CARD_H = 260, CARD_W = 440;
  const rect = targetEl.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  // Prefer below, fallback to above
  let top = (rect.bottom + MARGIN + CARD_H < vh)
    ? rect.bottom + MARGIN
    : Math.max(MARGIN, rect.top - CARD_H - MARGIN);
  let left = Math.max(MARGIN, Math.min(vw - Math.min(CARD_W, vw - MARGIN * 2) - MARGIN,
    rect.left + rect.width / 2 - Math.min(CARD_W, vw - MARGIN * 2) / 2));
  card.style.top  = `${top}px`;
  card.style.left = `${left}px`;
  card.style.transform = "none";
}

function updateTourSpotlight(selector) {
  const backdrop = document.getElementById("tourOverlay");
  const spotlight = document.getElementById("tourSpotlight");
  const card = document.getElementById("tourCard");
  if (!spotlight || !backdrop) return;

  if (!selector) {
    spotlight.hidden = true;
    spotlight.classList.remove("visible");
    backdrop.classList.remove("spotlit");
    positionTourCard(null);
    return;
  }

  const el = document.querySelector(selector);
  if (!el) {
    spotlight.hidden = true;
    spotlight.classList.remove("visible");
    backdrop.classList.remove("spotlit");
    positionTourCard(null);
    return;
  }

  // Scroll target into view first, then position
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  setTimeout(() => {
    const rect = el.getBoundingClientRect();
    const pad = 10;
    spotlight.hidden = false;
    spotlight.style.top    = `${rect.top  - pad}px`;
    spotlight.style.left   = `${rect.left - pad}px`;
    spotlight.style.width  = `${rect.width  + pad * 2}px`;
    spotlight.style.height = `${rect.height + pad * 2}px`;
    spotlight.classList.add("visible");
    backdrop.classList.add("spotlit");
    positionTourCard(el);
    // Activate card with near-target transform
    requestAnimationFrame(() => { if (card) card.classList.add("active"); });
  }, 280);
}

function initTour() {
  if (state._tourDone) return;
  const backdrop = document.getElementById("tourOverlay");
  const card     = document.getElementById("tourCard");
  if (!backdrop || !card) return;

  document.getElementById("tourNext").addEventListener("click", () => {
    tourStep < TOUR_STEPS.length - 1 ? (tourStep++, renderTourStep()) : closeTour();
  });
  document.getElementById("tourPrev").addEventListener("click", () => {
    tourStep > 0 && (tourStep--, renderTourStep());
  });
  document.getElementById("tourSkip").addEventListener("click", closeTour);

  setTimeout(() => {
    lockBodyScroll("tour");
    backdrop.hidden = false;
    card.hidden = false;
    tourStep = 0;
    renderTourStep();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      backdrop.classList.add("active");
      if (!TOUR_STEPS[0].selector) card.classList.add("active");
    }));
  }, 700);
}

function renderTourStep() {
  const s = TOUR_STEPS[tourStep];
  const card = document.getElementById("tourCard");
  document.getElementById("tourEmoji").textContent   = s.emoji;
  document.getElementById("tourTitle").textContent   = s.title;
  document.getElementById("tourDesc").textContent    = s.desc;
  document.getElementById("tourCounter").textContent = `${tourStep + 1} of ${TOUR_STEPS.length}`;
  const prev = document.getElementById("tourPrev"), next = document.getElementById("tourNext");
  prev.style.visibility = tourStep === 0 ? "hidden" : "visible";
  next.textContent = tourStep === TOUR_STEPS.length - 1 ? "Let's go! 🚀" : "Next →";
  document.getElementById("tourDots").innerHTML = TOUR_STEPS.map((_, i) =>
    `<span class="t-dot${i === tourStep ? " active" : ""}"></span>`).join("");

  // For steps with selectors: briefly fade out card, reposition, fade back in
  if (s.selector && card) {
    card.classList.remove("active");
    setTimeout(() => updateTourSpotlight(s.selector), 120);
  } else {
    updateTourSpotlight(null);
    requestAnimationFrame(() => requestAnimationFrame(() => { if (card) card.classList.add("active"); }));
  }
}

function closeTour() {
  const backdrop = document.getElementById("tourOverlay");
  const spotlight = document.getElementById("tourSpotlight");
  const card = document.getElementById("tourCard");
  if (!backdrop || !backdrop.classList.contains("active")) return;
  state._tourDone = true; Store.set(TOUR_KEY, "done");
  unlockBodyScroll("tour");
  backdrop.classList.remove("active", "spotlit");
  if (spotlight) { spotlight.classList.remove("visible"); }
  if (card) { card.classList.remove("active", "near-target"); }
  setTimeout(() => {
    backdrop.hidden = true;
    if (spotlight) spotlight.hidden = true;
    if (card) card.hidden = true;
  }, 480);
}

// ---- INIT ------------------------------------------------------------------

async function init() {
  // Load all persistent state from chrome.storage before any UI renders
  [state.data, state.goal, state.timeFormat] = await Promise.all([
    loadData(), loadGoal(), loadTimeFormat(),
  ]);
  const pomoSettings = await loadPomoSettings();
  Object.assign(state.pomo, pomoSettings);

  // Restore an active Pomodoro session that was started from the popup or a previous tab
  const pomoStateRaw = await Store.get(POMO_STATE_KEY);
  if (pomoStateRaw) {
    try {
      const ps = JSON.parse(pomoStateRaw);
      if (ps.active && ps.endTime && ps.endTime > Date.now()) {
        state.pomo.enabled = true;
        state.pomo.phase   = ps.phase || "focus";
        state.pomo.endTime = ps.endTime;
        state.pomo.cycles  = ps.cycles || 0;
        if (ps.phase === "focus") focusTotalMs = pomoFocusMs();
        else focusTotalMs = pomoBreakMs();
      }
    } catch {}
  }
  const stored = await Store.getMany(
    [THEME_KEY, GOAL_DATE_KEY, GOAL_CELEBRATED_KEY, TOUR_KEY],
    { [THEME_KEY]: "warm", [GOAL_DATE_KEY]: "", [GOAL_CELEBRATED_KEY]: "", [TOUR_KEY]: "" }
  );
  state._theme          = stored[THEME_KEY]          || "warm";
  state._goalSetDate    = stored[GOAL_DATE_KEY]       || "";
  state._goalCelebrated = stored[GOAL_CELEBRATED_KEY] || "";
  state._tourDone       = stored[TOUR_KEY]            === "done";

  initTheme();
  initTOD();

  buildClockTicks();
  updateClock();
  setInterval(updateClock, 1000);

  sanitizeRunningState();
  catchUpRunningSession();
  updateSessionDisplay();
  refreshAll();
  updatePomoDisplay();

  elements.startBtn.addEventListener("click", startTimer);
  elements.stopBtn.addEventListener("click", stopTimer);
  elements.clearTodayBtn.addEventListener("click", clearToday);
  elements.calendarDays.addEventListener("click", handleCalendarClick);
  elements.prevMonthBtn.addEventListener("click", () => changeMonth(-1));
  elements.nextMonthBtn.addEventListener("click", () => changeMonth(1));
  elements.pomoToggleBtn.addEventListener("click", togglePomodoro);
  elements.goalEditBtn.addEventListener("click", editGoal);

  // Session modal
  const sessionOk = document.getElementById("sessionModalOk");
  const sessionCancel = document.getElementById("sessionModalCancel");
  const sessionInput = document.getElementById("sessionModalInput");
  if (sessionOk) sessionOk.addEventListener("click", () => {
    const label = sessionInput ? sessionInput.value : "";
    closeSessionModal();
    doStartTimer(label);
  });
  if (sessionCancel) sessionCancel.addEventListener("click", closeSessionModal);
  if (sessionInput) sessionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); sessionOk && sessionOk.click(); }
  });
  // Close on backdrop click
  document.getElementById("sessionModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeSessionModal();
  });

  // Goal modal
  const goalOk = document.getElementById("goalModalOk");
  const goalCancel = document.getElementById("goalModalCancel");
  const goalInput = document.getElementById("goalModalInput");
  if (goalOk) goalOk.addEventListener("click", doSaveGoal);
  if (goalCancel) goalCancel.addEventListener("click", closeGoalModal);
  if (goalInput) goalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); goalOk && goalOk.click(); }
  });
  // Enter key support for H/M/S goal inputs
  ["goalModalH","goalModalM","goalModalS"].forEach(id => {
    document.getElementById(id)?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); goalOk && goalOk.click(); }
    });
  });
  document.getElementById("goalModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeGoalModal();
  });

  // Clear Today modal
  document.getElementById("clearModalOk")?.addEventListener("click", doClearToday);
  document.getElementById("clearModalCancel")?.addEventListener("click", closeClearModal);
  document.getElementById("clearModal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeClearModal();
  });

  setInterval(tickProductivity, 1000);
  setInterval(tickPomodoro, 500);

  init3D();
  initCardLift();
  initParallax();
  initCanvas();
  initKeyboard();
  initSettings();
  initPomoSettings();
  initFocusOverlay();
  initReadingOverlay();
  initMonthChart();
  initTour();
}

// ── React to storage changes from popup or background ─────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  if (changes[STORAGE_KEY]) {
    try {
      const raw = changes[STORAGE_KEY].newValue;
      if (raw) {
        const incoming = JSON.parse(raw);
        // Only adopt external session changes; don't clobber data during active tick
        if (!state.data.running.isRunning && incoming.running?.isRunning) {
          state.data = incoming;
          updateSessionDisplay();
          refreshAll();
        } else if (state.data.running.isRunning && !incoming.running?.isRunning) {
          state.data = incoming;
          updateSessionDisplay();
          refreshAll();
        }
      }
    } catch {}
  }

  if (changes[POMO_STATE_KEY]) {
    try {
      const raw = changes[POMO_STATE_KEY].newValue;
      if (!raw) return;
      const ps = JSON.parse(raw);
      const p  = state.pomo;
      // Adopt only if the change came from popup (active/phase mismatch or different endTime)
      const samePhase  = ps.phase === p.phase;
      const sameActive = ps.active === p.enabled;
      const closeTime  = Math.abs((ps.endTime || 0) - (p.endTime || 0)) < 3000;
      if (!sameActive || !samePhase || !closeTime) {
        p.enabled = !!ps.active;
        p.phase   = ps.phase || "focus";
        p.endTime = ps.endTime || null;
        p.cycles  = ps.cycles || p.cycles;
        updatePomoDisplay();
        updateFocusOverlay();
      }
    } catch {}
  }
});

init();
