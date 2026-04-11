const STORAGE_KEY = "treatmentConditionInput";

const MENU_LABELS = {
  custom: "カスタム",
  bodywork: "もみほぐし",
  foot: "足ツボ",
  bodywork_foot: "もみほぐし＋足ツボ",
};

const SEGMENT_COLORS = ["#007aff", "#34c759", "#ff9500", "#af52de", "#ff2d55", "#5ac8fa"];

const state = {
  sourceCondition: null,
  tree: {
    frames: [],
    blocks: [],
    units: [],
  },
  selection: {
    frameId: null,
    blockId: null,
  },
  summary: {
    totalMin: 0,
    frameTotalMin: 0,
    totalDiffMin: 0,
    framePreview: [],
  },
  ui: {
    warnings: [],
    hasWarning: false,
    canEditBlock: false,
    canEditUnit: false,
    confirmLabel: "この内容で確定",
  },
};

const conditionSummary = document.getElementById("conditionSummary");
const frameBar = document.getElementById("frameBar");
const frameLegend = document.getElementById("frameLegend");
const frameList = document.getElementById("frameList");
const blockList = document.getElementById("blockList");
const unitList = document.getElementById("unitList");
const blockGuard = document.getElementById("blockGuard");
const unitGuard = document.getElementById("unitGuard");
const addFrameBtn = document.getElementById("addFrameBtn");
const addBlockBtn = document.getElementById("addBlockBtn");
const addUnitBtn = document.getElementById("addUnitBtn");
const totals = document.getElementById("totals");
const warningList = document.getElementById("warningList");
const confirmButton = document.getElementById("confirmButton");
const confirmMessage = document.getElementById("confirmMessage");
const payloadPreview = document.getElementById("payloadPreview");


init();

function init() {
  const condition = getConditionInput();

  state.sourceCondition = condition;
  state.summary.totalMin = condition.totalDurationMin;
  initializeFramesByMenu(condition);
  bindEvents();
  render();
}

function getConditionInput() {
  const raw = sessionStorage.getItem(STORAGE_KEY);

  try {
    const parsed = JSON.parse(raw);
    return {
      menuId: parsed.menuId,
      totalDurationMin: Number(parsed.totalDurationMin) || 0,
      focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas : [],
      splitLeftRight: Boolean(parsed.splitLeftRight),
      inputVersion: Number(parsed.inputVersion) || 1,
      createdAt: parsed.createdAt || new Date().toISOString(),
    };
  } catch {
    return {
      menuId: "custom",
      totalDurationMin: 60,
      focusAreas: [],
      splitLeftRight: false,
      inputVersion: 1,
      createdAt: new Date().toISOString(),
    };
  }
}

function initializeFramesByMenu(condition) {
  const total = condition.totalDurationMin;
  if (condition.menuId === "custom") {
    state.tree.frames = [];
    return;
  }

  if (condition.menuId === "bodywork") {
    state.tree.frames = [createFrameNode("もみほぐし", total, 0)];
    return;
  }

  if (condition.menuId === "foot") {
    state.tree.frames = [createFrameNode("足ツボ", total, 0)];
    return;
  }

  if (condition.menuId === "bodywork_foot") {
    const first = Math.floor(total / 2);
    const second = Math.ceil(total / 2);
    state.tree.frames = [createFrameNode("もみほぐし", first, 0), createFrameNode("足ツボ", second, 1)];
  }
}

function bindEvents() {
  addFrameBtn.addEventListener("click", () => {
    state.tree.frames.push(createFrameNode("新しい大枠", 0, state.tree.frames.length));
    render();
  });

  addBlockBtn.addEventListener("click", () => {
    if (!state.selection.frameId) {
      return;
    }
    const list = getBlocksForFrame(state.selection.frameId);
    state.tree.blocks.push(createBlockNode(state.selection.frameId, "新しい中枠", 0, list.length));
    render();
  });

  addUnitBtn.addEventListener("click", () => {
    if (!state.selection.blockId) {
      return;
    }
    const list = getUnitsForBlock(state.selection.blockId);
    state.tree.units.push(createUnitNode(state.selection.blockId, "新しい小枠", 0, list.length));
    render();
  });

  confirmButton.addEventListener("click", () => {
    const payload = createTimerPayload();
    const warningText = state.ui.hasWarning
      ? `警告 ${state.ui.warnings.length} 件がありますが、この内容で確定しました。`
      : "警告なしで確定しました。";

    confirmMessage.textContent = `${warningText}（遷移は未実装）`;
    payloadPreview.textContent = JSON.stringify(payload, null, 2);
    console.log("TimerSchedulePayload", payload);
  });
}

function createFrameNode(name, allocatedMin, order) {
  return {
    id: crypto.randomUUID(),
    name,
    allocatedMin,
    order,
  };
}

function createBlockNode(frameId, name, allocatedMin, order) {
  return {
    id: crypto.randomUUID(),
    frameId,
    name,
    allocatedMin,
    order,
  };
}

function createUnitNode(blockId, name, allocatedMin, order) {
  return {
    id: crypto.randomUUID(),
    blockId,
    name,
    allocatedMin,
    order,
  };
}

function sanitizeMin(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) {
    return 0;
  }
  return num;
}

function getBlocksForFrame(frameId) {
  return state.tree.blocks
    .filter((item) => item.frameId === frameId)
    .sort((a, b) => a.order - b.order);
}

function getUnitsForBlock(blockId) {
  return state.tree.units
    .filter((item) => item.blockId === blockId)
    .sort((a, b) => a.order - b.order);
}

function computeSummaryAndWarnings() {
  const totalMin = state.sourceCondition.totalDurationMin;
  const frameTotal = state.tree.frames.reduce((sum, frame) => sum + frame.allocatedMin, 0);
  const warnings = [];

  if (frameTotal !== totalMin) {
    warnings.push({ level: "total", message: `全体不一致: 大枠合計 ${frameTotal}分 / 総時間 ${totalMin}分`, diffMin: totalMin - frameTotal });
  }

  state.tree.frames.forEach((frame) => {
    const blocks = getBlocksForFrame(frame.id);
    const blockTotal = blocks.reduce((sum, block) => sum + block.allocatedMin, 0);

    if (blocks.length > 0 && blockTotal !== frame.allocatedMin) {
      warnings.push({
        level: "frame",
        nodeId: frame.id,
        message: `親子不一致: 大枠「${frame.name}」${frame.allocatedMin}分 / 中枠合計 ${blockTotal}分`,
        diffMin: frame.allocatedMin - blockTotal,
      });
    }

    if (frame.allocatedMin === 0) {
      warnings.push({ level: "zero", nodeId: frame.id, message: `0分警告: 大枠「${frame.name}」が0分です` });
    }
  });

  state.tree.blocks.forEach((block) => {
    const units = getUnitsForBlock(block.id);
    const unitTotal = units.reduce((sum, unit) => sum + unit.allocatedMin, 0);

    if (units.length > 0 && unitTotal !== block.allocatedMin) {
      warnings.push({
        level: "block",
        nodeId: block.id,
        message: `親子不一致: 中枠「${block.name}」${block.allocatedMin}分 / 小枠合計 ${unitTotal}分`,
        diffMin: block.allocatedMin - unitTotal,
      });
    }

    if (block.allocatedMin === 0) {
      warnings.push({ level: "zero", nodeId: block.id, message: `0分警告: 中枠「${block.name}」が0分です` });
    }
  });

  state.tree.units.forEach((unit) => {
    if (unit.allocatedMin === 0) {
      warnings.push({ level: "zero", nodeId: unit.id, message: `0分警告: 小枠「${unit.name}」が0分です` });
    }
  });

  state.summary.frameTotalMin = frameTotal;
  state.summary.totalDiffMin = totalMin - frameTotal;
  state.summary.framePreview = state.tree.frames.map((frame) => ({
    frameId: frame.id,
    name: frame.name,
    allocatedMin: frame.allocatedMin,
    ratio: totalMin > 0 ? frame.allocatedMin / totalMin : 0,
  }));

  state.ui.warnings = warnings;
  state.ui.hasWarning = warnings.length > 0;
  state.ui.canEditBlock = Boolean(state.selection.frameId);
  state.ui.canEditUnit = Boolean(state.selection.blockId);
}

function renderConditionSummary() {
  const c = state.sourceCondition;
  const items = [
    ["メニュー", MENU_LABELS[c.menuId] || c.menuId],
    ["総時間", `${c.totalDurationMin}分`],
    ["重点部位", `${c.focusAreas.length}件`],
    ["左右分割", c.splitLeftRight ? "ON" : "OFF"],
    ["inputVersion", String(c.inputVersion)],
    ["createdAt", new Date(c.createdAt).toLocaleString("ja-JP")],
  ];

  conditionSummary.innerHTML = "";
  items.forEach(([k, v]) => {
    const div = document.createElement("div");
    div.className = "summary-item";
    div.innerHTML = `<div class="k">${k}</div><div class="v">${v}</div>`;
    conditionSummary.appendChild(div);
  });
}

function renderFramePreview() {
  frameBar.innerHTML = "";
  frameLegend.innerHTML = "";

  if (state.tree.frames.length === 0) {
    const empty = document.createElement("div");
    empty.className = "segment";
    empty.style.width = "100%";
    empty.style.background = "#b0b0b7";
    empty.textContent = "大枠が未作成です";
    frameBar.appendChild(empty);
    return;
  }

  state.summary.framePreview.forEach((item, index) => {
    const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
    const pct = Math.max(item.ratio * 100, item.allocatedMin > 0 ? 2 : 1);

    const seg = document.createElement("div");
    seg.className = "segment";
    seg.style.width = `${pct}%`;
    seg.style.background = color;
    seg.textContent = `${item.name} ${item.allocatedMin}分`;
    frameBar.appendChild(seg);

    const legend = document.createElement("div");
    legend.className = "legend-item";
    legend.innerHTML = `<span class="dot" style="background:${color}"></span>${item.name} ${item.allocatedMin}分 (${(item.ratio * 100).toFixed(1)}%)`;
    frameLegend.appendChild(legend);
  });
}

function renderFrameList() {
  frameList.innerHTML = "";

  state.tree.frames
    .sort((a, b) => a.order - b.order)
    .forEach((frame) => {
      const row = document.createElement("article");
      row.className = `row${state.selection.frameId === frame.id ? " selected" : ""}`;
      row.addEventListener("click", () => {
        state.selection.frameId = frame.id;
        state.selection.blockId = null;
        render();
      });

      const grid = document.createElement("div");
      grid.className = "row-grid";

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = frame.name;
      nameInput.addEventListener("click", (e) => e.stopPropagation());
      nameInput.addEventListener("input", (e) => {
        frame.name = e.target.value;
        render();
      });

      const minInput = document.createElement("input");
      minInput.type = "number";
      minInput.min = "0";
      minInput.step = "1";
      minInput.value = String(frame.allocatedMin);
      minInput.addEventListener("click", (e) => e.stopPropagation());
      minInput.addEventListener("input", (e) => {
        frame.allocatedMin = sanitizeMin(e.target.value);
        render();
      });

      grid.appendChild(nameInput);
      grid.appendChild(minInput);

      const meta = document.createElement("p");
      const childTotal = getBlocksForFrame(frame.id).reduce((sum, b) => sum + b.allocatedMin, 0);
      meta.className = "meta";
      meta.textContent = `中枠合計: ${childTotal}分 / 差分: ${frame.allocatedMin - childTotal}分`;

      row.appendChild(grid);
      row.appendChild(meta);
      frameList.appendChild(row);
    });
}

function renderBlockList() {
  blockList.innerHTML = "";
  const frameId = state.selection.frameId;

  if (!frameId) {
    blockGuard.className = "guard warn";
    blockGuard.textContent = "先に大枠を選択してください。";
    addBlockBtn.disabled = true;
    return;
  }

  blockGuard.className = "guard";
  blockGuard.textContent = "選択中の大枠に対する中枠を編集できます。";
  addBlockBtn.disabled = false;

  getBlocksForFrame(frameId).forEach((block) => {
    const row = document.createElement("article");
    row.className = `row${state.selection.blockId === block.id ? " selected" : ""}`;
    row.addEventListener("click", () => {
      state.selection.blockId = block.id;
      render();
    });

    const grid = document.createElement("div");
    grid.className = "row-grid";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = block.name;
    nameInput.addEventListener("click", (e) => e.stopPropagation());
    nameInput.addEventListener("input", (e) => {
      block.name = e.target.value;
      render();
    });

    const minInput = document.createElement("input");
    minInput.type = "number";
    minInput.min = "0";
    minInput.step = "1";
    minInput.value = String(block.allocatedMin);
    minInput.addEventListener("click", (e) => e.stopPropagation());
    minInput.addEventListener("input", (e) => {
      block.allocatedMin = sanitizeMin(e.target.value);
      render();
    });

    grid.appendChild(nameInput);
    grid.appendChild(minInput);

    const meta = document.createElement("p");
    const childTotal = getUnitsForBlock(block.id).reduce((sum, u) => sum + u.allocatedMin, 0);
    meta.className = "meta";
    meta.textContent = `小枠合計: ${childTotal}分 / 差分: ${block.allocatedMin - childTotal}分`;

    row.appendChild(grid);
    row.appendChild(meta);
    blockList.appendChild(row);
  });
}

function renderUnitList() {
  unitList.innerHTML = "";
  const blockId = state.selection.blockId;

  if (!blockId) {
    unitGuard.className = "guard warn";
    unitGuard.textContent = "先に中枠を選択してください。";
    addUnitBtn.disabled = true;
    return;
  }

  unitGuard.className = "guard";
  unitGuard.textContent = "選択中の中枠に対する小枠を編集できます。";
  addUnitBtn.disabled = false;

  getUnitsForBlock(blockId).forEach((unit) => {
    const row = document.createElement("article");
    row.className = "row";

    const grid = document.createElement("div");
    grid.className = "row-grid";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = unit.name;
    nameInput.addEventListener("input", (e) => {
      unit.name = e.target.value;
      render();
    });

    const minInput = document.createElement("input");
    minInput.type = "number";
    minInput.min = "0";
    minInput.step = "1";
    minInput.value = String(unit.allocatedMin);
    minInput.addEventListener("input", (e) => {
      unit.allocatedMin = sanitizeMin(e.target.value);
      render();
    });

    grid.appendChild(nameInput);
    grid.appendChild(minInput);

    row.appendChild(grid);
    unitList.appendChild(row);
  });
}

function renderTotalsAndWarnings() {
  totals.innerHTML = "";
  const totalItems = [
    ["総時間", `${state.summary.totalMin}分`],
    ["大枠合計", `${state.summary.frameTotalMin}分`],
    ["差分", `${state.summary.totalDiffMin}分`],
  ];

  totalItems.forEach(([k, v]) => {
    const div = document.createElement("div");
    div.className = "summary-item";
    div.innerHTML = `<div class="k">${k}</div><div class="v">${v}</div>`;
    totals.appendChild(div);
  });

  warningList.innerHTML = "";
  if (!state.ui.hasWarning) {
    warningList.classList.add("hidden");
  } else {
    warningList.classList.remove("hidden");
    state.ui.warnings.forEach((warn) => {
      const li = document.createElement("li");
      li.textContent = warn.message;
      warningList.appendChild(li);
    });
  }
}

function createTimerPayload() {
  return {
    condition: state.sourceCondition,
    allocation: {
      totalDurationMin: state.sourceCondition.totalDurationMin,
      frames: [...state.tree.frames].sort((a, b) => a.order - b.order),
      blocks: [...state.tree.blocks].sort((a, b) => a.order - b.order),
      units: [...state.tree.units].sort((a, b) => a.order - b.order),
    },
    validation: {
      hasWarning: state.ui.hasWarning,
      warnings: state.ui.warnings,
    },
    outputVersion: 1,
    updatedAt: new Date().toISOString(),
  };
}

function render() {
  computeSummaryAndWarnings();
  renderConditionSummary();
  renderFramePreview();
  renderFrameList();
  renderBlockList();
  renderUnitList();
  renderTotalsAndWarnings();
  confirmButton.textContent = state.ui.confirmLabel;
  payloadPreview.textContent = JSON.stringify(createTimerPayload(), null, 2);
}
