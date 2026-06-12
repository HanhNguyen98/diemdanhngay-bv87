import { useCallback, useEffect, useMemo, useState } from 'react';
import { ADMIN_UI } from '../constants/admin';
import { ATTENDANCE_PAGE_SIZE, STATUS_OPTIONS } from '../constants/attendance';
import { api } from '../api/client';
import { adminApi } from '../services/api';
import { downloadExcel } from '../utils/exportExcel';
import { todayISO } from '../utils/formatters';
import { usePagination } from './usePagination';

const PAGE_SIZE = ATTENDANCE_PAGE_SIZE;

function statusLabel(status) {
  if (!status) return 'Chưa chấm';
  return STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
}

export function useDeptAttendanceDetail() {
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);

  const [draftDeptCode, setDraftDeptCode] = useState(null);
  const [draftDate, setDraftDate] = useState(todayISO());
  const [appliedDeptCode, setAppliedDeptCode] = useState(null);
  const [appliedDate, setAppliedDate] = useState(todayISO());

  const [summary, setSummary] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDeptLoading(true);
      try {
        const depts = await adminApi.listDepartments();
        if (cancelled) return;
        setDepartments(depts);
        if (depts.length > 0) {
          const firstCode = depts[0].deptCode;
          setDraftDeptCode(firstCode);
          setAppliedDeptCode(firstCode);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setDeptLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadData = useCallback(async (deptCode, date) => {
    if (deptCode == null) return;
    setLoading(true);
    setError('');
    try {
      const pageData = await api.getAttendancePage(deptCode, date);
      setSummary(pageData.summary);
      setStaff(pageData.staff || []);
    } catch (err) {
      setSummary(null);
      setStaff([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (appliedDeptCode != null) {
      loadData(appliedDeptCode, appliedDate);
    }
  }, [appliedDeptCode, appliedDate, loadData]);

  const applyFilter = useCallback(() => {
    if (draftDeptCode == null) return;
    setAppliedDeptCode(draftDeptCode);
    setAppliedDate(draftDate);
  }, [draftDeptCode, draftDate]);

  const kpi = useMemo(() => {
    if (!summary) return null;
    return {
      total: summary.total,
      diLam: summary.diLam,
      nghiPhep: summary.nghiPhep,
      diHoc: summary.diHoc,
      diCongTac: summary.diCongTac,
    };
  }, [summary]);

  const selectedDept = useMemo(
    () => departments.find((d) => d.deptCode === appliedDeptCode),
    [departments, appliedDeptCode],
  );

  const { page, totalPages, paginated, pageSize, goToPage } = usePagination(staff, PAGE_SIZE);

  useEffect(() => {
    goToPage(1);
  }, [staff, goToPage]);

  const handleExport = useCallback(async () => {
    if (!staff.length || !selectedDept) return;
    setExporting(true);
    try {
      const { dashboard: d } = ADMIN_UI;
      const headers = ['Họ và tên', 'Mã nhân viên', 'Cấp bậc', 'Chức vụ', 'Trạng thái', 'Ghi chú'];
      const rows = staff.map((s) => [
        s.fullname,
        s.empCodeFormatted,
        s.rankName || '',
        s.positionName || '',
        statusLabel(s.status),
        s.note || '',
      ]);
      downloadExcel({
        filename: d.deptDetailExportFilename,
        sheetName: d.deptDetailExportSheet,
        headers,
        rows,
      });
    } finally {
      setExporting(false);
    }
  }, [staff, selectedDept, appliedDate]);

  return {
    departments,
    deptLoading,
    draftDeptCode,
    setDraftDeptCode,
    draftDate,
    setDraftDate,
    applyFilter,
    summary,
    kpi,
    staff,
    paginated,
    loading: deptLoading || loading,
    error,
    page,
    totalPages,
    pageSize,
    goToPage,
    filteredCount: staff.length,
    selectedDept,
    exporting,
    handleExport,
  };
}
