# treatment-flow-timer

## 現在の実装状態（2026-04-26 時点）

このプロジェクトは以下の4画面フローで動きます。

1. `index.html`（施術条件入力）
2. `schedule.html`（大枠/中枠/小枠の配分編集）
3. `timer.html`（実行タイマー）
4. `complete.html`（完了サマリー）

## データ受け渡し

- 条件入力は `treatmentConditionInput` として `sessionStorage` に保存
- 配分確定結果は `treatmentScheduleOutput` として `sessionStorage` に保存
- タイマー実行対象は `units > blocks > frames` の優先順で決定

## コード構成（整理済み）

- `infra/storage.js`
  - `saveConditionInput` / `loadConditionInput`
  - `saveScheduleOutput` / `loadScheduleOutput`
- `domain/execution-queue.js`
  - `buildExecutionQueueFromPayload`
- 画面スクリプト
  - `app.js` / `schedule.js` / `timer.js` / `complete.js`

## まずやること（最短）

1. 手動スモークテスト（1周）
   - `index.html → schedule.html → timer.html → complete.html`
2. `domain/execution-queue.js` のユニットテスト追加
3. `infra/storage.js` のユニットテスト追加

## 補足

段階的リビルドの背景と詳細案は `REBUILD_PROPOSAL.md` を参照。
