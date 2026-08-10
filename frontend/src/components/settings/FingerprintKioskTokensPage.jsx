import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import AdminSubmenuBreadcrumb from '../admin/sections/AdminSubmenuBreadcrumb';
import RegistryTableEmptyRow from '../admin/sections/RegistryTableEmptyRow';
import RegistryTableShell from '../admin/sections/RegistryTableShell';
import TablePagination from '../admin/sections/TablePagination';
import DeleteModal from '../shared/DeleteModal';
import FlashBanner from '../shared/FlashBanner';
import FormModal from '../shared/FormModal';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import KioskTokenStatGrid from './KioskTokenStatGrid';
import { ADMIN_UI } from '../../constants/admin';
import { adminApi } from '../../services/api';
import { useResponsivePageSize } from '../../hooks/useResponsivePageSize';

const t = ADMIN_UI.fingerprintTokens;
const COL_SPAN = 8;

const labelClass = 'block text-xs font-bold text-content-muted uppercase tracking-wide mb-1.5';
const inputClass =
  'w-full h-9 border border-gray-200 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white';

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour12: false });
  } catch {
    return '—';
  }
}

/**
 * Admin Settings — manage kiosk tokens + enroll PIN (SPEC_FINGERPRINT §10.1 / P2.1e).
 */
export default function FingerprintKioskTokensPage() {
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = useResponsivePageSize();

  const [showIssue, setShowIssue] = useState(false);
  const [issueDept, setIssueDept] = useState('');
  const [issueLabel, setIssueLabel] = useState('');
  const [issueError, setIssueError] = useState('');
  const [issuing, setIssuing] = useState(false);

  const [issuedToken, setIssuedToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const [rotateRow, setRotateRow] = useState(null);
  const [revokeRow, setRevokeRow] = useState(null);
  const [pinRow, setPinRow] = useState(null);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tokens, depts] = await Promise.all([
        adminApi.listKioskTokens(),
        adminApi.listDepartments(),
      ]);
      setRows(Array.isArray(tokens) ? tokens : []);
      setDepartments(Array.isArray(depts) ? depts : []);
    } catch (e) {
      setError(e?.message || t.loadError);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // SPEC §9.5.2 — refresh Online/Offline while page is open
  useEffect(() => {
    const id = window.setInterval(() => {
      load();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, rows.length]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.active).length;
    const online = rows.filter((r) => r.active && r.agentOnline).length;
    return { total, active, revoked: total - active, online };
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  const openIssue = () => {
    setIssueDept('');
    setIssueLabel('');
    setIssueError('');
    setShowIssue(true);
  };

  const openSetPin = (row) => {
    setPinRow(row);
    setPinValue(row.enrollPin || '');
    setPinError('');
  };

  const submitIssue = async (e) => {
    e.preventDefault();
    if (!issueDept) {
      setIssueError(t.deptRequired);
      return;
    }
    setIssuing(true);
    setIssueError('');
    try {
      const res = await adminApi.createKioskToken({
        deptCode: Number(issueDept),
        label: issueLabel.trim() || undefined,
      });
      setShowIssue(false);
      setIssuedToken(res?.token || '');
      setCopied(false);
      setFlash(t.issuedTitle);
      await load();
    } catch (err) {
      setIssueError(err?.message || t.loadError);
    } finally {
      setIssuing(false);
    }
  };

  const submitPin = async (e) => {
    e.preventDefault();
    if (!pinRow) return;
    const pin = pinValue.trim();
    if (!/^\d{4,8}$/.test(pin)) {
      setPinError(t.setPinRequired);
      return;
    }
    setSavingPin(true);
    setPinError('');
    try {
      await adminApi.setKioskEnrollPin(pinRow.id, { enrollPin: pin });
      setPinRow(null);
      setFlash(t.setPinSuccess);
      await load();
    } catch (err) {
      setPinError(err?.message || t.loadError);
    } finally {
      setSavingPin(false);
    }
  };

  const confirmRevoke = async () => {
    if (!revokeRow) return;
    setBusyId(revokeRow.id);
    try {
      await adminApi.revokeKioskToken(revokeRow.id);
      setRevokeRow(null);
      setFlash('Đã thu hồi token kiosk.');
      await load();
    } catch (err) {
      setError(err?.message || t.loadError);
    } finally {
      setBusyId(null);
    }
  };

  const confirmRotate = async (e) => {
    e.preventDefault();
    if (!rotateRow) return;
    setBusyId(rotateRow.id);
    try {
      const res = await adminApi.rotateKioskToken(rotateRow.id);
      setRotateRow(null);
      setIssuedToken(res?.token || '');
      setCopied(false);
      setFlash(t.issuedTitle);
      await load();
    } catch (err) {
      setError(err?.message || t.loadError);
    } finally {
      setBusyId(null);
    }
  };

  const copyText = async (text, key = null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (key != null) {
        setCopiedKey(key);
        window.setTimeout(() => setCopiedKey(null), 2000);
      } else {
        setCopied(true);
      }
    } catch {
      if (key == null) setCopied(false);
    }
  };

  return (
    <>
      <AdminSubmenuBreadcrumb parentLabelKey="settings" currentLabelKey="settingsFingerprintTokens" />

      <div className="flex flex-col lg:h-full lg:min-h-0 gap-2">
        {flash && (
          <FlashBanner flash={{ type: 'success', message: flash }} onClose={() => setFlash('')} />
        )}
        <InlineErrorBanner message={error} />

        <div className="shrink-0">
          <KioskTokenStatGrid stats={stats} />
        </div>

        <RegistryTableShell
          className="flex-1 min-h-0"
          toolbar={
            <div className="flex items-center justify-between gap-2 w-full min-w-0">
              <h2 className="admin-section-title truncate">{t.listTitle}</h2>
              <button
                type="button"
                onClick={openIssue}
                className="inline-flex items-center justify-center gap-1.5 h-8 btn-primary px-2.5 rounded-lg text-sm shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" aria-hidden />
                {t.issue}
              </button>
            </div>
          }
          initialLoading={initialLoading}
          refreshing={loading && !initialLoading}
          loadingLabel={t.loading}
          footer={
            <TablePagination
              page={safePage}
              totalPages={totalPages}
              totalItems={rows.length}
              pageSize={pageSize}
              onPageChange={setPage}
              unitLabel={t.unitLabel}
            />
          }
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="table-header-row">
                <th className="table-th-left">{t.colDept}</th>
                <th className="table-th-left">{t.colLabel}</th>
                <th className="table-th-left">{t.colToken}</th>
                <th className="table-th-left">{t.colEnrollPin}</th>
                <th className="table-th-left">{t.colAgent}</th>
                <th className="table-th-left">{t.colStatus}</th>
                <th className="table-th-left">{t.colCreated}</th>
                <th className="table-th-right">{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <RegistryTableEmptyRow colSpan={COL_SPAN} message={t.empty} />
              ) : (
                paginated.map((row) => (
                  <tr key={row.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-navy">
                        {row.deptCodeFormatted}
                        {row.deptName ? ` — ${row.deptName}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.label ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral text-content-muted">
                          {row.label}
                        </span>
                      ) : (
                        <span className="text-content-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.active && row.token ? (
                        <div className="flex items-center gap-2 min-w-0 max-w-xs">
                          <code className="text-xs font-mono text-navy truncate" title={row.token}>
                            {row.token}
                          </code>
                          <button
                            type="button"
                            className="shrink-0 text-primary font-semibold text-xs"
                            onClick={() => copyText(row.token, `token-${row.id}`)}
                          >
                            {copiedKey === `token-${row.id}` ? t.copied : t.copy}
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-content-muted"
                          title={row.active && !row.token ? t.tokenMissingHint : undefined}
                        >
                          {t.tokenMissing}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.active && row.enrollPin ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <code className="text-xs font-mono text-navy tabular-nums">{row.enrollPin}</code>
                          <button
                            type="button"
                            className="shrink-0 text-primary font-semibold text-xs"
                            onClick={() => copyText(row.enrollPin, `pin-${row.id}`)}
                          >
                            {copiedKey === `pin-${row.id}` ? t.copied : t.copyPin}
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-content-muted"
                          title={row.active ? t.pinMissingHint : undefined}
                        >
                          {t.pinMissing}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.active ? (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            row.agentOnline ? 'badge-success' : 'badge-neutral'
                          }`}
                          title={row.agentOnline ? t.agentOnlineHint : t.agentOfflineHint}
                        >
                          {row.agentOnline ? t.agentOnline : t.agentOffline}
                        </span>
                      ) : (
                        <span className="text-content-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          row.active ? 'badge-success' : 'badge-neutral'
                        }`}
                      >
                        {row.active ? t.statusActive : t.statusRevoked}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-content-muted whitespace-nowrap">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {row.active ? (
                        <>
                          <button
                            type="button"
                            className="text-primary font-semibold text-xs mr-3 disabled:opacity-50"
                            disabled={busyId === row.id}
                            onClick={() => openSetPin(row)}
                          >
                            {t.setPin}
                          </button>
                          <button
                            type="button"
                            className="text-primary font-semibold text-xs mr-3 disabled:opacity-50"
                            disabled={busyId === row.id}
                            onClick={() => setRotateRow(row)}
                          >
                            {t.rotate}
                          </button>
                          <button
                            type="button"
                            className="text-danger-fg font-semibold text-xs disabled:opacity-50"
                            disabled={busyId === row.id}
                            onClick={() => setRevokeRow(row)}
                          >
                            {t.revoke}
                          </button>
                        </>
                      ) : (
                        <span className="text-content-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </RegistryTableShell>
      </div>

      {showIssue && (
        <FormModal
          title={t.issueTitle}
          subtitle={t.issueSubtitle}
          onClose={() => !issuing && setShowIssue(false)}
          onSubmit={submitIssue}
          loading={issuing}
          submitLabel={t.confirmIssue}
        >
          <InlineErrorBanner message={issueError} />
          <div>
            <label className={labelClass}>{t.deptLabel}</label>
            <select
              className={inputClass}
              value={issueDept}
              onChange={(e) => setIssueDept(e.target.value)}
              required
            >
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d.deptCode} value={d.deptCode}>
                  {(d.deptCodeFormatted || String(d.deptCode).padStart(2, '0')) +
                    ' — ' +
                    (d.deptName || '')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t.labelOptional}</label>
            <input
              className={inputClass}
              value={issueLabel}
              onChange={(e) => setIssueLabel(e.target.value)}
              placeholder={t.labelPlaceholder}
              maxLength={100}
            />
          </div>
        </FormModal>
      )}

      {pinRow && (
        <FormModal
          title={t.setPinTitle}
          subtitle={t.setPinSubtitle}
          onClose={() => !savingPin && setPinRow(null)}
          onSubmit={submitPin}
          loading={savingPin}
          submitLabel={t.setPinSubmit}
        >
          <InlineErrorBanner message={pinError} />
          <p className="text-sm text-content-muted mb-2">
            {pinRow.deptCodeFormatted}
            {pinRow.deptName ? ` — ${pinRow.deptName}` : ''}
          </p>
          <div>
            <label className={labelClass}>{t.setPinLabel}</label>
            <input
              className={inputClass}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder={t.setPinPlaceholder}
              maxLength={8}
              required
            />
          </div>
        </FormModal>
      )}

      {rotateRow && (
        <FormModal
          title={t.rotateTitle}
          subtitle={t.confirmRotate}
          onClose={() => !busyId && setRotateRow(null)}
          onSubmit={confirmRotate}
          loading={busyId === rotateRow.id}
          submitLabel={t.rotateSubmit}
        >
          <p className="text-sm text-content-muted">
            {rotateRow.deptCodeFormatted}
            {rotateRow.deptName ? ` — ${rotateRow.deptName}` : ''}
            {rotateRow.label ? ` · ${rotateRow.label}` : ''}
          </p>
        </FormModal>
      )}

      {revokeRow && (
        <DeleteModal
          title={t.revokeTitle}
          message={t.confirmRevoke}
          confirmLabel={t.revoke}
          onConfirm={confirmRevoke}
          onClose={() => !busyId && setRevokeRow(null)}
          loading={busyId === revokeRow.id}
        />
      )}

      {issuedToken && (
        <FormModal
          title={t.issuedTitle}
          subtitle={t.issuedHint}
          onClose={() => {
            setIssuedToken(null);
            setCopied(false);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            copyText(issuedToken);
          }}
          loading={false}
          submitLabel={copied ? t.copied : t.copy}
        >
          <code className="block text-xs break-all bg-surface-page border border-line rounded-lg p-3 font-mono text-navy">
            {issuedToken}
          </code>
        </FormModal>
      )}
    </>
  );
}
