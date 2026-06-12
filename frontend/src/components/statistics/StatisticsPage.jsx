import { lazy, Suspense, useMemo } from 'react';
import HeadAppShell from '../layout/HeadAppShell';
import MobileHeadBreadcrumb from '../layout/MobileHeadBreadcrumb';
import NotificationBell from '../shared/NotificationBell';
import FlashBanner from '../shared/FlashBanner';
import { UI } from '../../constants/attendance';
import { useStatisticsPage } from '../../hooks/useStatisticsPage';
import StatisticsHeader from './sections/StatisticsHeader';
import StatisticsFilterBar from './sections/StatisticsFilterBar';
import StatisticsKpiCards from './sections/StatisticsKpiCards';
import AttendanceHistoryTable from './sections/AttendanceHistoryTable';

const AttendanceTrendChart = lazy(() => import('./sections/AttendanceTrendChart'));
import StatisticsMobileFilter from './mobile/StatisticsMobileFilter';
import StatisticsMobileKpiCards from './mobile/StatisticsMobileKpiCards';
import AttendanceHistoryCardList from './mobile/AttendanceHistoryCardList';

export default function StatisticsPage({ user, onLogout, activeNav, onNavChange }) {
  const {
    flash,
    clearFlash,
    showSpinner,
    timePreset,
    handlePresetChange,
    handleMobilePresetChange,
    handleMobileDateFromChange,
    handleMobileDateToChange,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    search,
    setSearch,
    handleApplyFilter,
    handleApplySearch,
    stats,
    trend,
    deptName,
    loading,
    historyItems,
    historyPage,
    setHistoryPage,
    historyTotalPages,
    historyTotalItems,
    historyPageSize,
    historyLoading,
    exporting,
    handleExportExcel,
    showHistoryPagination,
  } = useStatisticsPage(user);

  const mobileTopActions = <NotificationBell variant="attendance" />;

  const mobileBreadcrumb = useMemo(
    () => [{ label: UI.breadcrumbSystem }, { label: UI.breadcrumbStatistics }],
    [],
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
        <StatisticsHeader />
      </div>

      <div className="lg:hidden shrink-0 border-b border-line px-[clamp(0.75rem,3vw,1.25rem)] py-2.5">
        <MobileHeadBreadcrumb items={mobileBreadcrumb} />
      </div>

      {flash && <FlashBanner flash={flash} onClose={clearFlash} />}

      <main className="max-lg:space-y-4 px-[clamp(0.75rem,3vw,1.25rem)] py-[clamp(0.75rem,2vw,1rem)] pb-8 lg:flex lg:flex-col lg:gap-[clamp(0.75rem,2vw,1rem)] lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:[&>*]:shrink-0 lg:px-5 lg:py-5">
        <div className="lg:hidden shrink-0 space-y-4">
          <div>
            <StatisticsMobileFilter
              timePreset={timePreset}
              onPresetChange={handleMobilePresetChange}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={handleMobileDateFromChange}
              onDateToChange={handleMobileDateToChange}
              search={search}
              onSearchChange={setSearch}
              onApplySearch={handleApplySearch}
              loading={loading}
            />
          </div>

          {showSpinner ? (
            <div className="text-center py-20 text-content-muted animate-pulse">{UI.loading}</div>
          ) : (
            <>
              <StatisticsMobileKpiCards stats={stats} />
              <AttendanceHistoryCardList
                items={historyItems}
                totalItems={historyTotalItems}
                deptName={deptName}
                loading={historyLoading}
                page={historyPage}
                totalPages={historyTotalPages}
                onPageChange={setHistoryPage}
              />
            </>
          )}
        </div>

        <div className="hidden lg:block">
          <StatisticsFilterBar
            timePreset={timePreset}
            onTimePresetChange={handlePresetChange}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            deptName={deptName}
            search={search}
            onSearchChange={setSearch}
            onApply={handleApplyFilter}
            loading={loading}
          />
        </div>

        {showSpinner ? (
          <div className="hidden lg:block text-center py-20 text-content-muted animate-pulse">{UI.loading}</div>
        ) : (
          <div className="hidden lg:contents">
            <StatisticsKpiCards stats={stats} />
            <Suspense
              fallback={
                <div
                  className="hidden lg:block h-64 rounded-xl border border-line bg-surface-white animate-pulse"
                  aria-hidden="true"
                />
              }
            >
              <AttendanceTrendChart trend={trend} />
            </Suspense>
            <AttendanceHistoryTable
              items={historyItems}
              page={historyPage}
              totalPages={historyTotalPages}
              totalItems={historyTotalItems}
              pageSize={historyPageSize}
              onPageChange={setHistoryPage}
              loading={historyLoading}
              exporting={exporting}
              onExport={handleExportExcel}
              showPagination={showHistoryPagination}
            />
          </div>
        )}
      </main>
    </HeadAppShell>
  );
}
