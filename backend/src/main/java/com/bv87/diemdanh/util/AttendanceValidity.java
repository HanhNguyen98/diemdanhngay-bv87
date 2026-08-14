package com.bv87.diemdanh.util;

import com.bv87.diemdanh.entity.AttendanceRecord;
import com.bv87.diemdanh.entity.AttendanceStatus;

import java.time.LocalTime;
import java.util.Set;

/**
 * Presence / completion rules — SPEC_FINGERPRINT §4.5 and §4.13.
 */
public final class AttendanceValidity {

    public static final LocalTime LATE_CUTOFF = LocalTime.of(7, 0);

    public static final String VE_SOM = "VE_SOM";
    public static final String NGHI_TRUC_FULL = "NGHI_TRUC_FULL";
    public static final String NGHI_TRUC_HALF = "NGHI_TRUC_HALF";

    public static final String SOURCE_FINGERPRINT = "FINGERPRINT";
    public static final String SOURCE_MIXED = "MIXED";
    public static final String SOURCE_MANUAL = "MANUAL";
    public static final String SOURCE_ADMIN = "ADMIN";

    private static final Set<String> PRESENCE = Set.of(
            AttendanceStatus.DI_LAM.name(),
            AttendanceStatus.DI_TRE.name());

    private AttendanceValidity() {
    }

    public static boolean isManualStatus(String status) {
        return status != null && !status.isBlank() && !PRESENCE.contains(status);
    }

    public static boolean isPresenceStatus(String status) {
        return status != null && PRESENCE.contains(status);
    }

    public static boolean isHybridKeepTimes(String status) {
        return VE_SOM.equals(status) || NGHI_TRUC_HALF.equals(status);
    }

    /**
     * SPEC §4.13.4 P7b — fingerprint scan source: MIXED if day already has non-fingerprint origin.
     */
    public static String sourceAfterFingerprintScan(String previous) {
        if (previous == null || previous.isBlank() || SOURCE_FINGERPRINT.equals(previous)) {
            return SOURCE_FINGERPRINT;
        }
        return SOURCE_MIXED;
    }

    /**
     * SPEC §4.13.3 P7b — drop VE_SOM reason when clock status is no longer early leave.
     */
    public static void applyClockStatus(AttendanceRecord record, String newStatus) {
        if (record == null) {
            return;
        }
        if (VE_SOM.equals(record.getStatus()) && !VE_SOM.equals(newStatus)) {
            record.setNote(null);
        }
        record.setStatus(newStatus);
    }

    public static int punchCount(AttendanceRecord record) {
        if (record == null) {
            return 0;
        }
        int count = 0;
        if (record.getMorningInAt() != null) {
            count++;
        }
        if (record.getNoonOutAt() != null) {
            count++;
        }
        if (record.getAfternoonInAt() != null) {
            count++;
        }
        if (record.getAfternoonOutAt() != null) {
            count++;
        }
        return count;
    }

    public static boolean hasAfternoonPunch(AttendanceRecord record) {
        return record != null && (record.getAfternoonInAt() != null || record.getAfternoonOutAt() != null);
    }

    /**
     * Day-record counts as marked for KPI / COMPLETED.
     */
    public static boolean isComplete(AttendanceRecord record) {
        if (record == null) {
            return false;
        }
        return isComplete(record.getStatus(), record, record.getNote());
    }

    public static boolean isComplete(String status, AttendanceRecord record, String note) {
        if (status == null || status.isBlank()) {
            return false;
        }
        if (NGHI_TRUC_HALF.equals(status)) {
            return record != null
                    && record.getMorningInAt() != null
                    && record.getNoonOutAt() != null
                    && !hasAfternoonPunch(record);
        }
        if (VE_SOM.equals(status)) {
            return punchCount(record) == 4 && note != null && !note.isBlank();
        }
        if (isManualStatus(status)) {
            return true;
        }
        if (isPresenceStatus(status)) {
            int punches = punchCount(record);
            if (punches == 4) {
                return true;
            }
            if (isLegacyTwoPunchComplete(record)) {
                return true;
            }
            return punches == 0
                    && record != null
                    && record.getCheckInAt() != null
                    && record.getCheckOutAt() != null;
        }
        return false;
    }

    /**
     * Pre-P7 row after V18 copy: morning IN + afternoon OUT only.
     */
    public static boolean isLegacyTwoPunchComplete(AttendanceRecord record) {
        return record != null
                && record.getMorningInAt() != null
                && record.getAfternoonOutAt() != null
                && record.getNoonOutAt() == null
                && record.getAfternoonInAt() == null;
    }

    /** Legacy 2-punch complete check — used only where 4-phase record is unavailable. */
    public static boolean isComplete(String status, boolean hasCheckIn, boolean hasCheckOut) {
        if (status == null || status.isBlank()) {
            return false;
        }
        if (isManualStatus(status)) {
            return !VE_SOM.equals(status);
        }
        if (isPresenceStatus(status)) {
            return hasCheckIn && hasCheckOut;
        }
        return false;
    }

    /** Rule C — assign DI_LAM / DI_TRE from check-in clock time vs lateCutoff. */
    public static String statusFromCheckInTime(LocalTime checkInTime) {
        return statusFromCheckInTime(checkInTime, LATE_CUTOFF);
    }

    public static String statusFromCheckInTime(LocalTime checkInTime, LocalTime lateCutoff) {
        if (checkInTime == null) {
            return null;
        }
        LocalTime cutoff = lateCutoff != null ? lateCutoff : LATE_CUTOFF;
        if (!checkInTime.isAfter(cutoff)) {
            return AttendanceStatus.DI_LAM.name();
        }
        return AttendanceStatus.DI_TRE.name();
    }

    public static void syncLegacyTimes(AttendanceRecord record) {
        if (record == null) {
            return;
        }
        record.setCheckInAt(record.getMorningInAt());
        record.setCheckOutAt(record.getAfternoonOutAt() != null
                ? record.getAfternoonOutAt()
                : record.getNoonOutAt());
    }
}
