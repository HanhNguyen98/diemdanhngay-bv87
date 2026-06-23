package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AttendanceStatusType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttendanceStatusTypeRepository extends JpaRepository<AttendanceStatusType, Long> {

    Optional<AttendanceStatusType> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT t FROM AttendanceStatusType t ORDER BY t.sortOrder ASC, t.code ASC")
    List<AttendanceStatusType> findAllOrdered();

    @Query("SELECT t FROM AttendanceStatusType t WHERE t.active = true ORDER BY t.sortOrder ASC, t.code ASC")
    List<AttendanceStatusType> findAllActiveOrdered();

    @Query("SELECT COUNT(ar) FROM AttendanceRecord ar WHERE ar.status = :code")
    long countUsageByCode(@Param("code") String code);
}
