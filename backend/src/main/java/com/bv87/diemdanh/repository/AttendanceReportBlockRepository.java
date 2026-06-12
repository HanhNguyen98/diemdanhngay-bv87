package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AttendanceReportBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AttendanceReportBlockRepository extends JpaRepository<AttendanceReportBlock, Long> {

    Optional<AttendanceReportBlock> findByAttendanceDateAndDeptCode(LocalDate date, Integer deptCode);

    List<AttendanceReportBlock> findByAttendanceDateAndDeptCodeIn(LocalDate date, Collection<Integer> deptCodes);

    void deleteByAttendanceDateAndDeptCode(LocalDate date, Integer deptCode);
}
