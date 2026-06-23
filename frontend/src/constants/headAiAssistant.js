export const HEAD_AI_ASSISTANT_UI = {
  title: 'Trợ lý AI',
  placeholder: 'Nhập yêu cầu Điểm danh...',
  sendLabel: 'Gửi',
  closeLabel: 'Đóng trợ lý AI',
  thinking: 'Đang xử lý...',
  errorGeneric: 'Không thể kết nối Trợ lý AI. Vui lòng thử lại.',
  disabledHint: 'Không thể Điểm danh khi đã khóa hoặc ngoài khung giờ.',
  welcomeMessage:
    'Chào Trưởng đơn vị, tôi có thể giúp bạn Điểm danh hàng loạt cho nhân viên CHƯA CHẤM.',
  quickActions: [{ id: 'batch_attendance', label: 'Điểm danh hàng loạt' }],
  widgets: {
    statusPickerTitle: 'Chọn trạng thái Điểm danh',
    statusPickerHint: 'Áp dụng cho nhân viên CHƯA CHẤM hôm nay',
    confirmTitle: 'Xác nhận Điểm danh hàng loạt',
    confirmCancel: 'Hủy',
    confirmSubmit: 'Xác nhận chấm',
    confirmSending: 'Đang chấm...',
    colEmployee: 'Nhân viên',
    colCurrent: 'Hiện tại',
    overwriteWarning: (count) =>
      count > 0 ? `Sẽ ghi đè ${count} nhân viên đã chấm trước đó.` : null,
    emptyTargets: 'Không có nhân viên nào phù hợp.',
  },
};
