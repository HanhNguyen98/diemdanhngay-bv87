using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using BV87.App.Helpers;

namespace BV87.App.Controls;

public partial class TablePaginationBar : UserControl
{
    public static readonly DependencyProperty CurrentPageProperty =
        DependencyProperty.Register(nameof(CurrentPage), typeof(int), typeof(TablePaginationBar),
            new PropertyMetadata(1, OnPaginationStateChanged));

    public static readonly DependencyProperty TotalPagesProperty =
        DependencyProperty.Register(nameof(TotalPages), typeof(int), typeof(TablePaginationBar),
            new PropertyMetadata(1, OnPaginationStateChanged));

    public static readonly DependencyProperty TotalItemsProperty =
        DependencyProperty.Register(nameof(TotalItems), typeof(int), typeof(TablePaginationBar),
            new PropertyMetadata(0, OnPaginationStateChanged));

    public static readonly DependencyProperty PageSizeProperty =
        DependencyProperty.Register(nameof(PageSize), typeof(int), typeof(TablePaginationBar),
            new FrameworkPropertyMetadata(20, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault));

    public static readonly DependencyProperty PageSizeOptionsProperty =
        DependencyProperty.Register(nameof(PageSizeOptions), typeof(IEnumerable<int>), typeof(TablePaginationBar));

    public static readonly DependencyProperty UnitLabelProperty =
        DependencyProperty.Register(nameof(UnitLabel), typeof(string), typeof(TablePaginationBar),
            new PropertyMetadata("kết quả"));

    public static readonly DependencyProperty GoToPageCommandProperty =
        DependencyProperty.Register(nameof(GoToPageCommand), typeof(ICommand), typeof(TablePaginationBar));

    public static readonly DependencyProperty PageItemsProperty =
        DependencyProperty.Register(nameof(PageItems), typeof(ObservableCollection<PaginationPageItem>), typeof(TablePaginationBar));

    public static readonly DependencyProperty CanGoPreviousProperty =
        DependencyProperty.Register(nameof(CanGoPrevious), typeof(bool), typeof(TablePaginationBar));

    public static readonly DependencyProperty CanGoNextProperty =
        DependencyProperty.Register(nameof(CanGoNext), typeof(bool), typeof(TablePaginationBar));

    public TablePaginationBar()
    {
        PageItems = [];
        InitializeComponent();
    }

    public int CurrentPage
    {
        get => (int)GetValue(CurrentPageProperty);
        set => SetValue(CurrentPageProperty, value);
    }

    public int TotalPages
    {
        get => (int)GetValue(TotalPagesProperty);
        set => SetValue(TotalPagesProperty, value);
    }

    public int TotalItems
    {
        get => (int)GetValue(TotalItemsProperty);
        set => SetValue(TotalItemsProperty, value);
    }

    public int PageSize
    {
        get => (int)GetValue(PageSizeProperty);
        set => SetValue(PageSizeProperty, value);
    }

    public IEnumerable<int>? PageSizeOptions
    {
        get => (IEnumerable<int>?)GetValue(PageSizeOptionsProperty);
        set => SetValue(PageSizeOptionsProperty, value);
    }

    public string UnitLabel
    {
        get => (string)GetValue(UnitLabelProperty);
        set => SetValue(UnitLabelProperty, value);
    }

    public ICommand? GoToPageCommand
    {
        get => (ICommand?)GetValue(GoToPageCommandProperty);
        set => SetValue(GoToPageCommandProperty, value);
    }

    public ObservableCollection<PaginationPageItem> PageItems
    {
        get => (ObservableCollection<PaginationPageItem>)GetValue(PageItemsProperty);
        private set => SetValue(PageItemsProperty, value);
    }

    public bool CanGoPrevious
    {
        get => (bool)GetValue(CanGoPreviousProperty);
        private set => SetValue(CanGoPreviousProperty, value);
    }

    public bool CanGoNext
    {
        get => (bool)GetValue(CanGoNextProperty);
        private set => SetValue(CanGoNextProperty, value);
    }

    private static void OnPaginationStateChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is TablePaginationBar bar)
        {
            bar.RefreshPageItems();
        }
    }

    private void RefreshPageItems()
    {
        CanGoPrevious = CurrentPage > 1;
        CanGoNext = CurrentPage < TotalPages;

        PageItems.Clear();
        foreach (var item in PaginationPageRange.Build(CurrentPage, TotalPages))
        {
            PageItems.Add(item);
        }
    }

    private void FirstPage_Click(object sender, RoutedEventArgs e) => GoToPage(1);

    private void PreviousPage_Click(object sender, RoutedEventArgs e) => GoToPage(CurrentPage - 1);

    private void NextPage_Click(object sender, RoutedEventArgs e) => GoToPage(CurrentPage + 1);

    private void LastPage_Click(object sender, RoutedEventArgs e) => GoToPage(TotalPages);

    private void PageNumber_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button { Tag: int pageNumber })
        {
            GoToPage(pageNumber);
        }
    }

    private void GoToPage(int page)
    {
        if (GoToPageCommand?.CanExecute(page) == true)
        {
            GoToPageCommand.Execute(page);
        }
    }
}
