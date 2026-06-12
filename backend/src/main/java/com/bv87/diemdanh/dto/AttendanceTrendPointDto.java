package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AttendanceTrendPointDto {
    private final String label;
    private final long diLam;
    private final long nghiPhep;
    private final long diHoc;
    private final long diCongTac;
}
