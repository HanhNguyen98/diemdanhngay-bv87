import UnlockModal from '../UnlockModal';
import HeadAppShell from '../layout/HeadAppShell';
import SendReportModal from './SendReportModal';
import NotificationBell from '../shared/NotificationBell';
import FlashBanner from '../shared/FlashBanner';
import { HEAD_NAV_IDS, MOBILE_UI, UI } from '../../constants/attendance';
import { useAttendancePage } from '../../hooks/useAttendancePage';
import { IconSend } from '../icons/Icons';
import AttendanceHeader from './sections/AttendanceHeader';
import AttendanceMobileSubheader from './sections/AttendanceMobileSubheader';
import StableDataZone from '../shared/StableDataZone';
import KpiBar from './sections/KpiBar';
import HistoryViewBanner from './sections/HistoryViewBanner';
import LockBanner from './sections/LockBanner';
import StaffTableCard from './sections/StaffTableCard';
import { HEAD_ATTENDANCE_MAIN_CLASS } from '../../constants/headLayout';
import DatePillBar from '../dashboard/DatePillBar';
import MobileHorizontalScroll from '../shared/MobileHorizontalScroll';
import { HeadAiAssistantProvider } from '../../context/HeadAiAssistantContext';
import HeadFlowPanel from '../ai/head/HeadFlowPanel';

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
    lockMessage,
    unlocked,
    tableDisabled,
    unlockTarget,
    setUnlockTarget,
    handleUnlockConfirm,
    markedCount,
    statusBreakdown,
    total,
    reportSent,
    reportBlocked,
    reportModalOpen,
    setReportModalOpen,
    reportSending,
    handleSendReport,
    handleSendReportConfirm,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredStaff,
    pagedStaff,
    page,
    setPage,
    totalPages,
    filteredCount,
    pageSize,
    handleQuickAction,
    refreshAttendance,
  } = useAttendancePage(user);

  const isHead = user.role === 'HEAD';

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
          reportSent={reportSent}
          reportBlocked={reportBlocked}
          tableDisabled={tableDisabled}
          onSendReport={handleSendReport}
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
              {isToday && locked && !isAdmin && <LockBanner lockMessage={lockMessage} />}
              <StableDataZone refreshing={refreshing} className="shrink-0">
                <KpiBar markedCount={markedCount} total={total} statusBreakdown={statusBreakdown} />
              </StableDataZone>

              <button
                type="button"
                onClick={handleSendReport}
                disabled={tableDisabled || reportSent || reportBlocked}
                title={reportBlocked ? UI.reportBlocked : undefined}
                className="lg:hidden w-full inline-flex items-center justify-center gap-2 rounded-xl bg-attendance-report hover:bg-attendance-report-hover text-white text-sm font-semibold py-3 px-4 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <IconSend className="w-4 h-4 shrink-0" />
                {reportSent ? UI.reportSent : MOBILE_UI.sendReportFull}
              </button>
            </div>

            <StaffTableCard
              className="lg:flex-1 lg:min-h-0"
              staffList={pagedStaff}
              mobileStaffList={pagedStaff}
              disabled={tableDisabled}
              onQuickAction={handleQuickAction}
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

      {unlockTarget && (
        <UnlockModal
          deptCode={unlockTarget.deptCode}
          deptName={unlockTarget.deptName}
          onConfirm={handleUnlockConfirm}
          onClose={() => setUnlockTarget(null)}
        />
      )}

      {reportModalOpen && (
        <SendReportModal
          onConfirm={handleSendReportConfirm}
          onClose={() => setReportModalOpen(false)}
          loading={reportSending}
        />
      )}

      {isHead && (
        <HeadAiAssistantProvider
          selectedDate={selectedDate}
          tableDisabled={tableDisabled}
          onBatchComplete={refreshAttendance}
        >
          <HeadFlowPanel />
        </HeadAiAssistantProvider>
      )}
    </HeadAppShell>
  );
}
