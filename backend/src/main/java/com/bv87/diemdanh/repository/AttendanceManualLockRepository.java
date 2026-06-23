package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AttendanceManualLock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface AttendanceManualLockRepository extends JpaRepository<AttendanceManualLock, Long> {

    @Query("SELECT m FROM AttendanceManualLock m WHERE m.department.deptCode = :deptCode AND m.attendanceDate = :date")
    Optional<AttendanceManualLock> findByDeptCodeAndDate(
            @Param("deptCode") Integer deptCode,
            @Param("date") LocalDate date);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM AttendanceManualLock m "
            + "WHERE m.department.deptCode = :deptCode AND m.attendanceDate = :date")
    boolean existsByDeptCodeAndDate(@Param("deptCode") Integer deptCode, @Param("date") LocalDate date);
}
