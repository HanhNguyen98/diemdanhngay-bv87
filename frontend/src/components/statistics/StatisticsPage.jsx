import { useMemo } from 'react';
import HeadAppShell from '../layout/HeadAppShell';
import MobileHeadBreadcrumb from '../layout/MobileHeadBreadcrumb';
import NotificationBell from '../shared/NotificationBell';
import FlashBanner from '../shared/FlashBanner';
import StableDataZone from '../shared/StableDataZone';
import { UI } from '../../constants/attendance';
import {
  HEAD_MOBILE_BREADCRUMB_CLASS,
  HEAD_SCROLL_MAIN_CLASS,
  buildHeadBreadcrumb,
} from '../../constants/headLayout';
import { useStatisticsPage } from '../../hooks/useStatisticsPage';
import StatisticsHeader from './sections/StatisticsHeader';
import StatisticsFilterBar from './sections/StatisticsFilterBar';
import StatisticsKpiCards from './sections/StatisticsKpiCards';
import AttendanceTrendChart from './sections/AttendanceTrendChart';
import AttendanceHistoryTable from './sections/AttendanceHistoryTable';
import StatisticsMobileFilter from './mobile/StatisticsMobileFilter';
import StatisticsMobileKpiCards from './mobile/StatisticsMobileKpiCards';
import AttendanceHistoryCardList from './mobile/AttendanceHistoryCardList';

const KPI_SKELETON_MOBILE = (
  <div
    className="min-h-[4.5rem] rounded-xl border border-line bg-surface-white animate-pulse"
    aria-hidden="true"
  />
);

const KPI_SKELETON_DESKTOP = (
  <div
    className="hidden lg:block min-h-[9.5rem] rounded-xl border border-line bg-surface-white animate-pulse"
    aria-hidden="true"
  />
);

export default function StatisticsPage({ user, onLogout, activeNav, onNavChange }) {
  const {
    flash,
    clearFlash,
    showSpinner,
    statsInitialLoading,
    statsReady,
    timePreset,
    handlePresetChange,
    handleMobilePresetChange,
    handleMobileDateRangeChange,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    search,
    setSearch,
    handleApplyFilter,
    handleApplySearch,
    resetFilters,
    displayStatusBreakdown,
    displayTrend,
    displayDeptName,
    historyItems,
    historyPage,
    setHistoryPage,
    historyTotalPages,
    historyTotalItems,
    historyPageSize,
    historyInitialLoading,
    historyRefreshing,
    exporting,
    handleExportExcel,
    showHistoryPagination,
  } = useStatisticsPage(user);

  const mobileTopActions = <NotificationBell variant="attendance" />;
  const resolvedDeptName = displayDeptName || user.deptName || '';

  const mobileBreadcrumb = useMemo(
    () => buildHeadBreadcrumb(UI.breadcrumbStatistics, resolvedDeptName),
    [resolvedDeptName],
  );

  return (
    <HeadAppShell
      user={user}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      mobileTopActions={mobileTopActions}
    >
      <div className="hidden lg:block shrink-0">
        <StatisticsHeader deptName={resolvedDeptName} />
      </div>

      <div className={HEAD_MOBILE_BREADCRUMB_CLASS}>
        <MobileHeadBreadcrumb items={mobileBreadcrumb} />
      </div>

      {flash && <FlashBanner flash={flash} onClose={clearFlash} />}

      <main className={HEAD_SCROLL_MAIN_CLASS}>
        <div className="lg:hidden shrink-0 space-y-4">
          <StatisticsMobileFilter
            timePreset={timePreset}
            onPresetChange={handleMobilePresetChange}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onRangeChange={handleMobileDateRangeChange}
            search={search}
            onSearchChange={setSearch}
            onApplySearch={handleApplySearch}
            onResetSearch={resetFilters}
            loading={statsInitialLoading}
          />

          <StableDataZone
            initialLoading={showSpinner}
            skeleton={KPI_SKELETON_MOBILE}
            className="shrink-0"
          >
            <StatisticsMobileKpiCards statusBreakdown={displayStatusBreakdown} />
          </StableDataZone>

          {statsReady && (
            <>
              <div className="shrink-0">
                <AttendanceTrendChart trend={displayTrend} />
              </div>
              <AttendanceHistoryCardList
                items={historyItems}
                totalItems={historyTotalItems}
                deptName={resolvedDeptName}
                initialLoading={historyInitialLoading}
                refreshing={historyRefreshing}
                page={historyPage}
                totalPages={historyTotalPages}
                onPageChange={setHistoryPage}
                exporting={exporting}
                onExport={handleExportExcel}
              />
            </>
          )}
        </div>

        <div className="hidden lg:contents">
          <StableDataZone
            initialLoading={showSpinner}
            skeleton={KPI_SKELETON_DESKTOP}
            className="shrink-0 min-h-[9.5rem]"
          >
            <StatisticsKpiCards statusBreakdown={displayStatusBreakdown} />
          </StableDataZone>

          <StatisticsFilterBar
            timePreset={timePreset}
            onTimePresetChange={handlePresetChange}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            search={search}
            onSearchChange={setSearch}
            onApply={handleApplyFilter}
            onReset={resetFilters}
            loading={statsInitialLoading}
          />

          {statsReady && (
            <>
              <div className="shrink-0">
                <AttendanceTrendChart trend={displayTrend} />
              </div>

              <AttendanceHistoryTable
                items={historyItems}
                page={historyPage}
                totalPages={historyTotalPages}
                totalItems={historyTotalItems}
                pageSize={historyPageSize}
                onPageChange={setHistoryPage}
                initialLoading={historyInitialLoading}
                refreshing={historyRefreshing}
                exporting={exporting}
                onExport={handleExportExcel}
                showPagination={showHistoryPagination}
              />
            </>
          )}
        </div>
      </main>
    </HeadAppShell>
  );
}
