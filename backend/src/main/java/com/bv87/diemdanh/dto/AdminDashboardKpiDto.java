package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDashboardKpiDto {
    private final long total;
    private final long diLam;
    private final long nghiPhep;
    private final long diHoc;
    private final long diCongTac;
    private final long unchecked;
}
