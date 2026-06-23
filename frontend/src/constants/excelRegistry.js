import { ADMIN_UI } from './admin';

const { form, staff, departments, staffRanks, staffPositions, statusCatalog } = ADMIN_UI;

export const STAFF_EXCEL = {
  templateFilename: 'mau-nhan-vien.xlsx',
  exportFilename: 'nhan-vien.xlsx',
  sheetName: 'Nhân viên',
  templateHeaders: [
    form.deptCode,
    form.fullname,
    form.rank,
    form.position,
    form.status,
  ],
  templateSampleRow: ['01', 'Nguyễn Văn A', 'Thượng tá', 'Trưởng ban', staff.active],
};

export const DEPARTMENT_EXCEL = {
  templateFilename: 'mau-phong-ban-khoa.xlsx',
  exportFilename: 'phong-ban-khoa.xlsx',
  sheetName: 'Đơn vị',
  templateHeaders: [form.groupName, form.deptName, form.location, form.headName],
  templateSampleRow: ['CƠ QUAN', 'Ban Giám đốc', 'Tòa A, Tầng 2', 'Nguyễn Văn A'],
};

export function buildStaffExportSheet(filtered) {
  const { columns, active, inactive } = staff;
  return {
    headers: [
      columns.code,
      columns.dept,
      columns.name,
      columns.rank,
      columns.position,
      columns.status,
    ],
    rows: filtered.map((s) => [
      s.empCodeFormatted,
      `[${s.deptCodeFormatted}] ${s.deptName}`,
      s.fullname,
      s.rankName || '—',
      s.positionName || '—',
      s.active ? active : inactive,
    ]),
  };
}

export function buildDepartmentExportSheet(filtered) {
  const { columns } = departments;
  return {
    headers: [columns.group, columns.name, columns.location, columns.head, columns.staff],
    rows: filtered.map((d) => [
      d.groupName || '—',
      d.deptName,
      d.location || '—',
      d.headName
        ? d.headRank
          ? `${d.headName} (${d.headRank})`
          : d.headName
        : '—',
      d.staffCount,
    ]),
  };
}

export const STAFF_RANK_EXCEL = {
  templateFilename: 'mau-cap-bac.xlsx',
  exportFilename: 'cap-bac.xlsx',
  sheetName: 'Cấp bậc',
  templateHeaders: [staffRanks.form.name, staffRanks.form.sortOrder, staffRanks.form.active],
  templateSampleRow: ['Thượng tá', '6', staffRanks.active],
};

export const STAFF_POSITION_EXCEL = {
  templateFilename: 'mau-chuc-vu.xlsx',
  exportFilename: 'chuc-vu.xlsx',
  sheetName: 'Chức vụ',
  templateHeaders: [
    staffPositions.form.name,
    staffPositions.form.sortOrder,
    staffPositions.form.active,
  ],
  templateSampleRow: ['Trưởng ban', '8', staffPositions.active],
};

export const STATUS_CATALOG_EXCEL = {
  templateFilename: 'mau-trang-thai-lam-viec.xlsx',
  exportFilename: 'trang-thai-lam-viec.xlsx',
  sheetName: 'Trạng thái làm việc',
  templateHeaders: [
    statusCatalog.form.code,
    statusCatalog.form.label,
    statusCatalog.form.badgeLabel,
    statusCatalog.form.color,
    statusCatalog.form.icon,
    statusCatalog.form.sortOrder,
    statusCatalog.form.active,
  ],
  templateSampleRow: ['DI_LAM', 'Đi làm', 'ĐI LÀM', 'green', 'check', '1', statusCatalog.active],
};

export function buildStaffRankExportSheet(filtered) {
  const { columns, active, inactive } = staffRanks;
  return {
    headers: [columns.code, columns.name, columns.sort, columns.usage, columns.status],
    rows: filtered.map((item) => [
      item.rankCodeFormatted,
      item.rankName,
      item.sortOrder,
      item.usageCount,
      item.active ? active : inactive,
    ]),
  };
}

export function buildStaffPositionExportSheet(filtered) {
  const { columns, active, inactive } = staffPositions;
  return {
    headers: [columns.code, columns.name, columns.sort, columns.usage, columns.status],
    rows: filtered.map((item) => [
      item.positionCodeFormatted,
      item.positionName,
      item.sortOrder,
      item.usageCount,
      item.active ? active : inactive,
    ]),
  };
}

export function buildStatusCatalogExportSheet(filtered) {
  const { columns, active, inactive } = statusCatalog;
  return {
    headers: [
      columns.code,
      columns.label,
      columns.badge,
      columns.sort,
      columns.usage,
      columns.status,
    ],
    rows: filtered.map((item) => [
      item.code,
      item.label,
      item.badgeLabel,
      item.sortOrder,
      item.usageCount,
      item.active ? active : inactive,
    ]),
  };
}
