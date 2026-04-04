const MENU_LABELS = {
  custom: "カスタム",
  bodywork: "もみほぐし",
  foot: "足ツボ",
  bodywork_foot: "もみほぐし＋足ツボ",
};

const DURATION_OPTIONS_BY_MENU = {
  bodywork: [60, 75, 90, 120],
  foot: [30, 60],
  bodywork_foot: [60, 90, 120],
};

const FOCUS_AREA_DEFS = [
  { id: "neck", label: "首" },
  { id: "shoulder", label: "肩" },
  { id: "back", label: "背中" },
  { id: "lower_back", label: "腰" },
  { id: "sole", label: "足裏" },
  { id: "calf", label: "ふくらはぎ" },
  { id: "head", label: "頭" },
  { id: "arm", label: "腕" },
  { id: "palm", label: "手のひら" },
  { id: "hip", label: "臀部" },
];

const state = {
  menuId: null,
  totalDurationMin: null,
  focusAreas: [],
  splitLeftRight: false,
  ui: {
    durationOptions: [],
    errors: {},
    isValid: false,
  },
};

const menuSelect = document.getElementById("menuSelect");
const durationSelect = document.getElementById("durationSelect");
const durationCustom = document.getElementById("durationCustom");
const durationHelp = document.getElementById("durationHelp");
const focusAreaList = document.getElementById("focusAreaList");
const splitToggle = document.getElementById("splitToggle");
const nextButton = document.getElementById("nextButton");
const preview = document.getElementById("preview");
const menuError = document.getElementById("menuError");
const durationError = document.getElementById("durationError");
const formMessage = document.getElementById("formMessage");
const focusAreaCheckboxById = new Map();

init();

function init() {
  buildMenuOptions();
  buildFocusAreaOptions();
  bindEvents();
  render();
}

function buildMenuOptions() {
  Object.entries(MENU_LABELS).forEach(([id, label]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    menuSelect.appendChild(option);
  });
}

function buildFocusAreaOptions() {
  FOCUS_AREA_DEFS.forEach((area) => {
    const wrap = document.createElement("label");
    wrap.className = "checkbox-option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = area.id;
    input.addEventListener("change", handleFocusAreaToggle);

    const text = document.createElement("span");
    text.textContent = area.label;

    wrap.appendChild(input);
    wrap.appendChild(text);
    focusAreaList.appendChild(wrap);
    focusAreaCheckboxById.set(area.id, input);
  });
}

function bindEvents() {
  menuSelect.addEventListener("change", handleMenuChange);
  durationSelect.addEventListener("change", handleDurationPresetChange);
  durationCustom.addEventListener("input", handleDurationCustomInput);
  splitToggle.addEventListener("change", () => {
    setFormMessage("");
    state.splitLeftRight = splitToggle.checked;
    render();
  });

  nextButton.addEventListener("click", () => {
    const payload = createPayload();
    setFormMessage("次画面へ渡す payload をコンソールに出力しました。");
    console.log("TreatmentConditionPayload", payload);
  });
}

function handleMenuChange(event) {
  setFormMessage("");
  state.menuId = event.target.value || null;
  state.totalDurationMin = null;

  if (!state.menuId) {
    state.ui.durationOptions = [];
  } else if (state.menuId === "custom") {
    state.ui.durationOptions = [];
  } else {
    state.ui.durationOptions = DURATION_OPTIONS_BY_MENU[state.menuId] || [];
  }

  durationSelect.value = "";
  durationCustom.value = "";
  render();
}

function handleDurationPresetChange(event) {
  setFormMessage("");
  const val = Number.parseInt(event.target.value, 10);
  state.totalDurationMin = Number.isInteger(val) ? val : null;
  render();
}

function handleDurationCustomInput(event) {
  setFormMessage("");
  const raw = event.target.value.trim();
  if (raw === "") {
    state.totalDurationMin = null;
    render();
    return;
  }

  const value = Number(raw);
  if (Number.isInteger(value)) {
    state.totalDurationMin = value;
  } else {
    state.totalDurationMin = null;
  }

  render();
}

function handleFocusAreaToggle(event) {
  setFormMessage("");
  const areaId = event.target.value;
  const isChecked = event.target.checked;
  const hasArea = state.focusAreas.includes(areaId);

  if (isChecked && !hasArea) {
    state.focusAreas = [...state.focusAreas, areaId];
  } else if (!isChecked && hasArea) {
    state.focusAreas = state.focusAreas.filter((id) => id !== areaId);
  }

  render();
}

function validate() {
  const errors = {};

  if (!state.menuId) {
    errors.menuId = "メニューを選択してください。";
  }

  if (state.totalDurationMin == null) {
    errors.totalDurationMin = "総時間を入力してください。";
  } else if (!Number.isInteger(state.totalDurationMin) || state.totalDurationMin < 1) {
    errors.totalDurationMin = "総時間は1以上の整数で入力してください。";
  } else if (state.menuId && state.menuId !== "custom") {
    const options = DURATION_OPTIONS_BY_MENU[state.menuId] || [];
    if (!options.includes(state.totalDurationMin)) {
      errors.totalDurationMin = "選択したメニューで利用できる時間を選んでください。";
    }
  }

  state.ui.errors = errors;
  state.ui.isValid = Object.keys(errors).length === 0;
}

function createPayload() {
  return {
    menuId: state.menuId,
    totalDurationMin: state.totalDurationMin,
    focusAreas: [...state.focusAreas],
    splitLeftRight: state.splitLeftRight,
    inputVersion: 1,
    createdAt: new Date().toISOString(),
  };
}

function renderDurationInputMode() {
  const menuId = state.menuId;
  const isCustom = menuId === "custom";

  if (!menuId) {
    durationSelect.classList.remove("hidden");
    durationSelect.disabled = true;
    durationSelect.innerHTML = '<option value="">先にメニューを選択してください</option>';

    durationCustom.classList.add("hidden");
    durationCustom.disabled = true;
    durationHelp.textContent = "";
    return;
  }

  if (isCustom) {
    durationSelect.classList.add("hidden");
    durationSelect.disabled = true;

    durationCustom.classList.remove("hidden");
    durationCustom.disabled = false;
    durationHelp.textContent = "カスタムは1分以上の整数で自由入力できます。";
    return;
  }

  durationCustom.classList.add("hidden");
  durationCustom.disabled = true;

  durationSelect.classList.remove("hidden");
  durationSelect.disabled = false;
  durationSelect.innerHTML = '<option value="">選択してください</option>';

  state.ui.durationOptions.forEach((minutes) => {
    const option = document.createElement("option");
    option.value = String(minutes);
    option.textContent = `${minutes}分`;
    durationSelect.appendChild(option);
  });

  if (state.totalDurationMin != null) {
    durationSelect.value = String(state.totalDurationMin);
  }

  durationHelp.textContent = "選択したメニューで利用可能な時間のみ選べます。";
}

function renderPreview() {
  const payload = createPayload();
  preview.textContent = JSON.stringify(payload, null, 2);
}

function syncFocusAreaInputs() {
  focusAreaCheckboxById.forEach((checkbox, areaId) => {
    checkbox.checked = state.focusAreas.includes(areaId);
  });
}

function setFormMessage(message) {
  formMessage.textContent = message;
}

function render() {
  validate();
  renderDurationInputMode();
  syncFocusAreaInputs();

  menuError.textContent = state.ui.errors.menuId || "";
  durationError.textContent = state.ui.errors.totalDurationMin || "";

  nextButton.disabled = !state.ui.isValid;
  splitToggle.checked = state.splitLeftRight;

  renderPreview();
}
