package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AttendanceUnlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface AttendanceUnlockRepository extends JpaRepository<AttendanceUnlock, Long> {

    @Query("SELECT u FROM AttendanceUnlock u WHERE u.department.deptCode = :deptCode AND u.attendanceDate = :date")
    Optional<AttendanceUnlock> findByDeptCodeAndDate(
            @Param("deptCode") Integer deptCode,
            @Param("date") LocalDate date);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM AttendanceUnlock u " +
           "WHERE u.department.deptCode = :deptCode AND u.attendanceDate = :date")
    boolean existsByDeptCodeAndDate(@Param("deptCode") Integer deptCode, @Param("date") LocalDate date);
}
