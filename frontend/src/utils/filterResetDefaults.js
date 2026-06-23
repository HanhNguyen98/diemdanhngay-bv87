import { ATTENDANCE_FILTER } from '../constants/attendance';
import { ACCOUNT_ROLE_FILTER, ACCOUNT_STATUS_FILTER } from '../constants/adminFilters';
import { getStatisticsDateRange, todayISO } from './formatters';
import { defaultReminderHistoryRange } from './reminderHistory';

/**
 * Shared reset values for registry filter bars.
 * Rules: text → empty; single date → today; dropdown → "all"
 * unless a screen documents a different initial default below.
 */

export function getStaffRegistryFilterDefaults() {
  return {
    search: '',
    deptCode: null,
  };
}

export function getDepartmentRegistryFilterDefaults() {
  return {
    search: '',
    groupCode: '',
  };
}

export function getAccountFilterDefaults() {
  return {
    search: '',
    role: ACCOUNT_ROLE_FILTER.ALL,
    status: ACCOUNT_STATUS_FILTER.ALL,
  };
}

export function getAttendanceStaffFilterDefaults() {
  return {
    search: '',
    statusFilter: ATTENDANCE_FILTER.ALL,
  };
}

/** Admin dashboard overview — dept filter resets to all departments. */
export function getDashboardDeptFilterDefaults() {
  return { dept: null };
}

/** Admin dept attendance detail — single date picker resets to today. */
export function getDeptAttendanceDetailFilterDefaults(refDate = todayISO()) {
  return {
    deptCode: null,
    date: refDate,
  };
}

/**
 * Reminder history — range default is start of month → today (not a single date).
 */
export function getReminderHistoryFilterDefaults(refDate = todayISO()) {
  const range = defaultReminderHistoryRange(refDate);
  return {
    deptCode: null,
    dateFrom: range.from,
    dateTo: range.to,
  };
}

/**
 * HEAD statistics — preset THIS_MONTH with its computed range (not today-only).
 */
export function getStatisticsFilterDefaults(refDate = todayISO()) {
  const range = getStatisticsDateRange('THIS_MONTH', refDate);
  return {
    timePreset: 'THIS_MONTH',
    dateFrom: range.from,
    dateTo: range.to,
    search: '',
  };
}

/** Catalog/registry screens with text search only. */
export function getTextSearchFilterDefaults() {
  return { search: '' };
}
