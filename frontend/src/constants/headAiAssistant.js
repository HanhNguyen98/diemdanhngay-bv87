export const HEAD_AI_ASSISTANT_UI = {
  title: 'Trợ lý AI',
  placeholder: 'Nhập yêu cầu chấm công...',
  sendLabel: 'Gửi',
  closeLabel: 'Đóng trợ lý AI',
  thinking: 'Đang xử lý...',
  errorGeneric: 'Không thể kết nối Trợ lý AI. Vui lòng thử lại.',
  disabledHint: 'Không thể chấm công khi đã khóa hoặc ngoài khung giờ.',
  quickActions: [{ id: 'batch_attendance', label: 'Chấm công hàng loạt' }],
  widgets: {
    statusPickerTitle: 'Chọn trạng thái chấm công',
    statusPickerHint: 'Áp dụng cho nhân viên chưa xác nhận hôm nay',
    confirmTitle: 'Xác nhận chấm công hàng loạt',
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
