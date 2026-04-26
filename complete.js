const MENU_LABELS = {
  custom: "カスタム",
  bodywork: "もみほぐし",
  foot: "足ツボ",
  bodywork_foot: "もみほぐし＋足ツボ",
};

const statusText = document.getElementById("statusText");
const summaryList = document.getElementById("summaryList");

function init() {
  const payload = TreatmentFlowInfra.storage.loadScheduleOutput(null);
  if (!payload) {
    statusText.textContent = "確定済みデータが見つかりません。スケジュール画面に戻って確定してください。";
    return;
  }

  statusText.textContent = "お疲れ様でした！";
  renderSummary(payload);
}

function renderSummary(payload) {
  const c = payload?.condition;
  if (!c) return;

  const items = [
    ["メニュー", MENU_LABELS[c.menuId] || c.menuId],
    ["総時間", `${c.totalDurationMin}分`],
    ["重点部位", c.focusAreas?.length ? c.focusAreas.join("・") : "なし"],
    ["左右分割", c.splitLeftRight ? "ON" : "OFF"],
  ];

  items.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    summaryList.appendChild(dt);
    summaryList.appendChild(dd);
  });
}

init();
