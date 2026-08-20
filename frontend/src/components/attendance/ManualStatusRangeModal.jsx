import { memo, useMemo, useState } from 'react';

import { AlertTriangle } from 'lucide-react';

import FormModal from '../shared/FormModal';

import { FormFieldLabel } from '../shared/FormFieldLabel';

import {

  ATTENDANCE_STATUS,

  NGHI_TRUC_ASSIGNMENT,

  UI,

  countAttendancePunches,

} from '../../constants/attendance';

import { api } from '../../api/client';
import { displayEmpCode } from '../../utils/formatters';

const INPUT_ERROR = 'border-danger-fg ring-1 ring-danger-fg/40';



function daysInclusive(from, to) {

  if (!from || !to) return 0;

  const a = new Date(`${from}T00:00:00`);

  const b = new Date(`${to}T00:00:00`);

  return Math.floor((b - a) / 86400000) + 1;

}



function pickDefaultChildStatus(statusOptions, hasPunches) {

  if (!statusOptions?.length) return '';

  if (hasPunches) {

    const half = statusOptions.find((o) => o.value === ATTENDANCE_STATUS.NGHI_TRUC_HALF);

    if (half) return half.value;

  }

  return statusOptions[0]?.value || '';

}



function catalogChildLabel(optionValue) {

  if (optionValue === ATTENDANCE_STATUS.NGHI_TRUC_FULL) {

    return NGHI_TRUC_ASSIGNMENT.FULL.label;

  }

  if (optionValue === ATTENDANCE_STATUS.NGHI_TRUC_HALF) {

    return NGHI_TRUC_ASSIGNMENT.HALF_MORNING.label;

  }

  return null;

}



/**

 * Modal: assign manual attendance status for fromDate → toDate (SPEC §3.2.1).

 */

const ManualStatusRangeModal = memo(function ManualStatusRangeModal({

  staff,

  status,

  statusLabel,

  statusOptions = [],

  isNghiTruc = false,

  defaultDate,

  onConfirm,

  onClose,

  loading,

}) {

  const hasPunches =

    countAttendancePunches(staff) > 0 || Boolean(staff?.checkInAt || staff?.checkOutAt);



  const [selectedStatus, setSelectedStatus] = useState(() =>

    statusOptions.length > 0 ? pickDefaultChildStatus(statusOptions, hasPunches) : status || '',

  );

  const [fromDate, setFromDate] = useState(defaultDate);

  const [toDate, setToDate] = useState(defaultDate);

  const [note, setNote] = useState('');

  const [error, setError] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});

  const [previewing, setPreviewing] = useState(false);

  const [skipWarning, setSkipWarning] = useState(null);



  const dayCount = useMemo(() => daysInclusive(fromDate, toDate), [fromDate, toDate]);

  const busy = loading || previewing;

  const showDayCount = !isNghiTruc;



  const code = displayEmpCode(staff) || '—';

  const name = staff?.fullname || '—';

  const subtitle = `${code} - ${name}`;



  const validateDates = () => {

    const next = {};

    if (!selectedStatus) next.status = 'Vui lòng chọn trạng thái con.';

    if (!fromDate || !toDate) next.dates = 'Vui lòng chọn đủ Từ ngày và Đến ngày.';

    else if (toDate < fromDate) next.dates = UI.manualRangeInvalidOrder;

    else if (dayCount > MAX_RANGE_DAYS) next.dates = UI.manualRangeTooLong;

    setFieldErrors(next);

    if (Object.keys(next).length > 0) {

      setError(Object.values(next)[0]);

      return false;

    }

    setError('');

    return true;

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    setError('');

    setSkipWarning(null);

    if (!validateDates()) return;



    setPreviewing(true);

    try {

      const preview = await api.previewAttendanceManualRange({

        empCode: staff.empCode,

        fromDate,

        toDate,

        status: selectedStatus,

      });

      if (preview.requiresFingerprintSkipConfirm) {

        setSkipWarning({

          message:

            preview.message ||

            `Có ${preview.skippedFingerprint} ngày đã chấm bằng vân tay — sẽ được bỏ qua (không ghi đè). Tiếp tục?`,

        });

        return;

      }

      onConfirm({ status: selectedStatus, fromDate, toDate, note });

    } catch (err) {

      setError(err.message || 'Không kiểm tra được khoảng ngày.');

    } finally {

      setPreviewing(false);

    }

  };



  const handleContinueSkip = () => {

    setSkipWarning(null);

    onConfirm({ status: selectedStatus, fromDate, toDate, note });

  };



  const isOptionDisabled = (optionValue) =>

    hasPunches && optionValue === ATTENDANCE_STATUS.NGHI_TRUC_FULL;



  return (

    <FormModal

      title={UI.manualRangeTitle}

      subtitle={subtitle}

      onClose={onClose}

      onSubmit={handleSubmit}

      loading={busy}

      submitLabel={busy ? UI.manualRangeSubmitting : UI.manualRangeSubmit}

      centerMobile

    >

      <div className="rounded-xl border border-line bg-neutral/40 px-3 py-2.5">

        <p className="text-xs text-content-muted">Trạng thái</p>

        <p className="text-sm font-semibold text-navy mt-0.5">{statusLabel || status}</p>

      </div>



      {statusOptions.length > 0 && (

        <label className="block min-w-0">

          <FormFieldLabel required className="block mb-1">{UI.manualRangeChildStatus}</FormFieldLabel>

          <select

            value={selectedStatus}

            onChange={(e) => {

              setSelectedStatus(e.target.value);

              setSkipWarning(null);

              setFieldErrors((f) => ({ ...f, status: undefined }));

            }}

            disabled={busy}

            className={`w-full h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral ${

              fieldErrors.status ? INPUT_ERROR : 'border-line'

            }`}

          >

            {statusOptions.map((option) => (

              <option key={option.value} value={option.value} disabled={isOptionDisabled(option.value)}>

                {catalogChildLabel(option.value) || option.label}

                {isOptionDisabled(option.value) ? ' (cần Admin xóa giờ quét)' : ''}

              </option>

            ))}

          </select>

          {hasPunches && isNghiTruc ? (

            <p className="mt-1 text-3xs text-warning-fg font-medium">

              {UI.nghiTrucWizardUseWizardHint}

            </p>

          ) : null}

        </label>

      )}



      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <label className="block min-w-0">

          <FormFieldLabel required className="block mb-1">{UI.manualRangeFrom}</FormFieldLabel>

          <input

            type="date"

            value={fromDate}

            onChange={(e) => {

              setFromDate(e.target.value);

              setSkipWarning(null);

              setFieldErrors((f) => ({ ...f, dates: undefined }));

            }}

            disabled={busy}

            className={`w-full h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral ${

              fieldErrors.dates ? INPUT_ERROR : 'border-line'

            }`}

          />

        </label>

        <label className="block min-w-0">

          <FormFieldLabel required className="block mb-1">{UI.manualRangeTo}</FormFieldLabel>

          <input

            type="date"

            value={toDate}

            onChange={(e) => {

              setToDate(e.target.value);

              setSkipWarning(null);

              setFieldErrors((f) => ({ ...f, dates: undefined }));

            }}

            disabled={busy}

            className={`w-full h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral ${

              fieldErrors.dates ? INPUT_ERROR : 'border-line'

            }`}

          />

        </label>

      </div>



      <label className="block min-w-0">

        <FormFieldLabel className="block mb-1">{UI.manualRangeNote}</FormFieldLabel>

        <textarea

          value={note}

          onChange={(e) => setNote(e.target.value)}

          disabled={busy}

          rows={3}

          placeholder={UI.manualRangeNotePlaceholder}

          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none resize-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-neutral"

        />

      </label>



      {showDayCount && dayCount > 0 && toDate >= fromDate && (

        <p className="text-xs text-content-muted">

          Số ngày: <span className="font-semibold text-navy">{dayCount}</span>

        </p>

      )}



      {skipWarning && (

        <div

          className="rounded-xl border border-warning-fg/30 bg-warning px-3 py-2.5 space-y-2.5"

          role="alert"

        >

          <div className="flex gap-2 items-start">

            <AlertTriangle className="w-4 h-4 text-warning-fg shrink-0 mt-0.5" aria-hidden />

            <p className="text-sm text-navy leading-snug">{skipWarning.message}</p>

          </div>

          <div className="flex justify-end gap-2">

            <button

              type="button"

              onClick={() => setSkipWarning(null)}

              disabled={busy}

              className="h-8 px-3 rounded-lg border border-line text-xs font-medium text-content-muted hover:bg-surface-white disabled:opacity-60"

            >

              {UI.manualRangeSkipCancel}

            </button>

            <button

              type="button"

              onClick={handleContinueSkip}

              disabled={busy}

              className="h-8 px-3 rounded-lg btn-primary text-xs font-medium disabled:opacity-60"

            >

              {UI.manualRangeSkipContinue}

            </button>

          </div>

        </div>

      )}



      {error && (

        <p className="text-xs text-danger-fg bg-danger/40 rounded-lg px-2.5 py-1.5">{error}</p>

      )}

    </FormModal>

  );

});



export default ManualStatusRangeModal;

