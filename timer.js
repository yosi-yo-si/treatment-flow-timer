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
  const payload = TreatmentFlowInfra.storage.loadScheduleOutput(null);
  if (!payload) {
    timerStatus.textContent = "確定済みデータが見つかりません。配分画面から確定してください。";
    disableControls(true);
    return;
  }

  state.queue = TreatmentFlowDomain.executionQueue.buildExecutionQueueFromPayload(payload);

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
    timerStatus.textContent = "全工程が完了しました。完了画面へ移動します…";
    renderQueue();
    render();
    setTimeout(() => {
      window.location.href = "complete.html";
    }, 1200);
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
