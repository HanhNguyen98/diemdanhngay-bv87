/**
 * Vietnamese UI labels and messages for attendance module.
 * Enum keys match backend AttendanceStatus values.
 */

/** Trạng thái Chấm công — khớp backend AttendanceStatus / catalog */
export const ATTENDANCE_STATUS = {
  DI_LAM: 'DI_LAM',
  DI_TRE: 'DI_TRE',
  NGHI_PHEP: 'NGHI_PHEP',
  DI_HOC: 'DI_HOC',
  DI_CONG_TAC: 'DI_CONG_TAC',
  THAI_SAN: 'THAI_SAN',
  VE_SOM: 'VE_SOM',
  NGHI_TRUC: 'NGHI_TRUC',
  NGHI_TRUC_FULL: 'NGHI_TRUC_FULL',
  NGHI_TRUC_HALF: 'NGHI_TRUC_HALF',
};

/** Status HEAD được gán thủ công (không gồm DI_LAM / DI_TRE từ vân tay) */
export const MANUAL_ATTENDANCE_STATUSES = [
  ATTENDANCE_STATUS.NGHI_PHEP,
  ATTENDANCE_STATUS.DI_HOC,
  ATTENDANCE_STATUS.DI_CONG_TAC,
  ATTENDANCE_STATUS.THAI_SAN,
];

/** Bộ lọc trạng thái trên bảng */
export const ATTENDANCE_FILTER = {
  ALL: 'ALL',
  UNCHECKED: 'UNCHECKED',
};

/** Chưa có status (OUT-only / chưa chấm) — badge CHƯA CHẤM + quick-action HEAD. */
export function isAttendanceBlank(staff) {
  return staff == null || staff.status == null;
}

/**
 * Hợp lệ “đã chấm” — SPEC §4.5 / §4.13.
 */
export function countAttendancePunches(staff) {
  if (staff == null) return 0;
  return [staff.morningInAt, staff.noonOutAt, staff.afternoonInAt, staff.afternoonOutAt]
    .filter(Boolean).length;
}

function punchCount(staff) {
  return countAttendancePunches(staff);
}

/** Pre-P7: morning IN + afternoon OUT only. */
export function isLegacyTwoPunchComplete(staff) {
  if (staff == null) return false;
  return Boolean(
    staff.morningInAt &&
      staff.afternoonOutAt &&
      !staff.noonOutAt &&
      !staff.afternoonInAt,
  );
}

export function hasEmptyFourPunchSlot(staff) {
  if (staff == null) return true;
  const morning = staff.morningInAt || staff.checkInAt;
  const afternoonOut = staff.afternoonOutAt || (!staff.noonOutAt ? staff.checkOutAt : null);
  return !morning || !staff.noonOutAt || !staff.afternoonInAt || !afternoonOut;
}

export function isPostScanOverrideAction(action) {
  if (!action) return false;
  if (
    action.value === ATTENDANCE_STATUS.NGHI_TRUC ||
    action.value === ATTENDANCE_STATUS.NGHI_TRUC_FULL ||
    action.value === ATTENDANCE_STATUS.NGHI_TRUC_HALF
  ) {
    return true;
  }
  return (action.statusOptions || []).some(
    (opt) =>
      opt.value === ATTENDANCE_STATUS.NGHI_TRUC_FULL ||
      opt.value === ATTENDANCE_STATUS.NGHI_TRUC_HALF,
  );
}

export function isAttendanceComplete(staff) {
  if (staff == null || staff.status == null) return false;
  if (isPayrollFillPending(staff)) return false;
  if (staff.status === ATTENDANCE_STATUS.NGHI_TRUC_HALF) {
    if (staff.payrollFillStatus === PAYROLL_FILL_STATUS.APPROVED) {
      return punchCount(staff) === 4
        || isLegacyTwoPunchComplete(staff)
        || Boolean(
          (staff.morningInAt && staff.noonOutAt && !staff.afternoonInAt && !staff.afternoonOutAt)
          || (!staff.morningInAt && !staff.noonOutAt && staff.afternoonInAt && staff.afternoonOutAt),
        );
    }
    const morningHalf = Boolean(
      staff.morningInAt && staff.noonOutAt && !staff.afternoonInAt && !staff.afternoonOutAt,
    );
    const afternoonHalf = Boolean(
      !staff.morningInAt && !staff.noonOutAt && staff.afternoonInAt && staff.afternoonOutAt,
    );
    return morningHalf || afternoonHalf;
  }
  if (staff.status === ATTENDANCE_STATUS.NGHI_TRUC_FULL) {
    return staff.payrollFillStatus !== PAYROLL_FILL_STATUS.PENDING;
  }
  if (staff.status === ATTENDANCE_STATUS.VE_SOM) {
    return punchCount(staff) === 4 && Boolean(staff.note && String(staff.note).trim());
  }
  if (
    staff.status === ATTENDANCE_STATUS.DI_LAM ||
    staff.status === ATTENDANCE_STATUS.DI_TRE
  ) {
    const n = punchCount(staff);
    if (n === 4) return true;
    if (isLegacyTwoPunchComplete(staff)) return true;
    if (n === 0) return Boolean(staff.checkInAt && staff.checkOutAt);
    return false;
  }
  return true;
}

/** Chưa hợp lệ (tiến độ / filter Chưa chấm / KPI). */
export function isAttendanceUnchecked(staff) {
  return !isAttendanceComplete(staff);
}

/** HEAD payroll intent — SPEC P8 (constants only, never infer from punches). */
export const PAYROLL_INTENT = {
  HALF_MORNING: 'HALF_MORNING',
  HALF_AFTERNOON: 'HALF_AFTERNOON',
  NGHI_TRUC_FULL: 'NGHI_TRUC_FULL',
  EXPLAIN_ONLY: 'EXPLAIN_ONLY',
};

/** Admin payroll fill lifecycle — SPEC P8. */
export const PAYROLL_FILL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
};

/** Wizard assignment options — maps intent → catalog status (BE PayrollIntent.targetStatusCode). */
export const NGHI_TRUC_ASSIGNMENT = {
  FULL: {
    payrollIntent: PAYROLL_INTENT.NGHI_TRUC_FULL,
    status: ATTENDANCE_STATUS.NGHI_TRUC_FULL,
    label: 'Nghỉ trực 1 buổi (cả ngày)',
  },
  HALF_MORNING: {
    payrollIntent: PAYROLL_INTENT.HALF_MORNING,
    status: ATTENDANCE_STATUS.NGHI_TRUC_HALF,
    label: 'Nghỉ trực nửa buổi (buổi sáng)',
  },
  HALF_AFTERNOON: {
    payrollIntent: PAYROLL_INTENT.HALF_AFTERNOON,
    status: ATTENDANCE_STATUS.NGHI_TRUC_HALF,
    label: 'Nghỉ trực nửa buổi (buổi chiều)',
  },
};

export const NGHI_TRUC_WIZARD_OPTIONS = [
  NGHI_TRUC_ASSIGNMENT.HALF_MORNING,
  NGHI_TRUC_ASSIGNMENT.HALF_AFTERNOON,
  NGHI_TRUC_ASSIGNMENT.FULL,
];

export function isNghiTrucStatus(status) {
  return status === ATTENDANCE_STATUS.NGHI_TRUC_HALF
    || status === ATTENDANCE_STATUS.NGHI_TRUC_FULL;
}

/** N.trực wizard khi chưa đủ 4 mốc (0–3) — gồm HEAD chấm trước khi NV quét. */
export function needsNghiTrucWizard(staff) {
  if (staff == null) return false;
  const punches = countAttendancePunches(staff);
  return punches < 4;
}

export function isPayrollFillPending(staff) {
  return staff?.payrollFillStatus === PAYROLL_FILL_STATUS.PENDING;
}

/** Admin duyệt auto-fill giờ hành chính — SPEC P8. */
export function canAdminApprovePayrollFill(staff) {
  if (staff == null) return false;
  return isPayrollFillPending(staff) && isNghiTrucStatus(staff.status);
}

export const PAYROLL_INTENT_OPTIONS = [
  { value: PAYROLL_INTENT.HALF_MORNING, label: NGHI_TRUC_ASSIGNMENT.HALF_MORNING.label },
  { value: PAYROLL_INTENT.HALF_AFTERNOON, label: NGHI_TRUC_ASSIGNMENT.HALF_AFTERNOON.label },
  { value: PAYROLL_INTENT.NGHI_TRUC_FULL, label: NGHI_TRUC_ASSIGNMENT.FULL.label },
];

/** @deprecated standalone explain — use NghiTrucAssignModal wizard */
export function needsMissingPunchExplain(staff) {
  if (staff == null || isAttendanceComplete(staff)) return false;
  if (staff.status === ATTENDANCE_STATUS.VE_SOM) return false;
  if (isNghiTrucStatus(staff.status)) return false;
  return !staff?.missingPunchReason?.trim();
}

/** Admin điền giờ tay (không nghỉ trực chờ duyệt). */
export function canAdminFillTimes(staff) {
  if (staff == null) return false;
  if (canAdminApprovePayrollFill(staff)) return false;
  const isManualLeave =
    staff.status != null &&
    staff.status !== ATTENDANCE_STATUS.DI_LAM &&
    staff.status !== ATTENDANCE_STATUS.DI_TRE;
  if (isManualLeave) return false;
  if (!hasEmptyFourPunchSlot(staff)) return false;
  return Boolean(staff.missingPunchReason?.trim());
}

/**
 * Presence but not yet complete — SPEC §4.5.1.
 */
export function isMissingCheckout(staff) {
  if (staff == null) return false;
  if (
    staff.status !== ATTENDANCE_STATUS.DI_LAM &&
    staff.status !== ATTENDANCE_STATUS.DI_TRE
  ) {
    return false;
  }
  if (isAttendanceComplete(staff)) return false;
  return punchCount(staff) >= 1 || Boolean(staff.checkInAt);
}

export const STATUS_OPTIONS = [
  { value: ATTENDANCE_STATUS.DI_LAM, label: 'Đi làm' },
  { value: ATTENDANCE_STATUS.DI_TRE, label: 'Đi trễ' },
  { value: ATTENDANCE_STATUS.NGHI_PHEP, label: 'Nghỉ phép' },
  { value: ATTENDANCE_STATUS.DI_HOC, label: 'Đi học' },
  { value: ATTENDANCE_STATUS.DI_CONG_TAC, label: 'Công tác' },
  { value: ATTENDANCE_STATUS.THAI_SAN, label: 'Thai sản' },
];

/** Nút chấm nhanh — chỉ 4 status thủ công (SPEC) */
export const QUICK_ACTIONS = [
  { value: ATTENDANCE_STATUS.NGHI_PHEP, color: 'red', icon: 'x', label: 'Nghỉ phép' },
  { value: ATTENDANCE_STATUS.DI_HOC, color: 'yellow', icon: 'graduation', label: 'Đi học' },
  { value: ATTENDANCE_STATUS.DI_CONG_TAC, color: 'blue', icon: 'briefcase', label: 'Công tác' },
  { value: ATTENDANCE_STATUS.THAI_SAN, color: 'purple', icon: 'baby', label: 'Thai sản' },
];

/**
 * Short labels for desktop QuickActionGroup (P6-HeadQuickLabel).
 * Visible without hover; full name stays on title / aria-label.
 */
export const QUICK_ACTION_SHORT_LABEL = {
  [ATTENDANCE_STATUS.NGHI_PHEP]: 'Nghỉ P',
  [ATTENDANCE_STATUS.DI_HOC]: 'Đi học',
  [ATTENDANCE_STATUS.DI_CONG_TAC]: 'C.tác',
  [ATTENDANCE_STATUS.THAI_SAN]: 'T.sản',
  [ATTENDANCE_STATUS.VE_SOM]: 'V.sớm',
  [ATTENDANCE_STATUS.NGHI_TRUC]: 'N.trực',
  [ATTENDANCE_STATUS.NGHI_TRUC_FULL]: 'N.trực',
  [ATTENDANCE_STATUS.NGHI_TRUC_HALF]: '½ ngày',
  [ATTENDANCE_STATUS.DI_LAM]: 'Đi làm',
  [ATTENDANCE_STATUS.DI_TRE]: 'Đi trễ',
  HSQ_BS: 'HSQ',
  HSQ_BS_WORK: 'HSQ làm',
  HSQ_BS_LEAVE: 'HSQ nghỉ',
};

/** @param {string} value status code @param {string} [fullLabel] fallback */
export function getQuickActionShortLabel(value, fullLabel) {
  return QUICK_ACTION_SHORT_LABEL[value] || fullLabel || value;
}

/** Cột bảng — giờ vào/ra (lớp A) + thao tác gồm Chi tiết quét (lớp B) */
export const ATTENDANCE_TABLE_COLUMNS = [
  { key: 'employee', label: 'NHÂN VIÊN', align: 'left', width: '17%' },
  { key: 'rank', label: 'CẤP BẬC', align: 'left', width: '8%' },
  { key: 'position', label: 'CHỨC VỤ', align: 'left', width: '9%' },
  { key: 'times', label: 'GIỜ', align: 'left', width: '15%' },
  { key: 'machine', label: 'MÁY', align: 'left', width: '11%' },
  { key: 'status', label: 'TRẠNG THÁI', align: 'left', width: '14%' },
  { key: 'actions', label: 'THAO TÁC', align: 'right', width: '26%' },
];

export const SCAN_DIRECTION_LABEL = {
  IN: 'Vào',
  MORNING_IN: 'Vào sáng',
  NOON_OUT: 'Ra trưa',
  AFTERNOON_IN: 'Vào chiều',
  AFTERNOON_OUT: 'Ra chiều',
  OUT: 'Ra',
  REJECTED: 'Từ chối',
};

export const SCAN_LOG_UI = {
  title: 'Chi tiết quét',
  colTime: 'Thời điểm',
  colDirection: 'Hướng',
  colScore: 'Độ khớp vân tay',
  colMachine: 'Máy',
  colMessage: 'Ghi chú',
  empty: 'Chưa có lần quét trong ngày này.',
  loading: 'Đang tải...',
  close: 'Đóng',
  openLink: 'Chi tiết quét',
  loadError: 'Không tải được lịch sử quét.',
};

/** Modal lịch thủ công theo NV — SPEC §3.2.2 */
export const MANUAL_SCHEDULE_UI = {
  title: 'Lịch thủ công',
  openLink: 'Lịch thủ công',
  filterFrom: 'Từ',
  filterTo: 'Đến',
  filterSearch: 'Tìm',
  colFrom: 'Từ ngày',
  colTo: 'Đến ngày',
  colDays: 'Số ngày',
  colStatus: 'Trạng thái',
  empty: 'Chưa có lịch nghỉ phép / đi học / công tác / thai sản trong khoảng đã chọn.',
  loading: 'Đang tải...',
  close: 'Đóng',
  loadError: 'Không tải được lịch thủ công.',
  invalidOrder: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
  tooLong: 'Khoảng xem tối đa 400 ngày.',
};

/** Trạng thái hiển thị trên badge (chưa chấm → UNCHECKED) */
export const STATUS_BADGE = {
  [ATTENDANCE_STATUS.DI_LAM]: {
    label: 'ĐI LÀM',
    className: 'badge-status-present',
    icon: 'check',
  },
  [ATTENDANCE_STATUS.DI_TRE]: {
    label: 'ĐI TRỄ',
    className: 'badge-status-duty',
    icon: 'late',
  },
  [ATTENDANCE_STATUS.NGHI_PHEP]: {
    label: 'NGHỈ PHÉP',
    className: 'badge-status-absent',
    icon: 'x',
  },
  [ATTENDANCE_STATUS.DI_HOC]: {
    label: 'ĐI HỌC',
    className: 'badge-status-study',
    icon: 'graduation',
  },
  [ATTENDANCE_STATUS.DI_CONG_TAC]: {
    label: 'CÔNG TÁC',
    className: 'badge-status-trip',
    icon: 'briefcase',
  },
  [ATTENDANCE_STATUS.THAI_SAN]: {
    label: 'THAI SẢN',
    className: 'badge-status-purple',
    icon: 'baby',
  },
  UNCHECKED: {
    label: 'CHƯA CHẤM',
    className: 'badge-status-pending',
    icon: 'pending',
  },
};

export const DEFAULT_LOCK_MESSAGE =
  'Hệ thống đã tự động khóa. Liên hệ Admin nếu cần chỉnh sửa.';

/** Ô vuông icon trên KPI card trạng thái Chấm công */
export const KPI_METRIC_ICON_BOX = 'h-11 w-11';
export const KPI_METRIC_ICON_SIZE = 'h-5 w-5';

export const UI = {
  appName: 'BỆNH VIỆN QUÂN Y 87',
  appSubtitleAdmin: 'Admin Center',
  appSubtitleHead: 'Chương trình chấm công',
  footerCopyright:
    '© 2026 Bệnh viện Quân y 87  — Chương trình chấm công phát triển bởi Tham mưu - Hành chính',
  footerCopyrightMobile:
    '© 2026 Bệnh viện Quân y 87 | Chương trình chấm công phát triển bởi Tham mưu - Hành chính',
  pageTitle: 'Chấm công HẰNG NGÀY',
  staffListTitle: 'Danh sách nhân sự',
  kpiProgress: 'TIẾN ĐỘ Chấm công',
  kpiProgressLabel: 'Tiến độ Chấm công',
  kpiProgressSubtitle: 'Nhân viên đã có mặt hôm nay',
  kpiRemaining: 'Còn lại',
  kpiRate: 'TỶ LỆ',
  kpiPresent: 'ĐI LÀM',
  kpiAbsent: 'NGHỈ PHÉP',
  kpiStudy: 'ĐI HỌC',
  kpiDuty: 'ĐI CÔNG TÁC',
  employeesCapitalized: 'Nhân viên',
  loginTitle: 'Đăng nhập',
  logout: 'Đăng xuất',
  support: 'Hỗ trợ',
  refresh: 'Làm mới',
  loading: 'Đang tải dữ liệu...',
  readOnly: 'CHẾ ĐỘ XEM',
  readOnlyLong: 'Chế độ chỉ xem',
  viewingHistoryPrefix: 'Đang xem dữ liệu ngày',
  viewingHistorySuffix: '— chỉ xem, không chỉnh sửa',
  viewingHistoryUnlockedSuffix: '— có thể chỉnh sửa',
  lockedBadge: 'ĐÃ KHÓA SỔ',
  softLockBadge: 'KHÓA MỀM',
  pastDateLockedBadge: 'CHƯA MỞ KHÓA',
  pastDateLockedBanner:
    'Ngày quá khứ chưa được Admin mở khóa. Gửi yêu cầu để Admin xác nhận.',
  unlockRequestButton: 'Gửi yêu cầu mở khóa',
  unlockRequestPendingBadge: 'CHỜ XÁC NHẬN',
  unlockRequestPendingBanner:
    'Đã gửi yêu cầu mở khóa. Chờ Admin xác nhận trước khi chỉnh sửa.',
  unlockRequestRejectedBanner:
    'Admin đã từ chối yêu cầu. Bạn có thể gửi lại với lý do khác.',
  unlockRequestModalTitle: 'YÊU CẦU MỞ KHÓA NGÀY CÔNG',
  unlockRequestModalBody:
    'Admin sẽ nhận yêu cầu và xác nhận trước khi bạn được sửa ngày này. Vui lòng ghi rõ lý do.',
  unlockRequestModalPlaceholder: 'Nhập lý do cần mở khóa ngày công...',
  unlockRequestSuccess: 'Đã gửi yêu cầu mở khóa đến Admin.',
  unlockRequestConfirmLabel: 'Gửi yêu cầu',
  softLockBanner: (lockTime) =>
    lockTime
      ? `Đã qua giờ khóa mềm ngày công (${lockTime}). Có thể gán lịch thủ công cho ngày khác; không sửa dữ liệu hôm nay.`
      : 'Đã qua giờ khóa mềm ngày công. Có thể gán lịch thủ công cho ngày khác; không sửa dữ liệu hôm nay.',
  unlockButton: 'Mở khóa ngày',
  relockButton: 'Thu hồi mở khóa',
  unlockModalTitle: 'XÁC NHẬN MỞ KHÓA NGÀY CÔNG',
  unlockModalBody:
    'Thao tác này cho phép Trưởng đơn vị chỉnh sửa Chấm công ngày đã chọn. Vui lòng ghi rõ lý do.',
  unlockModalPlaceholder: 'Nhập lý do mở khóa ngày công...',
  unlockSuccess: (deptCode, date) =>
    `Đã cấp quyền mở khóa cho Đơn vị ${deptCode} ngày ${date}`,
  relockSuccess: (deptCode, date) =>
    `Đã thu hồi mở khóa cho Đơn vị ${deptCode} ngày ${date}`,
  searchPlaceholder: 'Tìm tên nhân viên hoặc mã số...',
  filterButton: 'Bộ lọc',
  filterByStatus: 'Lọc theo trạng thái',
  filterClearStatus: 'Xóa lọc trạng thái',
  filterAll: 'Tất cả',
  filterUnchecked: 'Chưa chấm',
  progressTitle: 'TIẾN ĐỘ Chấm công',
  missingPunchTitle: 'Thiếu dữ liệu chấm công',
  missingPunchCheckout: 'Thiếu dữ liệu chấm công',
  missingPunchIncomplete: 'Thiếu mốc giờ',
  missingPunchEarlyLeave: 'Về sớm chưa có lý do',
  missingPunchUnmarked: 'Chưa chấm / chưa đủ',
  missingPunchHint:
    'Trưởng đơn vị: bấm N.trực để giải trình và chấm công. Admin duyệt bổ sung giờ hành chính.',
  nghiTrucWizardTitle: 'Nghỉ trực — giải trình & chấm công',
  nghiTrucWizardSectionExplain: 'Giải trình thiếu giờ',
  nghiTrucWizardSectionAssign: 'Chấm nghỉ trực',
  nghiTrucWizardHint:
    'Chọn loại nghỉ trực (sáng/chiều/cả ngày) và nhập lý do do Trưởng đơn vị ghi nhận — không phải cảnh báo tự động của hệ thống. Có thể mở lại để đổi loại hoặc sửa lý do. Admin duyệt sau để bổ sung giờ hành chính vào ô trống.',
  nghiTrucWizardReassignHint:
    'Nhân viên đã chấm nghỉ trực. Bạn có thể đổi loại nghỉ trực (sáng ↔ chiều) hoặc cập nhật lý do rồi lưu lại.',
  nghiTrucWizardIntentLabel: 'Loại nghỉ trực',
  nghiTrucWizardReasonLabel: 'Lý do (Trưởng đơn vị ghi nhận)',
  nghiTrucWizardReasonPlaceholder: 'Ví dụ: Ca trực đêm, chỉ quét ra trưa, chiều nghỉ trực…',
  nghiTrucWizardReasonFieldHint:
    'Đây là nội dung do Trưởng đơn vị nhập, không phải kết luận tự động từ giờ quét.',
  nghiTrucReasonPrefix: 'Lý do: ',
  nghiTrucWizardUseWizardHint:
    'Thiếu mốc giờ — đóng modal này và bấm N.trực để mở wizard (chọn nửa buổi sáng/chiều).',
  nghiTrucWizardDateSection: 'Khoảng ngày chấm',
  nghiTrucWizardCancel: 'Hủy',
  nghiTrucWizardSubmit: 'Lưu & chấm nghỉ trực',
  nghiTrucWizardSuccess: 'Đã chấm nghỉ trực.',
  nghiTrucWizardNeedReason: 'Vui lòng nhập lý do thiếu giờ.',
  nghiTrucWizardNeedIntent: 'Vui lòng chọn loại nghỉ trực.',
  nghiTrucWizardNeedDates: 'Vui lòng chọn đủ Từ ngày và Đến ngày.',
  payrollFillPendingBadge: 'Chờ duyệt giờ',
  payrollFillPendingBadgeTitle: 'Chờ Admin duyệt bổ sung giờ hành chính',
  payrollFillApproveAction: 'Duyệt bổ sung giờ',
  payrollFillApproveTitle: 'Duyệt bổ sung giờ hành chính',
  payrollFillApproveHint:
    'Hệ thống tự điền các mốc giờ trống theo cài đặt hành chính (không ghi đè giờ máy).',
  payrollFillApproveSubmit: 'Xác nhận duyệt',
  payrollFillApproveSuccess: 'Đã duyệt bổ sung giờ.',
  missingPunchExplainTitle: 'Giải trình thiếu giờ',
  missingPunchExplainAction: 'Giải trình thiếu giờ',
  missingPunchExplainEdit: 'Sửa giải trình',
  missingPunchExplainHint:
    'HEAD không được tự điền giờ. Nhập lý do thiếu mốc và chọn hướng xử lý để Admin bổ sung giờ lương.',
  missingPunchExplainIntentLabel: 'Hướng xử lý',
  missingPunchExplainReasonLabel: 'Lý do thiếu giờ',
  missingPunchExplainReasonPlaceholder: 'Ví dụ: Ca trực đêm, chỉ quét ra trưa…',
  missingPunchExplainSubmit: 'Lưu giải trình',
  missingPunchExplainCancel: 'Hủy',
  missingPunchExplainNeedReason: 'Vui lòng nhập lý do thiếu giờ.',
  missingPunchExplainNeedIntent: 'Vui lòng chọn hướng xử lý.',
  missingPunchExplainError: 'Không lưu được giải trình.',
  missingPunchExplainSuccess: 'Đã lưu giải trình thiếu giờ.',
  reportBlocked: 'Admin đã khóa chỉnh sửa Chấm công cho ĐƠN VỊ hôm nay.',
  manualRangeTitle: 'Chọn khoảng ngày',
  manualRangeChildStatus: 'Trạng thái con',
  manualRangeFrom: 'Từ ngày',
  manualRangeTo: 'Đến ngày',
  manualRangeNote: 'Ghi chú',
  manualRangeNotePlaceholder: 'Nhập lý do (không bắt buộc)...',
  manualRangeSubmit: 'Xác nhận',
  manualRangeSubmitting: 'Đang lưu...',
  manualRangeInvalidOrder: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
  manualRangeTooLong: 'Khoảng ngày tối đa 366 ngày.',
  manualRangeSkipContinue: 'Tiếp tục',
  manualRangeSkipCancel: 'Hủy',
  today: 'Hôm nay',
  noStaff: 'Không có dữ liệu!',
  employees: 'nhân viên',
  headRole: 'Trưởng phòng',
  unlockedBadge: 'Đã mở khóa đặc cách',
  quickActionsColumn: 'Chấm công NHANH',
  emptyCell: '—',
  veSomNotePlaceholder: 'Nhập lý do về sớm',
  veSomNoteSave: 'Lưu lý do',
  veSomNoteRequired: 'Về sớm bắt buộc nhập lý do.',
  noteLabel: 'Ghi chú',
  plusLate: '+ Đi trễ',
  timeMorningIn: 'S',
  timeNoonOut: 'T',
  timeAfternoonIn: 'C',
  timeAfternoonOut: 'V',
  breadcrumbSystem: 'Hệ thống',
  breadcrumbAttendance: 'Chấm công',
  breadcrumbStatistics: 'Thống kê',
  breadcrumbCatalog: 'Danh mục hành chính',
  headCatalog: 'Danh mục hành chính',
  headStaff: 'Nhân viên',
  staffAvatarTitle: 'Cập nhật ảnh đại diện',
  staffAvatarUpdateSuccess: 'Đã cập nhật ảnh đại diện thành công.',
  staffAvatarUpdateFailed: 'Không thể cập nhật ảnh đại diện.',
  staffAvatarSelectPhoto: 'Chọn ảnh',
  staffAvatarSelectFromComputer: 'Chọn ảnh từ máy tính',
  staffAvatarTakePhoto: 'Chụp ảnh',
  staffAvatarDeleteCurrent: 'Xóa ảnh hiện tại',
  staffAvatarNote:
    'Vui lòng sử dụng ảnh chân dung rõ mặt để thuận tiện cho việc nhận diện nhân sự trong hệ thống bệnh viện.',
  staffAvatarSave: 'Lưu thay đổi',
  staffAvatarSaving: 'Đang lưu...',
  staffAvatarIdPrefix: 'ID:',
  changePassword: 'Đổi mật khẩu',
  currentPassword: 'Mật khẩu hiện tại',
  newPassword: 'Mật khẩu mới',
  confirmPassword: 'Xác nhận mật khẩu mới',
  updatePassword: 'Cập nhật mật khẩu',
  savingPassword: 'Đang cập nhật...',
  passwordChangeSuccess: 'Đã cập nhật mật khẩu thành công',
  passwordMismatch: 'Xác nhận mật khẩu không khớp',
  passwordMinLength: 'Mật khẩu mới phải có ít nhất 6 ký tự',
};

/** Khóa điều hướng cổng trưởng phòng — dùng thống nhất Sidebar / Dashboard / drawer mobile */
export const HEAD_NAV_IDS = {
  HOME: 'home',
  STATISTICS: 'statistics',
  STAFF: 'staff',
  PASSWORD: 'password',
};

/** Menu trưởng phòng (desktop sidebar) */
export const HEAD_NAV = [
  { id: HEAD_NAV_IDS.HOME, label: 'Chấm công', icon: 'clipboard' },
  { id: HEAD_NAV_IDS.STATISTICS, label: 'Thống kê', icon: 'chart' },
];

export const HEAD_CATALOG_TAB_IDS = [HEAD_NAV_IDS.STAFF];

export const HEAD_CATALOG_NAV = [
  { id: HEAD_NAV_IDS.STAFF, label: 'Nhân viên', icon: 'users' },
];

/** Drawer menu trái — gộp menu chính + danh mục hành chính (mobile trưởng phòng) */
export const HEAD_MOBILE_DRAWER_NAV = [...HEAD_NAV, ...HEAD_CATALOG_NAV];

export const MOBILE_UI = {
  staffListTitle: 'Danh sách nhân viên',
  statusLabel: 'Trạng thái',
};

export const DESKTOP_PAGE_SIZE = 20;

/** Alias — desktop list/table page size */
export const ATTENDANCE_PAGE_SIZE = DESKTOP_PAGE_SIZE;

/** Mobile — card lists and paginated results (max-lg) */
export const MOBILE_PAGE_SIZE = 10;

/** Mobile — lịch sử thống kê (same as MOBILE_PAGE_SIZE) */
export const MOBILE_STATISTICS_HISTORY_PAGE_SIZE = MOBILE_PAGE_SIZE;

/** Mobile trưởng phòng — tải toàn bộ lịch sử trong một lần scroll */
export const MOBILE_HISTORY_FETCH_SIZE = 500;

/** Màn thống kê lịch sử Chấm công */
export const STATISTICS_UI = {
  pageTitle: 'THỐNG KÊ LỊCH SỬ Chấm công',
  timeRangeLabel: 'Khoảng thời gian',
  dateFromLabel: 'Từ ngày',
  dateToLabel: 'Đến ngày',
  searchPlaceholder: 'Tìm tên nhân viên',
  applyFilter: 'Tìm kiếm',
  kpiUnit: 'LƯỢT CHẤM CÔNG',
  chartTitle: 'Xu hướng trạng thái chuyên cần (Theo thời gian)',
  chartLegendPresent: 'ĐI LÀM',
  chartLegendAbsent: 'NGHỈ PHÉP',
  chartLegendStudy: 'ĐI HỌC',
  chartLegendTrip: 'CÔNG TÁC',
  noData: 'Không có dữ liệu!',
  maxRangeDays: 366,
  maxRangeExceeded: 'Khoảng thời gian tối đa là 366 ngày',
  historyTitle: 'Danh sách chi tiết',
  exportExcel: 'Xuất Excel',
  noHistory: 'Không có dữ liệu!',
  historyExportFilename: 'lich-su-cham-cong.xlsx',
  historyExportSheet: 'Lịch sử Chấm công',
  showingResults: (from, to, total) => `Hiển thị ${from}-${to} trên ${total} kết quả`,
  mobilePageTitle: 'Thống kê',
  mobileKpiUnit: 'LƯỢT',
  mobileHistoryTitle: 'Danh sách chi tiết',
  mobileResultsCount: (total) => `${total} kết quả`,
  mobileNotePrefix: 'Ghi chú:',
  mobileMsnvPrefix: 'MSNV:',
};

/** Calendar popover — chọn khoảng ngày (mobile) */
export const DATE_RANGE_PICKER_UI = {
  ariaLabel: 'Chọn khoảng thời gian',
  pickStart: 'Chọn ngày bắt đầu',
  pickEnd: 'Chọn ngày kết thúc',
  clear: 'Xóa',
  today: 'Hôm nay',
};

/** Preset khoảng thời gian — mobile thống kê (mockup pill) */
export const MOBILE_STATISTICS_PRESETS = [
  { value: 'THIS_MONTH', label: 'Tháng này' },
  { value: 'THIS_WEEK', label: 'Tuần này' },
  { value: 'TODAY', label: 'Hôm nay' },
  { value: 'CUSTOM', label: 'Tùy chọn' },
];

export const STATISTICS_HISTORY_COLUMNS = [
  { key: 'date', label: 'NGÀY', align: 'left', width: '14%' },
  { key: 'employee', label: 'NHÂN VIÊN', align: 'left', width: '36%' },
  { key: 'status', label: 'TRẠNG THÁI', align: 'left', width: '22%' },
  { key: 'note', label: 'GHI CHÚ', align: 'left', width: '28%' },
];

export const STATISTICS_HISTORY_EXCEL_HEADERS = ['Ngày', 'Họ và tên', 'Mã số', 'Trạng thái', 'Ghi chú'];

export const STATISTICS_HISTORY_PAGE_SIZE = DESKTOP_PAGE_SIZE;

export const TIME_RANGE_PRESETS = [
  { value: 'THIS_MONTH', label: 'Tháng này' },
  { value: 'THIS_WEEK', label: 'Tuần này' },
  { value: 'LAST_MONTH', label: 'Tháng trước' },
  { value: 'LAST_30_DAYS', label: '30 ngày qua' },
];

/** Màu biểu đồ thống kê — khớp mockup legend */
export const STATISTICS_CHART_COLORS = {
  diLam: '#2563EB',
  nghiPhep: '#14B8A6',
  diHoc: '#F59E0B',
  diCongTac: '#047857',
};
