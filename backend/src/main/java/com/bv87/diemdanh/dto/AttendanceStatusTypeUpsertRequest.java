package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AttendanceStatusTypeUpsertRequest {

    @NotBlank(message = "Mã trạng thái không được để trống")
    @Size(max = 50, message = "Mã trạng thái tối đa 50 ký tự")
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "Mã trạng thái chỉ gồm chữ in hoa, số và dấu gạch dưới")
    private String code;

    @NotBlank(message = "Tên hiển thị không được để trống")
    @Size(max = 100, message = "Tên hiển thị tối đa 100 ký tự")
    private String label;

    @NotBlank(message = "Nhãn badge không được để trống")
    @Size(max = 100, message = "Nhãn badge tối đa 100 ký tự")
    private String badgeLabel;

    @NotBlank(message = "Màu hiển thị không được để trống")
    private String colorKey;

    @NotBlank(message = "Biểu tượng không được để trống")
    private String iconKey;

    @NotNull(message = "Thứ tự sắp xếp không được để trống")
    private Integer sortOrder;

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    private Boolean active;

    @NotNull(message = "Cờ cho phép chấm thủ công không được để trống")
    private Boolean manualAllowed;

    @NotNull(message = "Cờ nhóm trạng thái không được để trống")
    private Boolean groupParent;

    @Size(max = 50, message = "Mã trạng thái cha tối đa 50 ký tự")
    @Pattern(regexp = "^[A-Z0-9_]*$", message = "Mã trạng thái cha chỉ gồm chữ in hoa, số và dấu gạch dưới")
    private String parentCode;
}
