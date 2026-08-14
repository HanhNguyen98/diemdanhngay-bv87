package com.bv87.diemdanh.util;

import com.bv87.diemdanh.exception.BusinessException;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * Admin-configurable 4-phase work day — SPEC_FINGERPRINT §4.13.1.
 */
public final class WorkSchedule {

    public static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    public static final String DEFAULT_MORNING_IN = "07:00";
    public static final String DEFAULT_NOON_OUT = "11:00";
    public static final String DEFAULT_AFTERNOON_IN = "13:30";
    public static final String DEFAULT_AFTERNOON_OUT = "16:30";
    public static final String DEFAULT_MORNING_OPEN = "05:00";
    public static final String DEFAULT_MIDPOINT1 = "09:00";
    public static final String DEFAULT_MIDPOINT_NOON = "12:16";
    public static final String DEFAULT_MIDPOINT2 = "15:00";
    public static final String DEFAULT_DAY_CLOSE = "21:00";
    public static final int DEFAULT_LATE_GRACE = 5;
    public static final int DEFAULT_EARLY_GRACE = 5;

    public enum PunchPhase {
        MORNING_IN,
        NOON_OUT,
        AFTERNOON_IN,
        AFTERNOON_OUT,
        REJECTED
    }

    private final LocalTime morningInOfficial;
    private final LocalTime noonOutOfficial;
    private final LocalTime afternoonInOfficial;
    private final LocalTime afternoonOutOfficial;
    private final LocalTime morningOpen;
    private final LocalTime midpoint1;
    private final LocalTime midpointNoon;
    private final LocalTime midpoint2;
    private final LocalTime dayClose;
    private final int lateGraceMinutes;
    private final int earlyGraceMinutes;

    private WorkSchedule(
            LocalTime morningInOfficial,
            LocalTime noonOutOfficial,
            LocalTime afternoonInOfficial,
            LocalTime afternoonOutOfficial,
            LocalTime morningOpen,
            LocalTime midpoint1,
            LocalTime midpointNoon,
            LocalTime midpoint2,
            LocalTime dayClose,
            int lateGraceMinutes,
            int earlyGraceMinutes) {
        this.morningInOfficial = morningInOfficial;
        this.noonOutOfficial = noonOutOfficial;
        this.afternoonInOfficial = afternoonInOfficial;
        this.afternoonOutOfficial = afternoonOutOfficial;
        this.morningOpen = morningOpen;
        this.midpoint1 = midpoint1;
        this.midpointNoon = midpointNoon;
        this.midpoint2 = midpoint2;
        this.dayClose = dayClose;
        this.lateGraceMinutes = lateGraceMinutes;
        this.earlyGraceMinutes = earlyGraceMinutes;
    }

    public static WorkSchedule defaults() {
        return parse(
                DEFAULT_MORNING_IN, DEFAULT_NOON_OUT, DEFAULT_AFTERNOON_IN, DEFAULT_AFTERNOON_OUT,
                DEFAULT_MORNING_OPEN, DEFAULT_MIDPOINT1, DEFAULT_MIDPOINT_NOON, DEFAULT_MIDPOINT2, DEFAULT_DAY_CLOSE,
                DEFAULT_LATE_GRACE, DEFAULT_EARLY_GRACE);
    }

    public static WorkSchedule parse(
            String morningInOfficial,
            String noonOutOfficial,
            String afternoonInOfficial,
            String afternoonOutOfficial,
            String morningOpen,
            String midpoint1,
            String midpointNoon,
            String midpoint2,
            String dayClose,
            Integer lateGraceMinutes,
            Integer earlyGraceMinutes) {
        LocalTime mi = parseTime(orDefault(morningInOfficial, DEFAULT_MORNING_IN), "Giờ vào sáng");
        LocalTime no = parseTime(orDefault(noonOutOfficial, DEFAULT_NOON_OUT), "Giờ ra trưa");
        LocalTime ai = parseTime(orDefault(afternoonInOfficial, DEFAULT_AFTERNOON_IN), "Giờ vào chiều");
        LocalTime ao = parseTime(orDefault(afternoonOutOfficial, DEFAULT_AFTERNOON_OUT), "Giờ ra chiều");
        LocalTime open = parseTime(orDefault(morningOpen, DEFAULT_MORNING_OPEN), "Giờ mở cửa sáng");
        LocalTime mp1 = parseTime(orDefault(midpoint1, DEFAULT_MIDPOINT1), "Midpoint 1");
        LocalTime mpn = parseTime(orDefault(midpointNoon, DEFAULT_MIDPOINT_NOON), "Midpoint trưa");
        LocalTime mp2 = parseTime(orDefault(midpoint2, DEFAULT_MIDPOINT2), "Midpoint 2");
        LocalTime close = parseTime(orDefault(dayClose, DEFAULT_DAY_CLOSE), "Giờ đóng cửa");
        int late = grace(lateGraceMinutes, DEFAULT_LATE_GRACE, "Grace đi trễ");
        int early = grace(earlyGraceMinutes, DEFAULT_EARLY_GRACE, "Grace về sớm");
        assertOrder(open, mp1, mpn, mp2, close);
        assertInside(mi, open, mp1, false, "Giờ vào sáng");
        assertInside(no, mp1, mpn, false, "Giờ ra trưa");
        assertInside(ai, mpn, mp2, false, "Giờ vào chiều");
        assertInside(ao, mp2, close, true, "Giờ ra chiều");
        return new WorkSchedule(mi, no, ai, ao, open, mp1, mpn, mp2, close, late, early);
    }

    public PunchPhase classify(LocalTime time) {
        if (time == null) {
            return PunchPhase.REJECTED;
        }
        if (!time.isBefore(morningOpen) && time.isBefore(midpoint1)) {
            return PunchPhase.MORNING_IN;
        }
        if (!time.isBefore(midpoint1) && time.isBefore(midpointNoon)) {
            return PunchPhase.NOON_OUT;
        }
        if (!time.isBefore(midpointNoon) && time.isBefore(midpoint2)) {
            return PunchPhase.AFTERNOON_IN;
        }
        if (!time.isBefore(midpoint2) && !time.isAfter(dayClose)) {
            return PunchPhase.AFTERNOON_OUT;
        }
        return PunchPhase.REJECTED;
    }

    public LocalTime lateCutoff() {
        return morningInOfficial.plusMinutes(lateGraceMinutes);
    }

    public LocalTime earlyCutoff() {
        return afternoonOutOfficial.minusMinutes(earlyGraceMinutes);
    }

    public boolean isLate(LocalTime morningIn) {
        return morningIn != null && morningIn.isAfter(lateCutoff());
    }

    public boolean isEarlyLeave(LocalTime afternoonOut) {
        return afternoonOut != null && afternoonOut.isBefore(earlyCutoff());
    }

    public String morningInOfficial() {
        return morningInOfficial.format(TIME_FMT);
    }

    public String noonOutOfficial() {
        return noonOutOfficial.format(TIME_FMT);
    }

    public String afternoonInOfficial() {
        return afternoonInOfficial.format(TIME_FMT);
    }

    public String afternoonOutOfficial() {
        return afternoonOutOfficial.format(TIME_FMT);
    }

    public String morningOpen() {
        return morningOpen.format(TIME_FMT);
    }

    public String midpoint1() {
        return midpoint1.format(TIME_FMT);
    }

    public String midpointNoon() {
        return midpointNoon.format(TIME_FMT);
    }

    public String midpoint2() {
        return midpoint2.format(TIME_FMT);
    }

    public String dayClose() {
        return dayClose.format(TIME_FMT);
    }

    public int lateGraceMinutes() {
        return lateGraceMinutes;
    }

    public int earlyGraceMinutes() {
        return earlyGraceMinutes;
    }

    private static String orDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static LocalTime parseTime(String raw, String label) {
        try {
            return LocalTime.parse(raw.trim(), TIME_FMT);
        } catch (Exception ex) {
            throw new BusinessException(label + " không hợp lệ. Dùng định dạng HH:mm.");
        }
    }

    private static int grace(Integer value, int fallback, String label) {
        int minutes = value == null ? fallback : value;
        if (minutes < 0 || minutes > 60) {
            throw new BusinessException(label + " phải từ 0 đến 60 phút.");
        }
        return minutes;
    }

    private static void assertOrder(
            LocalTime open, LocalTime mp1, LocalTime noon, LocalTime mp2, LocalTime close) {
        if (!(open.isBefore(mp1) && mp1.isBefore(noon) && noon.isBefore(mp2) && mp2.isBefore(close))) {
            throw new BusinessException(
                    "Khung giờ quét không hợp lệ. Cần: mở cửa < Midpoint 1 < Midpoint trưa < Midpoint 2 < đóng cửa.");
        }
    }

    private static void assertInside(
            LocalTime official, LocalTime start, LocalTime end, boolean endInclusive, String label) {
        boolean afterOrAtStart = !official.isBefore(start);
        boolean beforeEnd = endInclusive ? !official.isAfter(end) : official.isBefore(end);
        if (!afterOrAtStart || !beforeEnd) {
            throw new BusinessException(label + " phải nằm trong khung nhận quét tương ứng.");
        }
    }
}
