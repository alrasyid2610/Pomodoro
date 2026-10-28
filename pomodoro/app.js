const LABELS = { focus: "Fokus", short: "Istirahat Pendek", long: "Istirahat Panjang" };

const settings = { focus: 25, short: 5, long: 15, interval: 4 };
const state = { mode: "focus", remaining: settings.focus * 60, endAt: null, timerId: null, completed: 0 };

const $ = (id) => document.getElementById(id);
const timeEl = $("time");
const startBtn = $("start");

function format(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function render() {
  timeEl.textContent = format(state.remaining);
  document.title = `${format(state.remaining)} · ${LABELS[state.mode]}`;
  startBtn.textContent = state.timerId ? "Jeda" : "Mulai";
  $("count").textContent = state.completed;
  document.body.className = state.mode === "focus" ? "" : state.mode;
  document.querySelectorAll(".modes button").forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === state.mode));
}

function tick() {
  // Hitung dari waktu akhir agar tetap akurat walau tab di background.
  state.remaining = Math.max(0, Math.round((state.endAt - Date.now()) / 1000));
  if (state.remaining === 0) {
    finish();
    return;
  }
  render();
}

function start() {
  state.endAt = Date.now() + state.remaining * 1000;
  state.timerId = setInterval(tick, 250);
  render();
}

function pause() {
  clearInterval(state.timerId);
  state.timerId = null;
  render();
}

function setMode(mode) {
  pause();
  state.mode = mode;
  state.remaining = settings[mode] * 60;
  render();
}

function nextMode() {
  if (state.mode !== "focus") return "focus";
  return state.completed % settings.interval === 0 ? "long" : "short";
}

function finish() {
  if (state.mode === "focus") state.completed++;
  beep();
  notify(`${LABELS[state.mode]} selesai!`);
  setMode(nextMode());
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

function notify(msg) {
  if ("Notification" in window && Notification.permission === "granted") new Notification(msg);
}

startBtn.addEventListener("click", () => {
  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  state.timerId ? pause() : start();
});
$("reset").addEventListener("click", () => setMode(state.mode));
$("skip").addEventListener("click", () => setMode(nextMode()));
document.querySelectorAll(".modes button").forEach((b) =>
  b.addEventListener("click", () => setMode(b.dataset.mode)));

[["set-focus", "focus"], ["set-short", "short"], ["set-long", "long"], ["set-interval", "interval"]].forEach(([id, key]) => {
  $(id).addEventListener("change", (e) => {
    const v = parseInt(e.target.value, 10);
    if (v > 0) settings[key] = v;
    if (!state.timerId && key === state.mode) setMode(state.mode);
  });
});

render();
