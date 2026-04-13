const OUTPUT_KEY = "treatmentScheduleOutput";

const statusText = document.getElementById("statusText");
const payloadView = document.getElementById("payloadView");

function init() {
  // schedule.html で確定時に保存したデータを表示する
  const raw = sessionStorage.getItem(OUTPUT_KEY);
  if (!raw) {
    statusText.textContent = "確定済みデータが見つかりません。スケジュール画面に戻って確定してください。";
    payloadView.textContent = "(no data)";
    return;
  }

  statusText.textContent = "確定済みデータを表示しています。";

  try {
    const parsed = JSON.parse(raw);
    // 開発確認しやすいよう整形して表示
    payloadView.textContent = JSON.stringify(parsed, null, 2);
  } catch {
    statusText.textContent = "保存データの読み込みに失敗しました。";
    payloadView.textContent = raw;
  }
}

init();
