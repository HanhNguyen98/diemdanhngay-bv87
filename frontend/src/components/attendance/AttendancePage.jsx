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
import KpiBar from './sections/KpiBar';
import HistoryViewBanner from './sections/HistoryViewBanner';
import LockBanner from './sections/LockBanner';
import StaffTableCard from './sections/StaffTableCard';
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
    stats,
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
    showFilter,
    setShowFilter,
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
      <AttendanceMobileSubheader
        deptName={selectedDeptName}
        selectedDate={selectedDate}
        recentDates={recentDates}
        onDateChange={handleDateChange}
      />

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

      <main className="max-lg:space-y-[clamp(0.75rem,2vw,1rem)] px-[clamp(0.75rem,3vw,1.25rem)] py-[clamp(0.75rem,2vw,1rem)] max-lg:pb-8 lg:flex lg:flex-col lg:gap-[clamp(0.75rem,2vw,1rem)] lg:flex-1 lg:min-h-0 lg:overflow-hidden lg:px-5 lg:py-5">
        {showSpinner ? (
          <div className="text-center py-20 text-content-muted animate-pulse">{UI.loading}</div>
        ) : (
          <>
            <div className="shrink-0 space-y-2.5">
              {!isToday && <HistoryViewBanner selectedDate={selectedDate} />}
              {isToday && locked && !isAdmin && <LockBanner lockMessage={lockMessage} />}
              <KpiBar markedCount={markedCount} total={total} stats={stats} />

              <button
                type="button"
                onClick={handleSendReport}
                disabled={tableDisabled || reportSent || reportBlocked}
                title={reportBlocked ? UI.reportBlocked : undefined}
                className="lg:hidden w-full inline-flex items-center justify-center gap-2 rounded-xl bg-success-fg hover:opacity-90 text-white text-sm font-semibold py-3 px-4 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
              showFilter={showFilter}
              onToggleFilter={() => setShowFilter((v) => !v)}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              page={page}
              totalPages={totalPages}
              filteredCount={filteredCount}
              pageSize={pageSize}
              onPageChange={setPage}
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
