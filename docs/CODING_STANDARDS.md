# Coding Standards — Diem Danh BV87

## Binding specs (read before coding)

| Role / feature | Spec file |
|----------------|-----------|
| ADMIN | `docs/SPEC_ADMIN.md` |
| HEAD | `docs/SPEC_HEAD.md` |
| Vân tay ZK9500 / Agent / IN-OUT | `docs/SPEC_FINGERPRINT.md` |

### Do not invent code outside requirements

- **Không tự ý sinh code** (API, UI, cột DB, status, Agent endpoint…) **ngoài yêu cầu** và **ngoài SPEC đã review**.
- Không suy diễn “làm thêm cho tiện”. Mơ hồ → cập nhật SPEC trước, rồi mới implement.
- Mỗi lần giao việc chỉ làm **phase/phạm vi** được nêu; không nhảy cóc phase trong `SPEC_FINGERPRINT.md` nếu chưa được yêu cầu.
- Khi xung đột mô tả: **`SPEC_FINGERPRINT.md` thắng** trên biometric / IN-OUT / COMPLETED / bỏ khóa sổ giờ HEAD.

## Language split

```
┌─────────────────────────────────────────────────┐
│  English: code, JavaDoc, method comments, logs │
│  Vietnamese: UI labels, API error messages       │
└─────────────────────────────────────────────────┘
```

## Backend example

```java
/**
 * Checks whether the department is locked after the 16:00 cutoff.
 *
 * @param deptCode department identifier (INT, not padded)
 * @param date     attendance date in Vietnam timezone
 * @return true if edits are blocked
 */
public boolean isDepartmentLocked(Integer deptCode, LocalDate date) { ... }

// User-facing — Vietnamese only
throw new AttendanceLockedException(); // message defined in exception class
```

## Frontend example

```javascript
// constants/attendance.js — Vietnamese UI labels
export const STATUS_LABELS = {
  DI_LAM: 'Đi làm',
  NGHI_PHEP: 'Nghỉ phép',
  // ...
};

// formatters.js — English function names
export function formatDeptCode(code) {
  return String(code).padStart(2, '0');
}
```

## Enum checklist

- [ ] Enum replaces magic strings
- [ ] Class JavaDoc in English
- [ ] `getLabel()` returns Vietnamese for UI
- [ ] Used in service `switch` statements

## Files to avoid creating

- Duplicate SQL scripts outside `backend/src/main/resources/`
- `*_fix.sql`, `*_backup.*` scratch files
- Committed `local-secrets.yml` or passwords in properties
