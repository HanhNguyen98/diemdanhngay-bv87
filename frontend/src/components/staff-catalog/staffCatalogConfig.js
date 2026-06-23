import { ADMIN_UI } from '../../constants/admin';
import {
  STAFF_RANK_EXCEL,
  STAFF_POSITION_EXCEL,
  buildStaffRankExportSheet,
  buildStaffPositionExportSheet,
} from '../../constants/excelRegistry';
import { mapStaffRankImportRows, mapStaffPositionImportRows } from '../../utils/excelImport';
import { useStaffRankCatalog, useStaffPositionCatalog } from '../../hooks/useStaffRankCatalog';

export const STAFF_RANK_CATALOG_CONFIG = {
  type: 'rank',
  breadcrumbKey: 'staffRanks',
  ui: () => ADMIN_UI.staffRanks,
  useCatalog: useStaffRankCatalog,
  nameField: 'rankName',
  codeField: 'rankCode',
  codeFormattedField: 'rankCodeFormatted',
  getNextCode: (api) => api.getNextStaffRankCode(),
  excelConfig: STAFF_RANK_EXCEL,
  buildExportSheet: buildStaffRankExportSheet,
  mapImportRows: mapStaffRankImportRows,
  flash: {
    create: ADMIN_UI.flash.rankCreateSuccess,
    update: ADMIN_UI.flash.rankUpdateSuccess,
    delete: ADMIN_UI.flash.rankDeleteSuccess,
    deleteFail: ADMIN_UI.flash.rankDeleteFail,
  },
};

export const STAFF_POSITION_CATALOG_CONFIG = {
  type: 'position',
  breadcrumbKey: 'staffPositions',
  ui: () => ADMIN_UI.staffPositions,
  useCatalog: useStaffPositionCatalog,
  nameField: 'positionName',
  codeField: 'positionCode',
  codeFormattedField: 'positionCodeFormatted',
  getNextCode: (api) => api.getNextStaffPositionCode(),
  excelConfig: STAFF_POSITION_EXCEL,
  buildExportSheet: buildStaffPositionExportSheet,
  mapImportRows: mapStaffPositionImportRows,
  flash: {
    create: ADMIN_UI.flash.positionCreateSuccess,
    update: ADMIN_UI.flash.positionUpdateSuccess,
    delete: ADMIN_UI.flash.positionDeleteSuccess,
    deleteFail: ADMIN_UI.flash.positionDeleteFail,
  },
};
