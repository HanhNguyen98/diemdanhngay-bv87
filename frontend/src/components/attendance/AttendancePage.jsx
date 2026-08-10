import { useEffect, useState } from 'react';
import UnlockModal from '../UnlockModal';
import HeadAppShell from '../layout/HeadAppShell';
import ManualStatusRangeModal from './ManualStatusRangeModal';
import NotificationBell from '../shared/NotificationBell';
import FlashBanner from '../shared/FlashBanner';
import { HEAD_NAV_IDS, UI } from '../../constants/attendance';
import { useAttendancePage } from '../../hooks/useAttendancePage';
import AttendanceHeader from './sections/AttendanceHeader';
import AttendanceMobileSubheader from './sections/AttendanceMobileSubheader';
import StableDataZone from '../shared/StableDataZone';
import KpiBar from './sections/KpiBar';
import HistoryViewBanner from './sections/HistoryViewBanner';
import LockBanner from './sections/LockBanner';
import StaffTableCard from './sections/StaffTableCard';
import ScanLogModal from './ScanLogModal';
import ManualScheduleModal from './ManualScheduleModal';
import MissingPunchBanner from './MissingPunchBanner';
import { HEAD_ATTENDANCE_MAIN_CLASS } from '../../constants/headLayout';
import DatePillBar from '../dashboard/DatePillBar';
import MobileHorizontalScroll from '../shared/MobileHorizontalScroll';
import { useHeadAiSession } from '../../context/HeadAiSessionContext';

export default function AttendancePage({
  user,
  onLogout,
  activeNav = HEAD_NAV_IDS.HOME,
  onNavChange = () => {},
}) {
  const {
    isAdmin,
    flash,
    clearFlash,
    showSpinner,
    refreshing,
    selectedDept,
    setSelectedDept,
    departments,
    selectedDeptName,
    selectedDate,
    recentDates,
    isToday,
    handleDateChange,
    locked,
    unlocked,
    tableDisabled,
    unlockTarget,
    setUnlockTarget,
    handleUnlockConfirm,
    statusBreakdown,
    total,
    reportBlocked,
    missingPunches,
    missingLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    pagedStaff,
    page,
    setPage,
    totalPages,
    filteredCount,
    pageSize,
    handleQuickAction,
    manualRangeTarget,
    setManualRangeTarget,
    manualRangeSaving,
    handleManualRangeConfirm,
    refreshAttendance,
  } = useAttendancePage(user);

  const { registerAttendanceSession } = useHeadAiSession();
  const [scanLogStaff, setScanLogStaff] = useState(null);
  const [manualScheduleStaff, setManualScheduleStaff] = useState(null);

  useEffect(() => {
    return registerAttendanceSession({
      selectedDate,
      tableDisabled,
      onBatchComplete: refreshAttendance,
    });
  }, [registerAttendanceSession, selectedDate, tableDisabled, refreshAttendance]);

  const markedCount = statusBreakdown?.reduce((sum, s) => sum + (s.count || 0), 0) ?? 0;

  const mobileTopActions = (
    <NotificationBell onAttendanceNavigate={handleDateChange} variant="attendance" />
  );

  return (
    <HeadAppShell
      user={user}
      activeNav={activeNav}
      onNavChange={onNavChange}
      onLogout={onLogout}
      mobileTopActions={mobileTopActions}
    >
      <AttendanceMobileSubheader deptName={selectedDeptName} />

      <div className="hidden lg:block shrink-0">
        <AttendanceHeader
          deptName={selectedDeptName}
          selectedDate={selectedDate}
          recentDates={recentDates}
          onDateChange={handleDateChange}
          locked={locked}
          unlocked={unlocked}
          isAdmin={isAdmin}
          onUnlock={
            isToday && locked && !unlocked
              ? () => setUnlockTarget({ deptCode: selectedDept, deptName: selectedDeptName })
              : null
          }
          onNotificationDate={handleDateChange}
          departments={departments}
          selectedDept={selectedDept}
          onDeptChange={setSelectedDept}
        />
      </div>

      {flash && <FlashBanner flash={flash} onClose={clearFlash} />}

      <main className={HEAD_ATTENDANCE_MAIN_CLASS}>
        {showSpinner ? (
          <div className="text-center py-20 text-content-muted animate-pulse">{UI.loading}</div>
        ) : (
          <>
            <div className="lg:hidden shrink-0 min-w-0 max-w-full">
              <MobileHorizontalScroll innerClassName="items-center justify-start gap-2 min-w-max py-0.5">
                <DatePillBar
                  variant="attendance"
                  compact
                  selectedDate={selectedDate}
                  recentDates={recentDates}
                  onDateChange={handleDateChange}
                />
              </MobileHorizontalScroll>
            </div>

            <div className="shrink-0 space-y-2.5 max-lg:space-y-4 lg:contents">
              {!isToday && <HistoryViewBanner selectedDate={selectedDate} />}
              {isToday && reportBlocked && !isAdmin && (
                <LockBanner lockMessage={UI.reportBlocked} />
              )}
              <MissingPunchBanner items={missingPunches} loading={missingLoading} />
              <StableDataZone refreshing={refreshing} className="shrink-0">
                <KpiBar markedCount={markedCount} total={total} statusBreakdown={statusBreakdown} />
              </StableDataZone>
            </div>

            <StaffTableCard
              className="lg:flex-1 lg:min-h-0"
              staffList={pagedStaff}
              mobileStaffList={pagedStaff}
              disabled={tableDisabled}
              onQuickAction={handleQuickAction}
              onOpenScanLogs={setScanLogStaff}
              onOpenManualSchedule={setManualScheduleStaff}
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              page={page}
              totalPages={totalPages}
              filteredCount={filteredCount}
              pageSize={pageSize}
              onPageChange={setPage}
              showMobileFilterReset
              refreshing={refreshing}
            />
          </>
        )}
      </main>

      {scanLogStaff && (
        <ScanLogModal
          staff={scanLogStaff}
          date={selectedDate}
          onClose={() => setScanLogStaff(null)}
        />
      )}

      {manualScheduleStaff && (
        <ManualScheduleModal
          staff={manualScheduleStaff}
          onClose={() => setManualScheduleStaff(null)}
        />
      )}

      {unlockTarget && (
        <UnlockModal
          deptCode={unlockTarget.deptCode}
          deptName={unlockTarget.deptName}
          onConfirm={handleUnlockConfirm}
          onClose={() => setUnlockTarget(null)}
        />
      )}

      {manualRangeTarget && (
        <ManualStatusRangeModal
          staff={manualRangeTarget.staff}
          status={manualRangeTarget.status}
          statusLabel={manualRangeTarget.statusLabel}
          defaultDate={selectedDate}
          loading={manualRangeSaving}
          onConfirm={handleManualRangeConfirm}
          onClose={() => !manualRangeSaving && setManualRangeTarget(null)}
        />
      )}
    </HeadAppShell>
  );
}
