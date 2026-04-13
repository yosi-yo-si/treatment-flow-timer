# treatment-flow-timer

## 確定後フロー仕様

- `schedule.html` の「この内容で確定」押下時、現在の `TimerSchedulePayload` を `sessionStorage` の `treatmentScheduleOutput` に保存します。
- 保存後は `complete.html` へ遷移し、確定済みデータの確認を行います。
- `complete.html` では保存済みデータがない場合、再度 `schedule.html` へ戻る導線を案内します。
