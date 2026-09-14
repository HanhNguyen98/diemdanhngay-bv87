using System.Globalization;
using System.Windows;
using BV87.App.Helpers;
using BV87.App.Shell;
using BV87.App.ViewModels;
using BV87.Core.Constants;
using BV87.Core.Helpers;
using BV87.Core.Models.Admin.Catalog;

namespace BV87.App.Views.Admin.Catalog;

public partial class StaffTransferHistoryDialog : AppDialogWindow
{
    public StaffTransferHistoryDialog(StaffCatalogViewModel viewModel, StaffCatalogRowViewModel staff)
    {
        InitializeComponent();
        Title = CatalogUiStrings.Staff.HistoryTitle(staff.Fullname, staff.EmpCodeFormatted);
        TitleText.Text = Title;
        EmptyText.Text = CatalogUiStrings.Staff.HistoryEmpty;
        Loaded += async (_, _) => await LoadHistoryAsync(viewModel, staff.EmpCode);
    }

    private async Task LoadHistoryAsync(StaffCatalogViewModel viewModel, int empCode)
    {
        try
        {
            var items = await viewModel.LoadTransferHistoryAsync(empCode);
            var rows = items.Select(HistoryRowViewModel.FromDto).ToList();

            LoadingText.Visibility = Visibility.Collapsed;
            if (rows.Count == 0)
            {
                EmptyText.Visibility = Visibility.Visible;
                return;
            }

            HistoryGrid.ItemsSource = rows;
            HistoryGrid.Visibility = Visibility.Visible;
        }
        catch (Exception ex)
        {
            LoadingText.Visibility = Visibility.Collapsed;
            ErrorText.Text = ex.Message.Trim('"', ' ');
            ErrorText.Visibility = Visibility.Visible;
        }
    }

    private void Close_Click(object sender, RoutedEventArgs e) => Close();

    private sealed class HistoryRowViewModel
    {
        public string FromDeptDisplay { get; init; } = string.Empty;
        public string ToDeptDisplay { get; init; } = string.Empty;
        public string FromDateDisplay { get; init; } = string.Empty;
        public string ToDateDisplay { get; init; } = string.Empty;
        public string ReasonDisplay { get; init; } = string.Empty;
        public string CreatedByDisplay { get; init; } = string.Empty;
        public string CreatedAtDisplay { get; init; } = string.Empty;

        public static HistoryRowViewModel FromDto(StaffDepartmentAssignmentDto dto)
        {
            var toName = dto.ToDeptName ?? dto.DeptName;
            var toDisplay = DeptDisplayFormatter.Format(dto.ToUnitCode, toName);
            if (dto.Current)
            {
                toDisplay += $" ({CatalogUiStrings.Staff.HistoryCurrent})";
            }

            return new HistoryRowViewModel
            {
                FromDeptDisplay = dto.Initial || dto.FromDeptCode == null
                    ? CatalogUiStrings.Staff.HistoryInitial
                    : DeptDisplayFormatter.Format(dto.FromUnitCode, dto.FromDeptName),
                ToDeptDisplay = toDisplay,
                FromDateDisplay = FormatDate(dto.FromDate),
                ToDateDisplay = dto.Current ? CatalogUiStrings.Staff.HistoryCurrent : FormatDate(dto.ToDate),
                ReasonDisplay = string.IsNullOrWhiteSpace(dto.Reason) ? "—" : dto.Reason,
                CreatedByDisplay = string.IsNullOrWhiteSpace(dto.CreatedBy) ? "—" : dto.CreatedBy,
                CreatedAtDisplay = AdminUtilitiesFormatHelper.FormatLogDateTimeOrDash(dto.CreatedAt)
            };
        }

        private static string FormatDate(DateOnly? date) =>
            date?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? "—";
    }
}
