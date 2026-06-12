import { ADMIN_UI } from '../constants/admin';
import { STAFF_EXCEL, DEPARTMENT_EXCEL } from '../constants/excelRegistry';

const { form, staff } = ADMIN_UI;

function parseActiveStatus(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return true;
  if (['đang hoạt động', 'dang hoat dong', 'hoat dong', 'active', '1', 'true', 'có', 'co'].includes(normalized)) {
    return true;
  }
  if (['ngưng hoạt động', 'ngung hoat dong', 'inactive', '0', 'false', 'không', 'khong'].includes(normalized)) {
    return false;
  }
  throw new Error(`Trạng thái không hợp lệ: "${value}"`);
}

function parseDeptCode(value, departments, rowNumber) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    throw new Error(`Dòng ${rowNumber}: ${form.deptCode} là bắt buộc`);
  }
  const deptCode = parseInt(raw, 10);
  if (!Number.isFinite(deptCode)) {
    throw new Error(`Dòng ${rowNumber}: ${form.deptCode} không hợp lệ`);
  }
  const exists = departments.some((d) => d.deptCode === deptCode);
  if (!exists) {
    throw new Error(`Dòng ${rowNumber}: không tìm thấy ${form.deptCode} "${raw}"`);
  }
  return deptCode;
}

function parseOptionalHeadName(value, staffList, rowNumber) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const match = staffList.find(
    (staff) => staff.fullname.trim().toLowerCase() === raw.toLowerCase(),
  );
  if (!match) {
    throw new Error(`Dòng ${rowNumber}: không tìm thấy ${form.headName} "${raw}"`);
  }
  return match.empCode;
}

/**
 * @param {Record<string, string>[]} rows
 * @param {{ deptCode: number }[]} departments
 */
export function mapStaffImportRows(rows, departments) {
  const payloads = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    try {
      const fullname = row[form.fullname]?.trim();
      if (!fullname) {
        throw new Error(`Dòng ${rowNumber}: ${form.fullname} là bắt buộc`);
      }

      payloads.push({
        rowNumber,
        payload: {
          fullname,
          deptCode: parseDeptCode(row[form.deptCode], departments, rowNumber),
          rankName: row[form.rank]?.trim() || null,
          positionName: row[form.position]?.trim() || null,
          active: parseActiveStatus(row[form.status]),
          avatarUrl: null,
        },
      });
    } catch (err) {
      errors.push(err.message);
    }
  });

  return { payloads, errors };
}

/**
 * @param {Record<string, string>[]} rows
 * @param {{ empCode: number, fullname: string }[]} staffList
 */
export function mapDepartmentImportRows(rows, staffList = []) {
  const payloads = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    try {
      const deptName = row[form.deptName]?.trim();
      if (!deptName) {
        throw new Error(`Dòng ${rowNumber}: ${form.deptName} là bắt buộc`);
      }

      payloads.push({
        rowNumber,
        payload: {
          deptName,
          location: row[form.location]?.trim() || null,
          headEmpCode: parseOptionalHeadName(row[form.headName], staffList, rowNumber),
          locationImageUrl: null,
        },
      });
    } catch (err) {
      errors.push(err.message);
    }
  });

  return { payloads, errors };
}

export { STAFF_EXCEL, DEPARTMENT_EXCEL };
