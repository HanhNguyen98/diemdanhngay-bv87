package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AttendanceReminderLog;
import com.bv87.diemdanh.entity.ReminderLogStatus;
import com.bv87.diemdanh.entity.ReminderTriggerType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceReminderLogRepository extends JpaRepository<AttendanceReminderLog, Long> {

    boolean existsByAttendanceDateAndTriggerType(LocalDate attendanceDate, ReminderTriggerType triggerType);

    List<AttendanceReminderLog> findByDeptCodeGreaterThanAndAttendanceDateBetweenAndStatusOrderByCreatedAtDesc(
            Integer deptCode,
            LocalDate from,
            LocalDate to,
            ReminderLogStatus status,
            Pageable pageable);

    @Query("""
            SELECT l.deptCode, COUNT(l)
            FROM AttendanceReminderLog l
            WHERE l.status = com.bv87.diemdanh.entity.ReminderLogStatus.SENT
              AND l.deptCode > 0
              AND l.attendanceDate BETWEEN :from AND :to
            GROUP BY l.deptCode
            ORDER BY COUNT(l) DESC
            """)
    List<Object[]> countSentByDeptBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
