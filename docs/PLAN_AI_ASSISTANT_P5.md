# Kế hoạch chỉnh Trợ lý AI + sẵn sàng UAT

> Binding: `docs/SPEC_AI_ASSISTANT.md` · `SPEC_FINGERPRINT` §4.5 / §4.7 / §16.2 mục 11.

## Trạng thái

**P5 + AI base + UAT harden Phase 1:** đã triển khai theo SPEC.

## Checklist UAT harden

1. [x] Admin CTA nhắc truyền `payload.date`
2. [x] Greeting FE Admin + `reminderHint` theo ngày thực
3. [x] `assertCanWrite` enforce `reportBlocked`
4. [x] HEAD stream chặn STATUS_PICKER / BATCH khi không ghi được
5. [x] NLP HEAD needles lowercase
6. [x] ChangePassword `max-lg:pb-24`
7. [ ] Regression QA thủ công (user / staging)

## Ngoài phạm vi UAT vòng 1

- SSE realtime sau scan  
- Self-service NV xin nghỉ  
- Xóa hẳn `attendance_report_submissions`  
- AUTO throttle/log densify (P1 sau UAT)  
