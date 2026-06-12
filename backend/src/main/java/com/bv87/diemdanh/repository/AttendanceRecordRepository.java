package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AttendanceRecord;
import com.bv87.diemdanh.entity.AttendanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    @Query("SELECT ar FROM AttendanceRecord ar JOIN FETCH ar.employee e JOIN FETCH e.department " +
           "WHERE ar.attendanceDate = :date AND e.department.deptCode = :deptCode")
    List<AttendanceRecord> findByDateAndDeptCode(@Param("date") LocalDate date, @Param("deptCode") Integer deptCode);

    @Query("SELECT ar FROM AttendanceRecord ar JOIN FETCH ar.employee e JOIN FETCH e.department " +
           "WHERE ar.attendanceDate = :date")
    List<AttendanceRecord> findByDate(@Param("date") LocalDate date);

    @Query("SELECT ar FROM AttendanceRecord ar JOIN FETCH ar.employee e JOIN FETCH e.department " +
           "WHERE ar.attendanceDate = :date AND e.empCode = :empCode")
    Optional<AttendanceRecord> findByDateAndEmpCode(@Param("date") LocalDate date, @Param("empCode") Integer empCode);

    @Query("SELECT ar FROM AttendanceRecord ar JOIN FETCH ar.employee e JOIN FETCH e.department d " +
           "WHERE d.deptCode = :deptCode AND ar.attendanceDate >= :from AND ar.attendanceDate <= :to")
    List<AttendanceRecord> findByDeptCodeAndDateBetween(
            @Param("deptCode") Integer deptCode,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query(
            value = "SELECT ar FROM AttendanceRecord ar JOIN ar.employee e JOIN e.department d "
                    + "WHERE d.deptCode = :deptCode "
                    + "AND ar.attendanceDate >= :from AND ar.attendanceDate <= :to "
                    + "AND (:search IS NULL OR LOWER(e.fullname) LIKE LOWER(CONCAT('%', :search, '%')) "
                    + "OR CONCAT('', e.empCode) LIKE CONCAT('%', :search, '%'))",
            countQuery = "SELECT COUNT(ar) FROM AttendanceRecord ar JOIN ar.employee e JOIN e.department d "
                    + "WHERE d.deptCode = :deptCode "
                    + "AND ar.attendanceDate >= :from AND ar.attendanceDate <= :to "
                    + "AND (:search IS NULL OR LOWER(e.fullname) LIKE LOWER(CONCAT('%', :search, '%')) "
                    + "OR CONCAT('', e.empCode) LIKE CONCAT('%', :search, '%'))")
    Page<AttendanceRecord> findHistoryPage(
            @Param("deptCode") Integer deptCode,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT ar FROM AttendanceRecord ar JOIN ar.employee e JOIN e.department d "
            + "WHERE d.deptCode = :deptCode "
            + "AND ar.attendanceDate >= :from AND ar.attendanceDate <= :to "
            + "AND (:search IS NULL OR LOWER(e.fullname) LIKE LOWER(CONCAT('%', :search, '%')) "
            + "OR CONCAT('', e.empCode) LIKE CONCAT('%', :search, '%')) "
            + "ORDER BY ar.attendanceDate DESC, e.fullname ASC")
    List<AttendanceRecord> findHistoryAll(
            @Param("deptCode") Integer deptCode,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("search") String search);

    @Query("""
            SELECT e.empCode, e.fullname, d.deptCode, d.deptName, COUNT(ar)
            FROM AttendanceRecord ar
            JOIN ar.employee e
            JOIN e.department d
            WHERE ar.status = :status
            AND ar.attendanceDate >= :from AND ar.attendanceDate <= :to
            AND (:deptCode IS NULL OR d.deptCode = :deptCode)
            GROUP BY e.empCode, e.fullname, d.deptCode, d.deptName
            ORDER BY COUNT(ar) DESC
            """)
    List<Object[]> aggregateLeaveCountsByEmployee(
            @Param("status") AttendanceStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("deptCode") Integer deptCode);

    @Query("""
            SELECT d.deptCode, d.deptName, ar.status, COUNT(ar)
            FROM AttendanceRecord ar
            JOIN ar.employee e
            JOIN e.department d
            WHERE ar.attendanceDate >= :from AND ar.attendanceDate <= :to
            AND (:deptCode IS NULL OR d.deptCode = :deptCode)
            GROUP BY d.deptCode, d.deptName, ar.status
            """)
    List<Object[]> aggregateWorkStatusByDept(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("deptCode") Integer deptCode);
}
