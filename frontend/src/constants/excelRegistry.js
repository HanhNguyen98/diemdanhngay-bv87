import { ADMIN_UI } from './admin';

const { form, staff, departments } = ADMIN_UI;

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
  templateHeaders: [form.deptName, form.location, form.headName],
  templateSampleRow: ['Ban Giám đốc', 'Tòa A, Tầng 2', 'Nguyễn Văn A'],
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
    headers: [columns.code, columns.name, columns.location, columns.head, columns.staff],
    rows: filtered.map((d) => [
      d.deptCodeFormatted,
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
