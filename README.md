# treatment-flow-timer

## 確定後フロー仕様

- `schedule.html` の「この内容で確定」押下時、現在の `TimerSchedulePayload` を `sessionStorage` の `treatmentScheduleOutput` に保存します。
- 保存後は `timer.html` へ遷移し、確定した配分をそのままタイマー実行します。
- `timer.html` では、`units` → `blocks` → `frames` の優先順で実行対象を決定します（より細かい単位を優先）。
- `timer.html` では開始・一時停止・次へ・リセットの操作が可能です。
