package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StaffUpsertRequest {
    /** Chỉ dùng khi cập nhật; tạo mới để null — hệ thống tự cấp theo Đơn vị */
    private Integer empCode;
    @NotBlank
    private String fullname;
    @NotNull
    private Integer deptCode;
    private String rankName;
    private String positionName;
    private Boolean active;
    /** Data URL ảnh đại diện (image/jpeg|png|gif|webp); null giữ nguyên khi cập nhật, chuỗi rỗng để xóa */
    private String avatarUrl;
    /** Bắt buộc khi Admin đổi Đơn vị (luân chuyển) */
    private String transferReason;
    /** Bắt buộc true khi luân chuyển nhân viên đang là Trưởng đơn vị */
    private Boolean revokeHeadOnTransfer;
}
