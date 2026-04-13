const OUTPUT_KEY = "treatmentScheduleOutput";

const timerStatus = document.getElementById("timerStatus");
const currentName = document.getElementById("currentName");
const currentRemain = document.getElementById("currentRemain");
const progressBar = document.getElementById("progressBar");
const startPauseBtn = document.getElementById("startPauseBtn");
const nextBtn = document.getElementById("nextBtn");
const resetBtn = document.getElementById("resetBtn");
const queueList = document.getElementById("queueList");

const state = {
  queue: [],
  index: 0,
  remainSec: 0,
  totalSec: 0,
  timerId: null,
  running: false,
};

init();

function init() {
  const raw = sessionStorage.getItem(OUTPUT_KEY);
  if (!raw) {
    timerStatus.textContent = "確定済みデータが見つかりません。配分画面から確定してください。";
    disableControls(true);
    return;
  }

  try {
    const payload = JSON.parse(raw);
    state.queue = buildExecutionQueue(payload);
  } catch {
    timerStatus.textContent = "保存データの読み込みに失敗しました。";
    disableControls(true);
    return;
  }

  if (state.queue.length === 0) {
    timerStatus.textContent = "実行対象がありません（0分のみ）。配分を確認してください。";
    disableControls(true);
    renderQueue();
    return;
  }

  timerStatus.textContent = "準備完了。開始ボタンでタイマーを実行できます。";
  bindEvents();
  resetToCurrentIndex(0);
  renderQueue();
  render();
}

function buildExecutionQueue(payload) {
  const allocation = payload?.allocation;
  if (!allocation) return [];

  // より詳細な配分があればそれを優先して実行する（units > blocks > frames）
  const base =
    allocation.units?.length > 0
      ? allocation.units
      : allocation.blocks?.length > 0
        ? allocation.blocks
        : allocation.frames || [];

  return base
    .map((item, order) => ({
      name: item.name || `枠${order + 1}`,
      sec: Math.max(0, Number(item.allocatedMin || 0) * 60),
      order,
    }))
    .filter((item) => item.sec > 0)
    .sort((a, b) => a.order - b.order);
}

function bindEvents() {
  startPauseBtn.addEventListener("click", () => {
    if (state.running) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  nextBtn.addEventListener("click", () => {
    moveNext();
  });

  resetBtn.addEventListener("click", () => {
    pauseTimer();
    resetToCurrentIndex(0);
    renderQueue();
    render();
  });
}

function startTimer() {
  if (state.running) return;
  state.running = true;
  startPauseBtn.textContent = "一時停止";

  state.timerId = window.setInterval(() => {
    state.remainSec -= 1;

    if (state.remainSec <= 0) {
      moveNext();
      return;
    }

    render();
  }, 1000);
}

function pauseTimer() {
  state.running = false;
  startPauseBtn.textContent = "開始";
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function moveNext() {
  if (state.index >= state.queue.length - 1) {
    pauseTimer();
    state.index = state.queue.length;
    timerStatus.textContent = "全工程が完了しました。";
    renderQueue();
    render();
    return;
  }

  state.index += 1;
  resetToCurrentIndex(state.index);
  renderQueue();
  render();
}

function resetToCurrentIndex(nextIndex) {
  state.index = nextIndex;
  const item = state.queue[state.index];
  state.totalSec = item ? item.sec : 0;
  state.remainSec = state.totalSec;
}

function formatSec(sec) {
  const s = Math.max(0, sec);
  const min = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(min).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

function disableControls(disabled) {
  startPauseBtn.disabled = disabled;
  nextBtn.disabled = disabled;
  resetBtn.disabled = disabled;
}

function renderQueue() {
  queueList.innerHTML = "";
  state.queue.forEach((item, idx) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${Math.floor(item.sec / 60)}分)`;
    if (idx < state.index) {
      li.className = "done";
    } else if (idx === state.index && state.index < state.queue.length) {
      li.className = "current";
    }
    queueList.appendChild(li);
  });
}

function render() {
  const item = state.queue[state.index];
  if (!item) {
    currentName.textContent = "完了";
    currentRemain.textContent = "00:00";
    progressBar.style.width = "100%";
    return;
  }

  currentName.textContent = item.name;
  currentRemain.textContent = formatSec(state.remainSec);
  const pct = state.totalSec > 0 ? ((state.totalSec - state.remainSec) / state.totalSec) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, pct)).toFixed(1)}%`;
}
