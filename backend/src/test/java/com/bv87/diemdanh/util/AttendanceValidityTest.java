package com.bv87.diemdanh.util;

import com.bv87.diemdanh.entity.AttendanceRecord;
import com.bv87.diemdanh.enums.PayrollIntent;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** P16 — nghỉ trực 1 ngày / nửa buổi chiều completeness. */
class AttendanceValidityTest {

    @Test
    void nullRecordIsNotComplete() {
        assertFalse(AttendanceValidity.isComplete((AttendanceRecord) null));
    }

    @Test
    void presenceWithoutPunchesIsNotComplete() {
        AttendanceRecord record = new AttendanceRecord();
        record.setStatus("DI_LAM");
        assertFalse(AttendanceValidity.isComplete(record));
    }

    @Test
    void fullDayCompleteWithoutTimes() {
        AttendanceRecord record = new AttendanceRecord();
        record.setStatus(AttendanceValidity.NGHI_TRUC_FULL);
        assertTrue(AttendanceValidity.isComplete(record));
    }

    @Test
    void halfAfternoonIncompleteUntilMorningScans() {
        AttendanceRecord record = new AttendanceRecord();
        record.setStatus(AttendanceValidity.NGHI_TRUC_HALF);
        record.setPayrollIntent(PayrollIntent.HALF_AFTERNOON.name());
        assertFalse(AttendanceValidity.isComplete(record));

        record.setMorningInAt(Instant.parse("2026-09-09T00:00:00Z"));
        record.setNoonOutAt(Instant.parse("2026-09-09T04:00:00Z"));
        assertTrue(AttendanceValidity.isComplete(record));
    }

    @Test
    void wizardNoLongerAssignsMorningHalf() {
        assertFalse(PayrollIntent.HALF_MORNING.isNghiTrucAssignable());
        assertTrue(PayrollIntent.HALF_AFTERNOON.isNghiTrucAssignable());
        assertTrue(PayrollIntent.NGHI_TRUC_FULL.isNghiTrucAssignable());
    }
}
