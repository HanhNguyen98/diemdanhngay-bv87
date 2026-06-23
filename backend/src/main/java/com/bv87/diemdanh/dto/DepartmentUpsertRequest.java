package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepartmentUpsertRequest {
    /** Chỉ dùng khi cập nhật; tạo mới để null — hệ thống tự cấp max+1 */
    private Integer deptCode;
    @NotBlank
    private String deptName;
    /** Optional display unit code (e.g. C11); shown on mobile cards instead of dept_code */
    private String unitCode;
    @NotNull(message = "Nhóm Đơn vị là bắt buộc")
    private Integer groupCode;
    private String location;
    private Integer headEmpCode;
    /** Data URL sơ đồ vị trí (image/jpeg|png|gif|webp); null hoặc rỗng để xóa */
    private String locationImageUrl;
}
