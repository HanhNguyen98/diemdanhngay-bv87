package com.bv87.diemdanh.util;

import com.bv87.diemdanh.entity.AttendanceRecord;
import com.bv87.diemdanh.entity.AttendanceStatus;

import java.time.LocalTime;
import java.util.Set;

/**
 * Presence / completion rules — SPEC_FINGERPRINT §4.5–4.6.
 */
public final class AttendanceValidity {

    public static final LocalTime LATE_CUTOFF = LocalTime.of(7, 0);

    private static final Set<String> MANUAL = Set.of(
            AttendanceStatus.NGHI_PHEP.name(),
            AttendanceStatus.DI_HOC.name(),
            AttendanceStatus.DI_CONG_TAC.name(),
            AttendanceStatus.THAI_SAN.name());

    private static final Set<String> PRESENCE = Set.of(
            AttendanceStatus.DI_LAM.name(),
            AttendanceStatus.DI_TRE.name());

    private AttendanceValidity() {
    }

    public static boolean isManualStatus(String status) {
        return status != null && MANUAL.contains(status);
    }

    public static boolean isPresenceStatus(String status) {
        return status != null && PRESENCE.contains(status);
    }

    /**
     * Day-record counts as marked for KPI / COMPLETED.
     */
    public static boolean isComplete(AttendanceRecord record) {
        if (record == null) {
            return false;
        }
        return isComplete(record.getStatus(), record.getCheckInAt() != null, record.getCheckOutAt() != null);
    }

    public static boolean isComplete(String status, boolean hasCheckIn, boolean hasCheckOut) {
        if (status == null || status.isBlank()) {
            return false;
        }
        if (isManualStatus(status)) {
            return true;
        }
        if (isPresenceStatus(status)) {
            return hasCheckIn && hasCheckOut;
        }
        return false;
    }

    /** Rule C — assign DI_LAM / DI_TRE from check-in clock time. */
    public static String statusFromCheckInTime(LocalTime checkInTime) {
        if (checkInTime == null) {
            return null;
        }
        if (!checkInTime.isAfter(LATE_CUTOFF)) {
            return AttendanceStatus.DI_LAM.name();
        }
        return AttendanceStatus.DI_TRE.name();
    }
}
