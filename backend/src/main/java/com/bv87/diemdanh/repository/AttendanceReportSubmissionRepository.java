package com.bv87.diemdanh.repository;

import com.bv87.diemdanh.entity.AttendanceReportSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AttendanceReportSubmissionRepository extends JpaRepository<AttendanceReportSubmission, Long> {

    Optional<AttendanceReportSubmission> findByAttendanceDateAndDeptCode(LocalDate date, Integer deptCode);

    List<AttendanceReportSubmission> findByAttendanceDateAndDeptCodeIn(LocalDate date, Collection<Integer> deptCodes);
}
