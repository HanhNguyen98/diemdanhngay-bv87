import * as XLSX from 'xlsx-js-style';

const TEMPLATE_HEADER_STYLE = {
  font: { name: 'Times New Roman', bold: true, sz: 11, color: { rgb: '1F2937' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'DCE6F1' } },
  alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
};

const TEMPLATE_BODY_STYLE = {
  font: { name: 'Times New Roman', sz: 11 },
  alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
};

function calcColumnWidths(headers, rows) {
  return headers.map((header, colIndex) => {
    const lengths = [
      String(header).length,
      ...rows.map((row) => String(row[colIndex] ?? '').length),
    ];
    const maxLen = Math.max(...lengths, 10);
    return { wch: Math.min(maxLen + 3, 60) };
  });
}

function applyTemplateSheetStyles(ws, headers, rows) {
  const totalRows = rows.length + 1;
  const totalCols = headers.length;

  ws['!cols'] = calcColumnWidths(headers, rows);

  for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
    for (let colIndex = 0; colIndex < totalCols; colIndex += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      if (!ws[cellRef]) {
        ws[cellRef] = { t: 's', v: '' };
      }
      ws[cellRef].s = rowIndex === 0 ? TEMPLATE_HEADER_STYLE : TEMPLATE_BODY_STYLE;
    }
  }
}

function writeWorkbook(filename, sheetName, headers, rows, styled = false) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  if (styled) {
    applyTemplateSheetStyles(ws, headers, rows);
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/**
 * @param {{ filename: string, sheetName?: string, headers: string[], rows: unknown[][] }} options
 */
export function downloadExcel({ filename, sheetName = 'Sheet1', headers, rows }) {
  writeWorkbook(filename, sheetName, headers, rows, false);
}

/**
 * @param {{ filename: string, sheetName?: string, headers: string[], sampleRow?: unknown[] }} options
 */
export function downloadExcelTemplate({ filename, sheetName = 'Sheet1', headers, sampleRow }) {
  const rows = sampleRow ? [sampleRow] : [];
  writeWorkbook(filename, sheetName, headers, rows, true);
}

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

/**
 * @param {File} file
 * @param {string[]} expectedHeaders
 * @returns {Promise<Record<string, string>[]>}
 */
export async function readExcelRows(file, expectedHeaders) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('EMPTY_FILE');
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!matrix.length) {
    throw new Error('EMPTY_FILE');
  }

  const fileHeaders = matrix[0].map((cell) => String(cell ?? '').trim());
  const normalizedExpected = expectedHeaders.map(normalizeHeader);
  const normalizedFile = fileHeaders.map(normalizeHeader);

  const headersMatch =
    normalizedFile.length === normalizedExpected.length &&
    normalizedExpected.every((header, index) => header === normalizedFile[index]);

  if (!headersMatch) {
    throw new Error('INVALID_TEMPLATE');
  }

  const dataRows = matrix.slice(1).filter((row) =>
    row.some((cell) => String(cell ?? '').trim() !== ''),
  );

  return dataRows.map((row) => {
    const record = {};
    expectedHeaders.forEach((header, index) => {
      record[header] = String(row[index] ?? '').trim();
    });
    return record;
  });
}
