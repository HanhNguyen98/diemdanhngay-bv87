package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AccountScreensUpdateRequest {
    @NotNull
    private List<String> screenCodes = new ArrayList<>();
}
