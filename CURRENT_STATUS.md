# CURRENT STATUS

## TL;DR
- 画面動作は「入力 → 配分 → タイマー → 完了」の流れで維持されています。
- `sessionStorage` 参照は `infra/storage.js` に集約済みです。
- タイマーキュー生成は `domain/execution-queue.js` に集約済みです。
- 未完了なのは主に「テスト追加」です。

## いま壊れていないか確認する最小チェック

- `node --check app.js schedule.js timer.js complete.js infra/storage.js domain/execution-queue.js`

## 次の実装優先度

1. `domain/execution-queue.js` のテスト
2. `infra/storage.js` のテスト
3. `schedule.js` の警告ロジック切り出し（`domain/validators.js`）
