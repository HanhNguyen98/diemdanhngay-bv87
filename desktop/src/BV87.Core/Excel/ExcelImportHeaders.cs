namespace BV87.Core.Excel;

/// <summary>Excel template column headers matching Web admin.js form.* — required for cross-platform import (§2.16).</summary>
public static class ExcelImportHeaders
{
    public static class Department
    {
        public const string GroupName = "Tên nhóm";
        public const string DeptName = "Tên Đơn vị";
        public const string HeadName = "Tên Trưởng đơn vị";
    }

    public static class Staff
    {
        public const string DeptCode = "Mã Đơn vị";
        public const string Fullname = "Họ và tên";
        public const string Rank = "Cấp bậc";
        public const string Position = "Chức vụ";
        public const string Status = "Trạng thái";
    }
}
