import { ADMIN_UI } from '../constants/admin';
import { STAFF_EXCEL, DEPARTMENT_EXCEL } from '../constants/excelRegistry';

const { form, staff, staffRanks, staffPositions, statusCatalog } = ADMIN_UI;

function parseActiveStatus(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return true;
  if (
    [
      'đang hoạt động',
      'dang hoat dong',
      'đang sử dụng',
      'dang su dung',
      'hoat dong',
      'active',
      '1',
      'true',
      'có',
      'co',
    ].includes(normalized)
  ) {
    return true;
  }
  if (
    [
      'ngưng hoạt động',
      'ngung hoat dong',
      'ngưng sử dụng',
      'ngung su dung',
      'inactive',
      '0',
      'false',
      'không',
      'khong',
    ].includes(normalized)
  ) {
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
 * @param {{ rankNames?: string[], positionNames?: string[] }} [catalog]
 */
export function mapStaffImportRows(rows, departments, catalog = {}) {
  const rankSet = new Set(catalog.rankNames || []);
  const positionSet = new Set(catalog.positionNames || []);
  const validateCatalog = rankSet.size > 0 || positionSet.size > 0;
  const payloads = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    try {
      const fullname = row[form.fullname]?.trim();
      if (!fullname) {
        throw new Error(`Dòng ${rowNumber}: ${form.fullname} là bắt buộc`);
      }

      const rankName = row[form.rank]?.trim() || null;
      const positionName = row[form.position]?.trim() || null;

      if (validateCatalog && rankName && rankSet.size > 0 && !rankSet.has(rankName)) {
        throw new Error(`Dòng ${rowNumber}: ${form.rank} không hợp lệ "${rankName}"`);
      }
      if (
        validateCatalog &&
        positionName &&
        positionSet.size > 0 &&
        !positionSet.has(positionName)
      ) {
        throw new Error(`Dòng ${rowNumber}: ${form.position} không hợp lệ "${positionName}"`);
      }

      payloads.push({
        rowNumber,
        payload: {
          fullname,
          deptCode: parseDeptCode(row[form.deptCode], departments, rowNumber),
          rankName,
          positionName,
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
 * @param {{ groupCode: number, groupName: string }[]} groups
 */
export function mapDepartmentImportRows(rows, staffList = [], groups = []) {
  const payloads = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    try {
      const groupName = row[form.groupName]?.trim();
      if (!groupName) {
        throw new Error(`Dòng ${rowNumber}: ${form.groupName} là bắt buộc`);
      }
      const group = groups.find(
        (g) => g.groupName.localeCompare(groupName, 'vi', { sensitivity: 'accent' }) === 0,
      );
      if (!group) {
        throw new Error(`Dòng ${rowNumber}: Không tìm thấy nhóm "${groupName}"`);
      }

      const deptName = row[form.deptName]?.trim();
      if (!deptName) {
        throw new Error(`Dòng ${rowNumber}: ${form.deptName} là bắt buộc`);
      }

      payloads.push({
        rowNumber,
        payload: {
          groupCode: group.groupCode,
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

function parseOptionalSortOrder(value, rowNumber, label) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const sortOrder = parseInt(raw, 10);
  if (!Number.isFinite(sortOrder) || sortOrder < 0) {
    throw new Error(`Dòng ${rowNumber}: ${label} không hợp lệ`);
  }
  return sortOrder;
}

/**
 * @param {Record<string, string>[]} rows
 * @param {{ nameHeader: string, nameField: string, activeLabels: { active: string, inactive: string } }} config
 */
export function mapStaffAttributeCatalogImportRows(rows, config) {
  const payloads = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    try {
      const name = row[config.nameHeader]?.trim();
      if (!name) {
        throw new Error(`Dòng ${rowNumber}: ${config.nameHeader} là bắt buộc`);
      }

      payloads.push({
        rowNumber,
        payload: {
          [config.nameField]: name,
          sortOrder: parseOptionalSortOrder(
            row[config.sortOrderHeader],
            rowNumber,
            config.sortOrderHeader,
          ),
          active: parseActiveStatus(row[config.activeHeader]),
        },
      });
    } catch (err) {
      errors.push(err.message);
    }
  });

  return { payloads, errors };
}

export function mapStaffRankImportRows(rows) {
  return mapStaffAttributeCatalogImportRows(rows, {
    nameHeader: staffRanks.form.name,
    nameField: 'rankName',
    sortOrderHeader: staffRanks.form.sortOrder,
    activeHeader: staffRanks.form.active,
  });
}

export function mapStaffPositionImportRows(rows) {
  return mapStaffAttributeCatalogImportRows(rows, {
    nameHeader: staffPositions.form.name,
    nameField: 'positionName',
    sortOrderHeader: staffPositions.form.sortOrder,
    activeHeader: staffPositions.form.active,
  });
}

/**
 * @param {Record<string, string>[]} rows
 */
export function mapStatusCatalogImportRows(rows) {
  const allowedColors = new Set([
    'green',
    'red',
    'yellow',
    'blue',
    'teal',
    'purple',
    'amber',
    'pink',
    'brown',
    'gray',
    'black',
    'lime',
    'cyan',
    'indigo',
  ]);
  const allowedIcons = new Set([
    'check',
    'x',
    'graduation',
    'briefcase',
    'clock',
    'plane',
    'pending',
    'baby',
    'sick',
    'late',
    'moon',
    'home',
    'coffee',
    'car',
    'hospital',
    'train',
    'sun',
    'star',
    'shield',
    'tools',
  ]);
  const payloads = [];
  const errors = [];
  const f = statusCatalog.form;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    try {
      const code = row[f.code]?.trim();
      const label = row[f.label]?.trim();
      if (!code) {
        throw new Error(`Dòng ${rowNumber}: ${f.code} là bắt buộc`);
      }
      if (!label) {
        throw new Error(`Dòng ${rowNumber}: ${f.label} là bắt buộc`);
      }

      const badgeLabel = row[f.badgeLabel]?.trim() || label.toUpperCase();
      const colorKey = row[f.color]?.trim().toLowerCase();
      const iconKey = row[f.icon]?.trim().toLowerCase();

      if (!colorKey || !allowedColors.has(colorKey)) {
        throw new Error(`Dòng ${rowNumber}: ${f.color} không hợp lệ "${row[f.color]}"`);
      }
      if (!iconKey || !allowedIcons.has(iconKey)) {
        throw new Error(`Dòng ${rowNumber}: ${f.icon} không hợp lệ "${row[f.icon]}"`);
      }

      payloads.push({
        rowNumber,
        payload: {
          code,
          label,
          badgeLabel,
          colorKey,
          iconKey,
          sortOrder:
            parseOptionalSortOrder(row[f.sortOrder], rowNumber, f.sortOrder) ?? 0,
          active: parseActiveStatus(row[f.active]),
          manualAllowed: false,
          groupParent: false,
          parentCode: '',
        },
      });
    } catch (err) {
      errors.push(err.message);
    }
  });

  return { payloads, errors };
}

export { STAFF_EXCEL, DEPARTMENT_EXCEL };
