package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class SendReminderRequest {

    @NotEmpty
    private List<Integer> deptCodes;

    /** Attendance day to remind about; null = yesterday (legacy clients). */
    private LocalDate date;
}
