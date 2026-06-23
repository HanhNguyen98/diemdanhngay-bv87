import { useCallback, useState } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { downloadExcel, downloadExcelTemplate, readExcelRows } from '../utils/exportExcel';

/**
 * @param {{
 *   excelConfig: object,
 *   buildExportSheet: () => { headers: string[], rows: unknown[][] },
 *   mapImportRows: (rows: Record<string, string>[]) => { payloads: { rowNumber: number, payload: object }[], errors: string[] },
 *   createRecord: (payload: object) => Promise<unknown>,
 *   showSuccess: (message: string) => void,
 *   showWarning: (message: string) => void,
 *   showError: (message: string) => void,
 * }} options
 */
export function useExcelRegistryActions({
  excelConfig,
  buildExportSheet,
  mapImportRows,
  createRecord,
  showSuccess,
  showWarning,
  showError,
}) {
  const [importing, setImporting] = useState(false);
  const { excel } = ADMIN_UI;

  const handleTemplateDownload = useCallback(() => {
    downloadExcelTemplate({
      filename: excelConfig.templateFilename,
      sheetName: excelConfig.sheetName,
      headers: excelConfig.templateHeaders,
      sampleRow: excelConfig.templateSampleRow,
    });
  }, [excelConfig]);

  const handleExport = useCallback(async () => {
    const { headers, rows } = await Promise.resolve(buildExportSheet());
    downloadExcel({
      filename: excelConfig.exportFilename,
      sheetName: excelConfig.sheetName,
      headers,
      rows,
    });
  }, [buildExportSheet, excelConfig]);

  const handleImportFile = useCallback(
    async (file) => {
      setImporting(true);
      try {
        const rows = await readExcelRows(file, excelConfig.templateHeaders);
        if (!rows.length) {
          showWarning(excel.importEmpty);
          return;
        }

        const mapped = await Promise.resolve(mapImportRows(rows));
        const { payloads, errors: parseErrors } = mapped;
        if (!payloads.length) {
          showError(parseErrors[0] || excel.importFail);
          return;
        }

        const createErrors = [];
        let successCount = 0;

        for (const { rowNumber, payload } of payloads) {
          try {
            await createRecord(payload);
            successCount += 1;
          } catch (err) {
            createErrors.push(`Dòng ${rowNumber}: ${err.message}`);
          }
        }

        const allErrors = [...parseErrors, ...createErrors];
        if (successCount > 0 && allErrors.length === 0) {
          showSuccess(excel.importSuccess(successCount));
        } else if (successCount > 0) {
          const errorDetail =
            allErrors.length > 0 && allErrors.length <= 2 ? ` ${allErrors.join(' ')}` : '';
          showWarning(`${excel.importPartial(successCount, allErrors.length)}${errorDetail}`);
        } else {
          showError(allErrors[0] || excel.importFail);
        }
      } catch (err) {
        if (err.message === 'INVALID_TEMPLATE') {
          showError(excel.importInvalidFile);
        } else if (err.message === 'EMPTY_FILE') {
          showWarning(excel.importEmpty);
        } else {
          showError(err.message || excel.importFail);
        }
      } finally {
        setImporting(false);
      }
    },
    [createRecord, excel, excelConfig.templateHeaders, mapImportRows, showError, showSuccess, showWarning],
  );

  return {
    importing,
    handleTemplateDownload,
    handleExport,
    handleImportFile,
  };
}
