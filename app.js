const state = {
  currentName: "シーフードヌードル",
  totalSeconds: 180,
  remainingSeconds: 180,
  timerId: null,
  running: false,
  soundEnabled: true,
};

const elements = {
  form: document.querySelector("#timerForm"),
  nameInput: document.querySelector("#noodleName"),
  minutesInput: document.querySelector("#minutesInput"),
  secondsInput: document.querySelector("#secondsInput"),
  resetButton: document.querySelector("#resetButton"),
  soundToggle: document.querySelector("#soundToggle"),
  currentNoodle: document.querySelector("#currentNoodle"),
  timeDisplay: document.querySelector("#timeDisplay"),
  statusText: document.querySelector("#statusText"),
  timerOrbit: document.querySelector("#timerOrbit"),
  timerStage: document.querySelector(".timer-stage"),
  toast: document.querySelector("#toast"),
};

let toastTimer = null;

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const timer = readFormTimer();

  if (!timer) return;

  setTimer(timer.name, timer.seconds);
  startTimer();
});

elements.resetButton.addEventListener("click", () => {
  resetTimer();
});

elements.soundToggle.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  elements.soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
  showToast(state.soundEnabled ? "アラーム音 ON" : "アラーム音 OFF");
});

elements.nameInput.value = state.currentName;
renderTimer();

function readFormTimer() {
  const name = elements.nameInput.value.trim();
  const minutes = Number(elements.minutesInput.value);
  const seconds = Number(elements.secondsInput.value);
  const totalSeconds = minutes * 60 + seconds;

  if (!name) {
    showToast("カップ麺名を入れてください");
    elements.nameInput.focus();
    return null;
  }

  if (
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    minutes < 0 ||
    minutes > 99 ||
    seconds < 0 ||
    seconds > 59 ||
    totalSeconds <= 0
  ) {
    showToast("時間を正しく設定してください");
    elements.minutesInput.focus();
    return null;
  }

  return { name, seconds: totalSeconds };
}

function setTimer(name, totalSeconds) {
  stopInterval();
  state.currentName = name;
  state.totalSeconds = totalSeconds;
  state.remainingSeconds = totalSeconds;
  state.running = false;
  elements.timerStage.classList.remove("is-finished");
  renderTimer();
}

function startTimer() {
  if (state.remainingSeconds <= 0) return;

  state.running = true;
  elements.timerStage.classList.remove("is-finished");
  elements.resetButton.disabled = false;
  elements.statusText.textContent = "COOKING";

  stopInterval();
  state.timerId = window.setInterval(() => {
    state.remainingSeconds -= 1;
    renderTimer();

    if (state.remainingSeconds <= 0) {
      finishTimer();
    }
  }, 1000);
}

function resetTimer() {
  stopInterval();
  state.running = false;
  state.remainingSeconds = state.totalSeconds;
  elements.timerStage.classList.remove("is-finished");
  renderTimer();
}

function finishTimer() {
  stopInterval();
  state.running = false;
  state.remainingSeconds = 0;
  elements.timerStage.classList.add("is-finished");
  elements.statusText.textContent = "DONE";
  elements.resetButton.disabled = false;
  renderTimer();
  notifyDone();
}

function stopInterval() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function renderTimer() {
  const progress = state.totalSeconds ? ((state.totalSeconds - state.remainingSeconds) / state.totalSeconds) * 100 : 0;

  elements.currentNoodle.textContent = state.currentName;
  elements.timeDisplay.textContent = formatTime(state.remainingSeconds);
  elements.timerOrbit.style.setProperty("--progress", String(progress));
  elements.resetButton.disabled = state.remainingSeconds === state.totalSeconds && !state.running;

  if (!state.running && state.remainingSeconds === state.totalSeconds) {
    elements.statusText.textContent = "READY";
  }

  document.title = state.running ? `${formatTime(state.remainingSeconds)} | Ramen Timer` : "Ramen Timer";
}

function notifyDone() {
  showToast(`${state.currentName} ができあがりました`);

  if (!state.soundEnabled) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audioContext = new AudioContext();
  const now = audioContext.currentTime;
  const notes = [660, 880, 990];

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.16 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.16 + 0.13);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now + index * 0.16);
    oscillator.stop(now + index * 0.16 + 0.14);
  });

  window.setTimeout(() => audioContext.close(), 800);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 1800);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
