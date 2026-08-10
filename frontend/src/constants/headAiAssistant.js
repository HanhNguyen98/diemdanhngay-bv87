export const HEAD_AI_ASSISTANT_UI = {
  title: 'Trợ lý AI',
  placeholder: 'Nhập yêu cầu Chấm công...',
  sendLabel: 'Gửi',
  closeLabel: 'Đóng trợ lý AI',
  thinking: 'Đang xử lý...',
  errorGeneric: 'Không thể kết nối Trợ lý AI. Vui lòng thử lại.',
  disabledHint:
    'Không thể Chấm công hàng loạt khi đã khóa chỉnh sửa, khóa mềm, xem ngày khác, hoặc đang ở màn ngoài Chấm công.',
  welcomeMessage:
    'Chào Trưởng đơn vị, tôi có thể liệt kê nhân viên thiếu giờ ra / chưa chấm, và Chấm công hàng loạt (nghỉ phép / đi học / công tác / thai sản). Đi làm / Đi trễ chỉ ghi nhận qua vân tay.',
  quickActions: [
    { id: 'list_missing_punches', label: 'Thiếu dữ liệu' },
    { id: 'batch_attendance', label: 'Chấm công hàng loạt' },
  ],
  writeActions: ['batch_attendance'],
  widgets: {
    statusPickerTitle: 'Chọn trạng thái Chấm công',
    statusPickerHint: 'Chỉ trạng thái thủ công — Đi làm / Đi trễ qua vân tay',
    confirmTitle: 'Xác nhận Chấm công hàng loạt',
    confirmCancel: 'Hủy',
    confirmSubmit: 'Xác nhận chấm',
    confirmSending: 'Đang chấm...',
    colEmployee: 'Nhân viên',
    colCurrent: 'Hiện tại',
    overwriteWarning: (count) =>
      count > 0 ? `Sẽ ghi đè ${count} nhân viên đã chấm trước đó.` : null,
    emptyTargets: 'Không có nhân viên nào phù hợp.',
    missingPunchTitle: 'Thiếu giờ ra / chưa chấm',
    missingPunchEmpty: 'Không có trường hợp thiếu dữ liệu chấm công.',
    missingPunchCheckout: 'Thiếu giờ ra',
    missingPunchUnmarked: 'Chưa chấm',
    colReason: 'Lý do',
  },
};
