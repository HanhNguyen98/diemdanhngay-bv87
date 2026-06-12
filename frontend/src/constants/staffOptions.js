/**
 * Danh mục cấp bậc & chức vụ nhân viên — single source of truth.
 * Chỉnh sửa danh sách tại đây; form admin dùng dropdown lựa chọn đơn.
 */

/** @enum {string} */
export const STAFF_RANK = {
  DAI_TUONG: 'Đại tướng',
  THUONG_TUONG: 'Thượng tướng',
  TRUNG_TUONG: 'Trung tướng',
  THIEU_TUONG: 'Thiếu tướng',
  DAI_TA: 'Đại tá',
  THUONG_TA: 'Thượng tá',
  TRUNG_TA: 'Trung tá',
  THIEU_TA: 'Thiếu tá',
  DAI_UY: 'Đại úy',
  THUONG_UY: 'Thượng úy',
  TRUNG_UY: 'Trung úy',
  THIEU_UY: 'Thiếu úy',
  DAI_TA_QNCN: 'Đại tá QNCN',
  THUONG_TA_QNCN: 'Thượng tá QNCN',
  TRUNG_TA_QNCN: 'Trung tá QNCN',
  THIEU_TA_QNCN: 'Thiếu tá QNCN',
  DAI_UY_QNCN: 'Đại úy QNCN',
  THUONG_UY_QNCN: 'Thượng úy QNCN',
  TRUNG_UY_QNCN: 'Trung úy QNCN',
  THIEU_UY_QNCN: 'Thiếu úy QNCN',
  THUONG_SI: 'Thượng sĩ',
  TRUNG_SI: 'Trung sĩ',
  HA_SI: 'Hạ sĩ',
  BINH_NHAT: 'Binh nhất',
  BINH_NHI: 'Binh nhì',
  LAO_DONG_HOP_DONG: 'Lao động hợp đồng',
};

/** Thứ tự hiển thị dropdown cấp bậc */
export const STAFF_RANK_OPTIONS = Object.values(STAFF_RANK);

/** @enum {string} */
export const STAFF_POSITION = {
  BI_THU_DANG_UY: 'Bí thư Đảng ủy',
  CHU_NHIEM_GIAM_DOC: 'Chủ nhiệm / Giám đốc bệnh viện',
  CHINH_UY: 'Chính ủy',
  PHO_CHU_NHIEM_GIAM_DOC: 'Phó Chủ nhiệm / Phó Giám đốc',
  PHO_CHINH_UY: 'Phó Chính ủy',
  CHU_NHIEM_HDKH_DT: 'Chủ nhiệm Hội đồng Khoa học – Đào tạo',
  CHANH_VAN_PHONG: 'Chánh Văn phòng',
  TRUONG_BAN: 'Trưởng ban',
  PHO_TRUONG_BAN: 'Phó Trưởng ban',
  TRUONG_KHOA: 'Trưởng khoa',
  PHO_TRUONG_KHOA: 'Phó Trưởng khoa',
  BAC_SI_TRUONG_KHOA: 'Bác sĩ trưởng khoa',
  TRUONG_PHONG: 'Trưởng phòng (Tổ chức nhân viên, CNTT, Tài chính, Vật tư…)',
  PHO_TRUONG_PHONG: 'Phó Trưởng phòng',
  TRUONG_NHOM: 'Trưởng nhóm / Tổ trưởng chuyên môn',
  BAC_SI_DIEU_TRI: 'Bác sĩ điều trị',
  BAC_SI_TRUC: 'Bác sĩ trực',
  DIEU_DUONG_TRUONG_KHOA: 'Điều dưỡng trưởng khoa',
  DIEU_DUONG_VIEN: 'Điều dưỡng viên',
  KY_THUAT_VIEN: 'Kỹ thuật viên (CĐHA, xét nghiệm, dược…)',
  HO_LY_HO_SINH: 'Hộ lý / Hộ sinh',
  NHAN_VIEN_LDHĐ: 'Nhân viên LĐHĐ',
};

/** Thứ tự hiển thị dropdown chức vụ */
export const STAFF_POSITION_OPTIONS = Object.values(STAFF_POSITION);
