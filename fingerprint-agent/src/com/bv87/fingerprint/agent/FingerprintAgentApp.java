package com.bv87.fingerprint.agent;

import com.zkteco.biometric.FingerprintSensorErrorCode;
import com.zkteco.biometric.FingerprintSensorEx;

import javax.imageio.ImageIO;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferByte;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Department kiosk Agent — default Chấm công (Identify P2.1 / §9.3);
 * Enroll (§9.1) via PIN-gated mode switch (P2.1d / §9.3.2).
 * P4b/P4c: preview reset, HTTP + device open/close off EDT, in-memory preview.
 */
public class FingerprintAgentApp extends JFrame {

    /** Window chrome — Chấm công mode (SPEC §9.3). */
    private static final String WINDOW_TITLE_ATTENDANCE = "Biometric Attendance";
    /** Window chrome — Enroll mode (SPEC P1.1h). */
    private static final String WINDOW_TITLE_ENROLL = "Biometric Enroll";
    /** In-app header label — SPEC P1.1h / §9.3. */
    private static final String APP_TITLE = "VÂN TAY NHÂN VIÊN - ĐĂNG KÝ";
    private static final String APP_TITLE_ATTENDANCE = "VÂN TAY NHÂN VIÊN — Chấm công";
    /** Logo beside in-app title — SPEC P1.1h. */
    private static final String APP_LOGO_RESOURCE = "/branding/biometrics.png";
    /** Window title-bar icon — SPEC P1.1h. */
    private static final String WINDOW_ICON_RESOURCE = "/branding/hospital-logo.png";
    private static final int BRAND_LOGO_SIZE = 28;
    private static final int WINDOW_ICON_SIZE = 32;
    /** Even vertical spacing between info blocks — SPEC P1.1j. */
    private static final int SECTION_GAP = 12;
    private static final int SCAN_CARD_MAX_HEIGHT = 360;
    /** Content column max width on maximize — SPEC §9.3.1 P2.1b. */
    private static final int CONTENT_MAX_WIDTH = 960;
    private static final int ENROLL_COUNT = 3;
    private static final int DEFAULT_AUTO_OPEN_RETRIES = 3;
    private static final int DEFAULT_AUTO_OPEN_RETRY_MS = 2000;
    private static final int REJECTED_MESSAGE_MAX_LEN = 72;
    /** Debounce between POST scan for same emp — SPEC §9.3. */
    private static final long SCAN_DEBOUNCE_MS = 2_000L;
    /** Debounce enroll-idle finger warning — SPEC P1.1i. */
    private static final long ENROLL_IDLE_WARN_MS = 1_000L;
    /** Default idle before auto-back to Chấm công — SPEC §9.3.2. */
    private static final int DEFAULT_ENROLL_IDLE_SECONDS = 120;
    /** Default idle to auto-close PIN dialog — SPEC §9.3.2. */
    private static final int DEFAULT_PIN_IDLE_SECONDS = 60;
    private static final Color NAVY = new Color(0x001A4D);
    private static final Color NAVY_SOFT = new Color(0x2A3F75);
    private static final Color PRIMARY = new Color(0x2563EB);
    private static final Color PRIMARY_HOVER_SAFE = new Color(0x1D4ED8);
    private static final Color PRIMARY_LIGHT = new Color(0xEFF6FF);
    private static final Color PRIMARY_DISABLED = new Color(0x93C5FD);
    private static final Color PAGE_BG = new Color(0xF8F9FA);
    private static final Color LINE = new Color(0xE0E0E0);
    private static final Color MUTED = new Color(0x6C757D);
    private static final Color SUCCESS = new Color(0x10B981);
    private static final Color SUCCESS_BG = new Color(0xDEFBE8);
    private static final Color DANGER = new Color(0xEF4444);
    private static final Color DANGER_BG = new Color(0xFEF2F2);
    private static final Color DANGER_DISABLED = new Color(0xFECACA);
    private static final Color WARNING = new Color(0xF59E0B);
    private static final Color WARNING_BG = new Color(0xFFFBEB);

    /** Agent UI mode — mutex Identify ↔ Enroll (SPEC §9.3). */
    private enum AppMode {
        ATTENDANCE,
        ENROLL
    }

    /** Banner semantic tone — SPEC P1.1k. */
    private enum BannerTone {
        SUCCESS,
        WARNING,
        DANGER,
        INFO
    }

    private enum StaffFilter {
        ALL("Tất cả"),
        UNREGISTERED("Chưa đăng ký"),
        REGISTERED("Đã đăng ký");

        private final String label;

        StaffFilter(String label) {
            this.label = label;
        }

        @Override
        public String toString() {
            return label;
        }
    }

    private final JLabel brandLogoLabel = new JLabel();
    private final JLabel brandTitleLabel = new JLabel(APP_TITLE_ATTENDANCE, SwingConstants.LEFT);
    private final JLabel deptLabel = new JLabel("Đơn vị: —");
    private final JLabel deviceBadge = new JLabel("Máy: Chưa kết nối");
    private final JButton btnModeSwitch = new JButton("Đăng ký vân tay");
    private final JLabel statsTotal = new JLabel("Tổng: 0");
    private final JLabel statsRegistered = new JLabel("Đã đăng ký: 0");
    private final JLabel statsMissing = new JLabel("Chưa đăng ký: 0");
    private final JPanel filterChips = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
    private final JComboBox<AppApiClient.StaffItem> staffCombo = new JComboBox<>();
    private final JLabel bannerLabel = new JLabel(" ");
    private final JLabel previewLabel = new JLabel("", SwingConstants.CENTER);
    private final JLabel empCodeLabel = new JLabel("—");
    private final JLabel scanBadge = new JLabel(" ");
    /** Meta under preview — Enroll only (SPEC §9.3.1). */
    private JPanel scanMetaPanel;
    private final JLabel step1 = circleStep("1", "KẾT NỐI");
    private final JLabel step2 = circleStep("2", "QUÉT");
    private final JLabel step3 = circleStep("3", "HOÀN TẤT");
    private final JButton btnOpen = new JButton("Kết nối thiết bị");
    private final JButton btnReloadStaff = new JButton("Tải DS nhân viên");
    private final JButton btnEnroll = new JButton("Bắt đầu đăng ký");
    private final JButton btnDeleteFp = new JButton("Xóa vân tay");
    private final JButton btnCancel = new JButton("Hủy đăng ký");
    private final JButton btnClose = new JButton("Ngắt kết nối");

    private JComponent statsRow;
    private JComponent filterRow;
    private JComponent staffRow;
    private JComponent stepperRow;
    private JComponent enrollActionsRow;

    private StaffFilter activeFilter = StaffFilter.UNREGISTERED;
    private final List<JToggleButton> filterButtons = new ArrayList<>();

    private AppMode appMode = AppMode.ATTENDANCE;
    private AppApiClient apiClient;
    private String deptDisplay = "—";
    private List<AppApiClient.StaffItem> allStaff = new ArrayList<>();
    private final Map<Integer, AppApiClient.TemplateItem> fidToTemplate = new HashMap<>();
    private final Map<Integer, Long> lastScanPostMs = new HashMap<>();
    /** SPEC §9.3.3 — one scan POST at a time. */
    private final AtomicBoolean scanInFlight = new AtomicBoolean(false);
    /** SPEC §9.3.3 P4c — open/close device serialization. */
    private final AtomicBoolean deviceOpInFlight = new AtomicBoolean(false);
    /** SPEC §9.3.3 P4c — enroll/delete HTTP serialization. */
    private final AtomicBoolean enrollApiInFlight = new AtomicBoolean(false);
    /** Background I/O — must not block Swing EDT (P4b/P4c). */
    private final ExecutorService agentIo = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "fingerprint-agent-io");
        t.setDaemon(true);
        return t;
    });
    private long lastEnrollIdleWarnMs;
    private long mhDevice;
    private long mhDB;
    private boolean mbStop = true;
    private WorkThread workThread;
    private byte[] imgbuf;
    private int fpWidth;
    private int fpHeight;
    private final byte[] template = new byte[2048];
    private final int[] templateLen = new int[1];
    private final byte[][] regTempArray = new byte[ENROLL_COUNT][2048];
    private int enrollIdx;
    private boolean registering;
    private boolean justCompleted;

    /** PIN to enter Enroll — SPEC §9.3.2 (from agent.properties). */
    private String enrollPin = "";
    /** Idle timeout in Enroll mode (ms). */
    private long enrollIdleMs = DEFAULT_ENROLL_IDLE_SECONDS * 1000L;
    /** Idle timeout on PIN dialog (ms). */
    private long pinIdleMs = DEFAULT_PIN_IDLE_SECONDS * 1000L;
    private long lastEnrollActivityMs;
    private javax.swing.Timer enrollIdleTimer;

    /** P4a — auto-open ZK after bootstrap (agent.properties). */
    private boolean deviceAutoOpen = true;
    private int deviceAutoOpenRetries = DEFAULT_AUTO_OPEN_RETRIES;
    private int deviceAutoOpenRetryMs = DEFAULT_AUTO_OPEN_RETRY_MS;

    /** P4 §9.5.2 — Agent Online heartbeat. */
    private boolean heartbeatEnabled = true;
    private int heartbeatIntervalMs = 30_000;
    private javax.swing.Timer heartbeatTimer;

    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {
            // keep default
        }
        SwingUtilities.invokeLater(() -> {
            FingerprintAgentApp app = new FingerprintAgentApp();
            app.setVisible(true);
            app.bootstrapApi();
        });
    }

    public FingerprintAgentApp() {
        setTitle(WINDOW_TITLE_ATTENDANCE);
        setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        setSize(520, 780);
        setMinimumSize(new Dimension(460, 680));
        setLocationRelativeTo(null);
        // SPEC P1.1i — maximize desktop (keep title bar; not exclusive fullscreen)
        setExtendedState(getExtendedState() | Frame.MAXIMIZED_BOTH);

        JPanel root = new JPanel(new BorderLayout(0, 12));
        root.setBorder(new EmptyBorder(16, 20, 16, 20));
        root.setBackground(PAGE_BG);
        setContentPane(root);

        statsRow = buildStatsRow();
        filterRow = buildFilterRow();
        staffRow = buildStaffRow();
        stepperRow = buildStepper();
        enrollActionsRow = buildEnrollActions();

        JPanel main = new JPanel();
        main.setLayout(new BoxLayout(main, BoxLayout.Y_AXIS));
        main.setOpaque(false);
        main.setAlignmentX(Component.CENTER_ALIGNMENT);
        main.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, Integer.MAX_VALUE));
        main.setPreferredSize(new Dimension(CONTENT_MAX_WIDTH, 720));
        main.add(buildTitleRow());
        main.add(Box.createVerticalStrut(SECTION_GAP));
        main.add(rowLeft(deptLabel, 22));
        main.add(Box.createVerticalStrut(SECTION_GAP));
        main.add(statsRow);
        main.add(Box.createVerticalStrut(SECTION_GAP));
        main.add(filterRow);
        main.add(Box.createVerticalStrut(SECTION_GAP));
        main.add(staffRow);
        main.add(Box.createVerticalStrut(SECTION_GAP));
        main.add(stepperRow);
        main.add(Box.createVerticalStrut(SECTION_GAP));
        main.add(buildScanCard());
        main.add(Box.createVerticalStrut(SECTION_GAP));
        main.add(enrollActionsRow);
        main.add(Box.createVerticalStrut(SECTION_GAP));
        main.add(buildDeviceActions());

        // SPEC §9.3.1 — center content column on wide desktop (do not stretch full width)
        JPanel centerHost = new JPanel();
        centerHost.setLayout(new BoxLayout(centerHost, BoxLayout.X_AXIS));
        centerHost.setOpaque(false);
        centerHost.add(Box.createHorizontalGlue());
        centerHost.add(main);
        centerHost.add(Box.createHorizontalGlue());

        JScrollPane scroll = new JScrollPane(centerHost);
        scroll.setBorder(null);
        scroll.getViewport().setBackground(PAGE_BG);
        scroll.setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_NEVER);
        root.add(scroll, BorderLayout.CENTER);

        staffCombo.addActionListener(e -> {
            refreshScanMeta();
            if (appMode == AppMode.ENROLL) {
                touchEnrollActivity();
                refreshUiChrome();
            }
        });
        btnOpen.addActionListener(e -> openDevice());
        btnClose.addActionListener(e -> closeDevice());
        btnModeSwitch.addActionListener(e -> toggleMode());
        btnReloadStaff.addActionListener(e -> {
            if (registering) {
                setBanner("Đang đăng ký — hoàn tất hoặc hủy trước khi tải lại danh sách.", BannerTone.WARNING);
                return;
            }
            if (appMode == AppMode.ENROLL) {
                touchEnrollActivity();
            }
            reloadStaff(true);
        });
        btnEnroll.addActionListener(e -> startEnroll());
        btnDeleteFp.addActionListener(e -> deleteFingerprint());
        btnCancel.addActionListener(e -> cancelEnroll());

        addWindowListener(new java.awt.event.WindowAdapter() {
            @Override
            public void windowClosing(java.awt.event.WindowEvent e) {
                mbStop = true;
                registering = false;
                justCompleted = false;
                long db = mhDB;
                long device = mhDevice;
                mhDB = 0;
                mhDevice = 0;
                fidToTemplate.clear();
                try {
                    Thread.sleep(150);
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                }
                if (db != 0) {
                    FingerprintSensorEx.DBFree(db);
                }
                if (device != 0) {
                    FingerprintSensorEx.CloseDevice(device);
                }
                try {
                    FingerprintSensorEx.Terminate();
                } catch (Throwable ignored) {
                    // already terminated / native missing
                }
                if (heartbeatTimer != null) {
                    heartbeatTimer.stop();
                }
                agentIo.shutdownNow();
            }
        });

        styleDeviceBadge(false);
        clearScanBadge();
        setBanner("Sẵn sàng Chấm công. Kết nối API và thiết bị ZK9500.", BannerTone.INFO);
        deptLabel.setFont(deptLabel.getFont().deriveFont(Font.PLAIN, 13f));
        deptLabel.setForeground(NAVY);
        loadLocalBrandLogo();
        loadWindowIcon();
        applyModeUi();
        refreshUiChrome();
        installEnrollActivityWatch();
    }

    /** SPEC §9.3.2 — track idle in Enroll; auto-back to Chấm công. */
    private void installEnrollActivityWatch() {
        long mask = AWTEvent.MOUSE_EVENT_MASK
                | AWTEvent.MOUSE_MOTION_EVENT_MASK
                | AWTEvent.KEY_EVENT_MASK;
        Toolkit.getDefaultToolkit().addAWTEventListener(event -> {
            if (appMode == AppMode.ENROLL) {
                touchEnrollActivity();
            }
        }, mask);

        enrollIdleTimer = new javax.swing.Timer(1_000, e -> checkEnrollIdleTimeout());
        enrollIdleTimer.setRepeats(true);
        enrollIdleTimer.start();
    }

    private void touchEnrollActivity() {
        lastEnrollActivityMs = System.currentTimeMillis();
    }

    private void checkEnrollIdleTimeout() {
        if (appMode != AppMode.ENROLL) {
            return;
        }
        if (enrollIdleMs <= 0) {
            return;
        }
        long idle = System.currentTimeMillis() - lastEnrollActivityMs;
        if (idle >= enrollIdleMs) {
            switchToAttendanceMode();
            setBanner("Hết thời gian đăng ký (không thao tác) — đã về Chấm công.", BannerTone.WARNING);
        }
    }

    /** Full-width row within content column; height &lt;= 0 means preferred height. */
    private static JPanel rowLeft(JComponent content, int height) {
        JPanel row = new JPanel(new BorderLayout(0, 0));
        row.setOpaque(false);
        row.setAlignmentX(Component.LEFT_ALIGNMENT);
        if (height > 0) {
            row.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, height));
            row.setPreferredSize(new Dimension(CONTENT_MAX_WIDTH, height));
        } else {
            row.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, Integer.MAX_VALUE));
        }
        row.setBorder(null);
        row.add(content, BorderLayout.CENTER);
        return row;
    }

    private JPanel buildTitleRow() {
        JPanel row = new JPanel();
        row.setLayout(new BoxLayout(row, BoxLayout.X_AXIS));
        row.setOpaque(false);
        row.setAlignmentX(Component.LEFT_ALIGNMENT);
        row.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, 44));
        row.setBorder(null);

        brandLogoLabel.setVisible(false);
        brandLogoLabel.setAlignmentY(Component.CENTER_ALIGNMENT);
        brandTitleLabel.setFont(brandTitleLabel.getFont().deriveFont(Font.BOLD, 16f));
        brandTitleLabel.setForeground(NAVY);
        brandTitleLabel.setAlignmentY(Component.CENTER_ALIGNMENT);
        brandTitleLabel.setBorder(null);

        // Left-aligned with content (P1.1h): logo gap via logo border when visible — no indent when hidden
        row.add(brandLogoLabel);
        row.add(brandTitleLabel);
        row.add(Box.createHorizontalGlue());

        styleModeSwitchButton(btnModeSwitch);
        btnModeSwitch.setAlignmentY(Component.CENTER_ALIGNMENT);
        row.add(btnModeSwitch);
        row.add(Box.createHorizontalStrut(8));

        deviceBadge.setOpaque(true);
        deviceBadge.setBorder(new EmptyBorder(4, 10, 4, 10));
        deviceBadge.setFont(deviceBadge.getFont().deriveFont(Font.BOLD, 11f));
        deviceBadge.setAlignmentY(Component.CENTER_ALIGNMENT);
        row.add(deviceBadge);
        return row;
    }

    private JPanel buildStatsRow() {
        JPanel row = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        row.setOpaque(false);
        row.setBorder(null);
        row.setAlignmentX(Component.LEFT_ALIGNMENT);

        statsTotal.setFont(statsTotal.getFont().deriveFont(Font.BOLD, 12f));
        statsTotal.setForeground(NAVY);
        statsRegistered.setFont(statsRegistered.getFont().deriveFont(Font.BOLD, 12f));
        statsRegistered.setForeground(PRIMARY);
        // SPEC P1.1e — missing enroll count as warning
        statsMissing.setFont(statsMissing.getFont().deriveFont(Font.BOLD, 12f));
        statsMissing.setForeground(DANGER);

        row.add(statsTotal);
        row.add(Box.createHorizontalStrut(12));
        row.add(statsRegistered);
        row.add(Box.createHorizontalStrut(12));
        row.add(statsMissing);
        row.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, 28));
        return row;
    }

    private JPanel buildFilterRow() {
        filterChips.setLayout(new FlowLayout(FlowLayout.LEFT, 0, 0));
        filterChips.setOpaque(false);
        filterChips.setBorder(null);
        filterChips.setAlignmentY(Component.CENTER_ALIGNMENT);
        filterButtons.clear();
        filterChips.removeAll();
        JLabel filterLabel = new JLabel("Lọc:");
        filterLabel.setForeground(NAVY);
        filterChips.add(filterLabel);
        filterChips.add(Box.createHorizontalStrut(6));
        StaffFilter[] filters = StaffFilter.values();
        for (int i = 0; i < filters.length; i++) {
            StaffFilter filter = filters[i];
            JToggleButton chip = new JToggleButton(filter.label);
            chip.setFocusPainted(false);
            chip.setRolloverEnabled(false);
            chip.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
            chip.setOpaque(true);
            chip.addActionListener(e -> {
                activeFilter = filter;
                for (JToggleButton b : filterButtons) {
                    b.setSelected(b == chip);
                    styleChip(b, b.isSelected());
                }
                applyStaffFilter();
            });
            styleChip(chip, filter == StaffFilter.UNREGISTERED);
            chip.setSelected(filter == StaffFilter.UNREGISTERED);
            filterButtons.add(chip);
            filterChips.add(chip);
            if (i < filters.length - 1) {
                filterChips.add(Box.createHorizontalStrut(6));
            }
        }

        styleNavyActionButton(btnReloadStaff);
        btnReloadStaff.setAlignmentY(Component.CENTER_ALIGNMENT);

        JPanel row = new JPanel();
        row.setLayout(new BoxLayout(row, BoxLayout.X_AXIS));
        row.setOpaque(false);
        row.setBorder(null);
        row.setAlignmentX(Component.LEFT_ALIGNMENT);
        row.add(filterChips);
        row.add(Box.createHorizontalGlue());
        row.add(btnReloadStaff);
        row.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, 40));
        return row;
    }

    private JPanel buildStaffRow() {
        JPanel col = new JPanel();
        col.setLayout(new BoxLayout(col, BoxLayout.Y_AXIS));
        col.setOpaque(false);
        col.setBorder(null);

        JLabel label = new JLabel("Nhân viên:");
        label.setForeground(MUTED);
        label.setAlignmentX(Component.LEFT_ALIGNMENT);

        staffCombo.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, 32));
        staffCombo.setAlignmentX(Component.LEFT_ALIGNMENT);

        col.add(rowLeft(label, 18));
        col.add(Box.createVerticalStrut(4));
        col.add(rowLeft(staffCombo, 32));
        col.setAlignmentX(Component.LEFT_ALIGNMENT);
        col.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, 56));
        return col;
    }

    private JPanel buildStepper() {
        JPanel steps = new JPanel(new FlowLayout(FlowLayout.CENTER, 0, 0));
        steps.setOpaque(false);
        steps.setBorder(null);
        steps.add(step1);
        steps.add(Box.createHorizontalStrut(12));
        steps.add(connector());
        steps.add(Box.createHorizontalStrut(12));
        steps.add(step2);
        steps.add(Box.createHorizontalStrut(12));
        steps.add(connector());
        steps.add(Box.createHorizontalStrut(12));
        steps.add(step3);

        // SPEC P1.1h — center stepper horizontally in content width
        JPanel row = new JPanel();
        row.setLayout(new BoxLayout(row, BoxLayout.X_AXIS));
        row.setOpaque(false);
        row.setBorder(null);
        row.setAlignmentX(Component.LEFT_ALIGNMENT);
        row.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, 40));
        row.add(Box.createHorizontalGlue());
        row.add(steps);
        row.add(Box.createHorizontalGlue());
        return row;
    }

    private static JLabel connector() {
        JLabel line = new JLabel("—");
        line.setForeground(LINE);
        return line;
    }

    private static JLabel circleStep(String num, String text) {
        JLabel label = new JLabel(num + "  " + text);
        label.setFont(label.getFont().deriveFont(Font.BOLD, 11f));
        label.setBorder(new EmptyBorder(6, 10, 6, 10));
        label.setOpaque(true);
        label.setBackground(Color.WHITE);
        label.setForeground(MUTED);
        return label;
    }

    private JPanel buildScanCard() {
        JPanel card = new JPanel(new BorderLayout(0, 10));
        card.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.setBackground(Color.WHITE);
        card.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(LINE, 1, true),
                new EmptyBorder(12, 12, 12, 12)));
        card.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, SCAN_CARD_MAX_HEIGHT));
        card.setPreferredSize(new Dimension(CONTENT_MAX_WIDTH, 320));

        bannerLabel.setOpaque(true);
        bannerLabel.setBackground(PRIMARY_LIGHT);
        bannerLabel.setForeground(PRIMARY);
        bannerLabel.setBorder(new EmptyBorder(8, 10, 8, 10));
        bannerLabel.setFont(bannerLabel.getFont().deriveFont(12f));

        previewLabel.setPreferredSize(new Dimension(320, 200));
        previewLabel.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, 220));
        previewLabel.setHorizontalAlignment(SwingConstants.CENTER);
        previewLabel.setVerticalAlignment(SwingConstants.CENTER);
        previewLabel.setBorder(BorderFactory.createDashedBorder(LINE, 2, 4, 1, true));
        previewLabel.setText("<html><center>Chờ đặt ngón tay…</center></html>");
        previewLabel.setForeground(MUTED);

        JPanel meta = new JPanel(new BorderLayout(8, 0));
        meta.setOpaque(true);
        meta.setBackground(Color.WHITE);
        empCodeLabel.setFont(empCodeLabel.getFont().deriveFont(Font.BOLD, 13f));
        empCodeLabel.setForeground(MUTED);
        scanBadge.setOpaque(true);
        scanBadge.setBorder(new EmptyBorder(4, 10, 4, 10));
        scanBadge.setFont(scanBadge.getFont().deriveFont(Font.BOLD, 11f));
        meta.add(empCodeLabel, BorderLayout.WEST);
        meta.add(scanBadge, BorderLayout.EAST);
        scanMetaPanel = meta;
        // Attendance: result is single banner line — hide meta (§9.3.1)
        scanMetaPanel.setVisible(false);

        JPanel body = new JPanel(new BorderLayout(0, 8));
        body.setOpaque(true);
        body.setBackground(Color.WHITE);
        body.add(previewLabel, BorderLayout.CENTER);
        body.add(meta, BorderLayout.SOUTH);

        card.add(bannerLabel, BorderLayout.NORTH);
        card.add(body, BorderLayout.CENTER);

        // P1.1j / P2.1b — wrap without infinite max height; stay within content column
        JPanel wrap = rowLeft(card, 0);
        wrap.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, SCAN_CARD_MAX_HEIGHT));
        wrap.setPreferredSize(new Dimension(CONTENT_MAX_WIDTH, Math.min(320, SCAN_CARD_MAX_HEIGHT)));
        return wrap;
    }

    private JPanel buildEnrollActions() {
        // P2.2 — Bắt đầu | Xóa | Hủy
        JPanel row = new JPanel(new GridLayout(1, 3, 8, 0));
        row.setOpaque(false);
        row.setAlignmentX(Component.LEFT_ALIGNMENT);
        row.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, 48));
        row.setPreferredSize(new Dimension(CONTENT_MAX_WIDTH, 44));

        stylePrimaryFull(btnEnroll);
        styleWarningOutline(btnDeleteFp);
        styleDangerSolid(btnCancel);
        row.add(btnEnroll);
        row.add(btnDeleteFp);
        row.add(btnCancel);
        return rowLeft(row, 48);
    }

    private JPanel buildDeviceActions() {
        JPanel secondary = new JPanel(new GridLayout(1, 2, 8, 0));
        secondary.setOpaque(false);
        secondary.setAlignmentX(Component.LEFT_ALIGNMENT);
        secondary.setMaximumSize(new Dimension(CONTENT_MAX_WIDTH, 44));
        secondary.setPreferredSize(new Dimension(CONTENT_MAX_WIDTH, 44));
        styleSecondaryOutline(btnOpen);
        styleSecondaryOutline(btnClose);
        secondary.add(btnOpen);
        secondary.add(btnClose);
        return rowLeft(secondary, 44);
    }

    private static void styleModeSwitchButton(JButton button) {
        button.setRolloverEnabled(false);
        button.setOpaque(true);
        button.setContentAreaFilled(true);
        button.setFocusPainted(false);
        button.setBackground(Color.WHITE);
        button.setForeground(NAVY);
        button.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(NAVY, 1, true),
                new EmptyBorder(4, 10, 4, 10)));
        button.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        button.setFont(button.getFont().deriveFont(Font.BOLD, 11f));
    }

    private static void styleChip(JToggleButton chip, boolean selected) {
        chip.setRolloverEnabled(false);
        chip.setOpaque(true);
        chip.setContentAreaFilled(true);
        chip.setBorderPainted(false);
        if (selected) {
            chip.setBackground(PRIMARY);
            chip.setForeground(Color.WHITE);
        } else {
            chip.setBackground(Color.WHITE);
            chip.setForeground(NAVY);
            chip.setBorder(BorderFactory.createCompoundBorder(
                    new LineBorder(LINE, 1, true),
                    new EmptyBorder(3, 9, 3, 9)));
        }
        if (selected) {
            chip.setBorder(new EmptyBorder(4, 10, 4, 10));
        }
    }

    private static void stylePrimaryFull(JButton button) {
        button.setRolloverEnabled(false);
        button.setOpaque(true);
        button.setContentAreaFilled(true);
        button.setBorderPainted(false);
        button.setFocusPainted(false);
        button.setBackground(PRIMARY);
        button.setForeground(Color.WHITE);
        button.setBorder(new EmptyBorder(12, 16, 12, 16));
        button.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        button.setFont(button.getFont().deriveFont(Font.BOLD, 14f));
    }

    private void applyPrimaryEnabledStyle(boolean enabled) {
        btnEnroll.setEnabled(enabled);
        if (enabled) {
            btnEnroll.setBackground(PRIMARY);
            btnEnroll.setForeground(Color.WHITE);
        } else {
            btnEnroll.setBackground(PRIMARY_DISABLED);
            btnEnroll.setForeground(Color.WHITE);
        }
    }

    private static void styleSecondaryOutline(JButton button) {
        button.setRolloverEnabled(false);
        button.setOpaque(true);
        button.setContentAreaFilled(true);
        button.setFocusPainted(false);
        button.setBackground(Color.WHITE);
        button.setForeground(PRIMARY_HOVER_SAFE);
        button.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(PRIMARY, 1, true),
                new EmptyBorder(8, 10, 8, 10)));
        button.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
    }

    private void applySecondaryEnabledStyle(JButton button, boolean enabled) {
        button.setEnabled(enabled);
        button.setBackground(Color.WHITE);
        button.setForeground(enabled ? PRIMARY_HOVER_SAFE : MUTED);
        button.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(enabled ? PRIMARY : LINE, 1, true),
                new EmptyBorder(8, 10, 8, 10)));
    }

    /** SPEC P1.1f — solid navy action (not a text link). */
    private static void styleNavyActionButton(JButton button) {
        button.setRolloverEnabled(false);
        button.setOpaque(true);
        button.setContentAreaFilled(true);
        button.setBorderPainted(false);
        button.setFocusPainted(false);
        button.setBackground(NAVY);
        button.setForeground(Color.WHITE);
        button.setBorder(new EmptyBorder(8, 12, 8, 12));
        button.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        button.setFont(button.getFont().deriveFont(Font.BOLD, 12f));
    }

    private void applyNavyActionEnabledStyle(JButton button, boolean enabled) {
        button.setEnabled(enabled);
        button.setBackground(enabled ? NAVY : NAVY_SOFT);
        button.setForeground(Color.WHITE);
    }

    /** P2.2 — outline warning for delete fingerprint. */
    private static void styleWarningOutline(JButton button) {
        button.setRolloverEnabled(false);
        button.setOpaque(true);
        button.setContentAreaFilled(true);
        button.setFocusPainted(false);
        button.setBackground(Color.WHITE);
        button.setForeground(WARNING);
        button.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(WARNING, 1, true),
                new EmptyBorder(12, 10, 12, 10)));
        button.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        button.setFont(button.getFont().deriveFont(Font.BOLD, 13f));
    }

    private void applyWarningOutlineEnabledStyle(boolean enabled) {
        btnDeleteFp.setEnabled(enabled);
        btnDeleteFp.setBackground(Color.WHITE);
        btnDeleteFp.setForeground(enabled ? WARNING : MUTED);
        btnDeleteFp.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(enabled ? WARNING : LINE, 1, true),
                new EmptyBorder(12, 10, 12, 10)));
        btnDeleteFp.setCursor(enabled
                ? Cursor.getPredefinedCursor(Cursor.HAND_CURSOR)
                : Cursor.getDefaultCursor());
    }

    /** SPEC P1.1j — danger solid cancel (red fill, white text; no red outline). */
    private static void styleDangerSolid(JButton button) {
        button.setRolloverEnabled(false);
        button.setOpaque(true);
        button.setContentAreaFilled(true);
        button.setBorderPainted(false);
        button.setFocusPainted(false);
        button.setBackground(DANGER);
        button.setForeground(Color.WHITE);
        button.setBorder(new EmptyBorder(12, 16, 12, 16));
        button.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        button.setFont(button.getFont().deriveFont(Font.BOLD, 14f));
    }

    private void applyDangerSolidEnabledStyle(boolean enabled) {
        btnCancel.setEnabled(enabled);
        if (enabled) {
            btnCancel.setBackground(DANGER);
            btnCancel.setForeground(Color.WHITE);
            btnCancel.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        } else {
            btnCancel.setBackground(DANGER_DISABLED);
            btnCancel.setForeground(Color.WHITE);
            btnCancel.setCursor(Cursor.getDefaultCursor());
        }
    }

    private void styleDeviceBadge(boolean connected) {
        if (connected) {
            deviceBadge.setText("Máy: Đã kết nối");
            deviceBadge.setBackground(new Color(0xDEFBE8));
            deviceBadge.setForeground(SUCCESS);
        } else {
            deviceBadge.setText("Máy: Chưa kết nối");
            deviceBadge.setBackground(new Color(0xF3F4F6));
            deviceBadge.setForeground(MUTED);
        }
    }

    private void styleScanBadge(String text, Color fg) {
        scanBadge.setVisible(true);
        scanBadge.setText(text);
        scanBadge.setForeground(fg);
        // Solid background only — alpha causes "Ngắt kết nối" to show through when layouts overlap
        Color bg;
        if (fg.equals(SUCCESS)) {
            bg = new Color(0xDEFBE8);
        } else if (fg.equals(DANGER)) {
            bg = new Color(0xFEF2F2);
        } else if (fg.equals(WARNING)) {
            bg = WARNING_BG;
        } else if (fg.equals(MUTED)) {
            bg = new Color(0xF3F4F6);
        } else {
            bg = PRIMARY_LIGHT;
        }
        scanBadge.setOpaque(true);
        scanBadge.setBackground(bg);
    }

    /** SPEC P1.1g — hide idle badges that duplicate pill Máy / stepper. */
    private void clearScanBadge() {
        scanBadge.setText(" ");
        scanBadge.setVisible(false);
        scanBadge.setOpaque(false);
    }

    private void bootstrapApi() {
        try {
            Path props = Path.of("agent.properties");
            if (!props.toFile().exists()) {
                props = Path.of("fingerprint-agent", "agent.properties");
            }
            if (!props.toFile().exists()) {
                props = Path.of("agent.properties.example");
            }
            loadAgentLocalPreferences(props);
            apiClient = AppApiClient.fromProperties(props);
            AppApiClient.HealthInfo health = apiClient.health();
            deptDisplay = health.departmentDisplay();
            deptLabel.setText("Đơn vị: " + deptDisplay);
            deptLabel.setForeground(NAVY);
            setBanner("Kết nối hệ thống OK. Đơn vị " + deptDisplay + ".", BannerTone.SUCCESS);
            reloadStaff(false);
            if (appMode == AppMode.ATTENDANCE) {
                setBanner("Kết nối hệ thống OK. Đơn vị " + deptDisplay + ". Kết nối thiết bị để Chấm công.", BannerTone.SUCCESS);
            } else {
                setBanner("Kết nối hệ thống OK. Đơn vị " + deptDisplay + ".", BannerTone.SUCCESS);
            }
            if (deviceAutoOpen) {
                scheduleAutoOpenDevice(0);
            }
            startHeartbeatTimer();
        } catch (Exception ex) {
            System.err.println("[FingerprintAgent] bootstrap failed: " + ex);
            setBanner(formatApiErrorBanner("Lỗi kết nối hệ thống", ex), BannerTone.DANGER);
        }
        refreshUiChrome();
    }

    /** SPEC §9.5.2 — periodic Online signal; HTTP on agentIo. */
    private void startHeartbeatTimer() {
        if (!heartbeatEnabled || apiClient == null) {
            return;
        }
        if (heartbeatTimer != null) {
            heartbeatTimer.stop();
        }
        sendHeartbeatAsync();
        heartbeatTimer = new javax.swing.Timer(heartbeatIntervalMs, e -> sendHeartbeatAsync());
        heartbeatTimer.setRepeats(true);
        heartbeatTimer.start();
    }

    private void sendHeartbeatAsync() {
        final AppApiClient client = apiClient;
        if (client == null) {
            return;
        }
        agentIo.execute(() -> {
            try {
                client.heartbeat();
            } catch (IOException ex) {
                System.err.println("[FingerprintAgent] heartbeat failed: " + ex.getMessage());
            }
        });
    }

    /**
     * Loads local Agent prefs from agent.properties — sound (P2.1c), enroll PIN/idle (P2.1d),
     * device auto-open (P4a).
     */
    private void loadAgentLocalPreferences(Path propertiesFile) {
        Properties props = new Properties();
        try {
            if (Files.exists(propertiesFile)) {
                try (InputStream in = Files.newInputStream(propertiesFile)) {
                    props.load(in);
                }
            }
        } catch (IOException ex) {
            System.err.println("[FingerprintAgent] agent.properties load failed: " + ex.getMessage());
        }
        String raw = props.getProperty("sound.enabled", "true").trim();
        boolean on = !("false".equalsIgnoreCase(raw) || "0".equals(raw) || "off".equalsIgnoreCase(raw));
        AgentBeep.setEnabled(on);

        enrollPin = props.getProperty("enroll.pin", "").trim();
        enrollIdleMs = parseIdleSecondsMs(
                props.getProperty("enroll.idleSeconds"),
                DEFAULT_ENROLL_IDLE_SECONDS,
                30,
                3_600);
        pinIdleMs = parseIdleSecondsMs(
                props.getProperty("enroll.pinIdleSeconds"),
                DEFAULT_PIN_IDLE_SECONDS,
                15,
                600);

        String autoRaw = props.getProperty("device.autoOpen", "true").trim();
        deviceAutoOpen = !(
                "false".equalsIgnoreCase(autoRaw)
                        || "0".equals(autoRaw)
                        || "off".equalsIgnoreCase(autoRaw));
        deviceAutoOpenRetries = parseBoundedInt(
                props.getProperty("device.autoOpenRetries"),
                DEFAULT_AUTO_OPEN_RETRIES,
                1,
                10);
        deviceAutoOpenRetryMs = parseBoundedInt(
                props.getProperty("device.autoOpenRetryMs"),
                DEFAULT_AUTO_OPEN_RETRY_MS,
                500,
                15_000);

        String hbRaw = props.getProperty("heartbeat.enabled", "true").trim();
        heartbeatEnabled = !(
                "false".equalsIgnoreCase(hbRaw)
                        || "0".equals(hbRaw)
                        || "off".equalsIgnoreCase(hbRaw));
        int hbSec = parseBoundedInt(props.getProperty("heartbeat.intervalSeconds"), 30, 15, 300);
        heartbeatIntervalMs = hbSec * 1000;
    }

    private static int parseBoundedInt(String raw, int defaultVal, int min, int max) {
        int value = defaultVal;
        if (raw != null && !raw.isBlank()) {
            try {
                value = Integer.parseInt(raw.trim());
            } catch (NumberFormatException ignored) {
                value = defaultVal;
            }
        }
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }

    /**
     * P4a — retry opening ZK9500 after bootstrap without blocking the EDT long.
     *
     * @param attempt zero-based attempt index
     */
    private void scheduleAutoOpenDevice(int attempt) {
        int delayMs = attempt == 0 ? 400 : deviceAutoOpenRetryMs;
        javax.swing.Timer timer = new javax.swing.Timer(delayMs, e -> {
            if (mhDevice != 0) {
                return;
            }
            openDevice();
            if (mhDevice != 0) {
                return;
            }
            int next = attempt + 1;
            if (next < deviceAutoOpenRetries) {
                setBanner(
                        "Chưa mở được ZK9500 — thử lại (" + (next + 1) + "/" + deviceAutoOpenRetries + ")…",
                        BannerTone.WARNING);
                scheduleAutoOpenDevice(next);
            } else {
                setBanner(
                        "Không tự mở được ZK9500. Kiểm tra USB/driver rồi bấm Kết nối thiết bị.",
                        BannerTone.DANGER);
            }
        });
        timer.setRepeats(false);
        timer.start();
    }

    private static long parseIdleSecondsMs(String raw, int defaultSec, int minSec, int maxSec) {
        int idleSec = defaultSec;
        if (raw != null && !raw.isBlank()) {
            try {
                idleSec = Integer.parseInt(raw.trim());
            } catch (NumberFormatException ignored) {
                idleSec = defaultSec;
            }
        }
        if (idleSec < minSec) {
            idleSec = minSec;
        } else if (idleSec > maxSec) {
            idleSec = maxSec;
        }
        return idleSec * 1000L;
    }

    /**
     * Loads in-app logo beside {@link #APP_TITLE} from classpath (SPEC P1.1h).
     * Does not call Web branding APIs.
     */
    private void loadLocalBrandLogo() {
        try (InputStream in = FingerprintAgentApp.class.getResourceAsStream(APP_LOGO_RESOURCE)) {
            if (in == null) {
                return;
            }
            BufferedImage image = ImageIO.read(in);
            if (image == null) {
                return;
            }
            Image scaled = image.getScaledInstance(BRAND_LOGO_SIZE, BRAND_LOGO_SIZE, Image.SCALE_SMOOTH);
            brandLogoLabel.setIcon(new ImageIcon(scaled));
            brandLogoLabel.setBorder(new EmptyBorder(0, 0, 0, 8));
            brandLogoLabel.setVisible(true);
        } catch (Exception ignored) {
            // text-only brand fallback
        }
    }

    /**
     * Loads window title-bar icon (SPEC P1.1h).
     */
    private void loadWindowIcon() {
        try (InputStream in = FingerprintAgentApp.class.getResourceAsStream(WINDOW_ICON_RESOURCE)) {
            if (in == null) {
                return;
            }
            BufferedImage image = ImageIO.read(in);
            if (image == null) {
                return;
            }
            Image scaled = image.getScaledInstance(WINDOW_ICON_SIZE, WINDOW_ICON_SIZE, Image.SCALE_SMOOTH);
            setIconImage(scaled);
        } catch (Exception ignored) {
            // keep default window icon
        }
    }

    private void reloadStaff(boolean showLoadMessage) {
        if (apiClient == null) {
            setBanner("Chưa cấu hình API.", BannerTone.DANGER);
            return;
        }
        if (showLoadMessage) {
            setBanner("Đang tải danh sách nhân viên…", BannerTone.INFO);
        }
        final AppApiClient client = apiClient;
        agentIo.execute(() -> {
            try {
                List<AppApiClient.StaffItem> list = client.listStaff();
                SwingUtilities.invokeLater(() -> {
                    allStaff = list;
                    updateStats();
                    applyStaffFilter();
                    if (showLoadMessage) {
                        setBanner("Đã tải " + allStaff.size() + " nhân viên thuộc đơn vị " + deptDisplay + ".",
                                BannerTone.SUCCESS);
                    }
                    refreshUiChrome();
                });
            } catch (IOException ex) {
                System.err.println("[FingerprintAgent] reloadStaff failed: " + ex);
                SwingUtilities.invokeLater(() -> {
                    setBanner(formatApiErrorBanner("Lỗi tải nhân viên", ex), BannerTone.DANGER);
                    refreshUiChrome();
                });
            }
        });
    }

    /**
     * Maps transport errors to short Vietnamese + error code (SPEC P1.1g §11).
     * Technical detail goes to console only — never raw English on the banner.
     */
    private static String formatApiErrorBanner(String prefix, Exception ex) {
        return prefix + " (mã: " + mapApiErrorCode(ex) + ").";
    }

    private static String mapApiErrorCode(Exception ex) {
        String raw = "";
        Throwable t = ex;
        while (t != null) {
            if (t.getMessage() != null) {
                raw = raw + " " + t.getMessage();
            }
            raw = raw + " " + t.getClass().getSimpleName();
            t = t.getCause();
        }
        String lower = raw.toLowerCase();
        if (lower.contains("timed out") || lower.contains("timeout") || lower.contains("read timed out")) {
            return "E-API-TIMEOUT";
        }
        if (lower.contains("connection refused")
                || lower.contains("getsockopt")
                || lower.contains("connectexception")
                || lower.contains("no route to host")
                || lower.contains("network is unreachable")) {
            return "E-API-CONN";
        }
        if (lower.contains("http ") || lower.contains("HTTP")) {
            return "E-API-HTTP";
        }
        // AppApiClient throws IOException with Vietnamese business message for HTTP >= 400
        if (ex instanceof IOException && ex.getMessage() != null && !ex.getMessage().isBlank()) {
            String msg = ex.getMessage();
            boolean looksEnglishTechnical = msg.matches("(?i).*\\b(connection|refused|timeout|getsockopt|socket|unknown host)\\b.*")
                    || msg.matches("(?i)^HTTP\\s+\\d+.*");
            if (!looksEnglishTechnical && msg.chars().anyMatch(c -> c > 127)) {
                // Vietnamese business message from API — still use code for staff reporting
                return "E-API-HTTP";
            }
            if (looksEnglishTechnical || msg.matches("(?i)^HTTP\\s+\\d+.*")) {
                return "E-API-HTTP";
            }
        }
        return "E-API-UNKNOWN";
    }

    private void updateStats() {
        int total = allStaff.size();
        int registered = 0;
        for (AppApiClient.StaffItem item : allStaff) {
            if (item.fingerprintRegistered()) {
                registered++;
            }
        }
        statsTotal.setText("Tổng: " + total);
        statsRegistered.setText("Đã đăng ký: " + registered);
        statsMissing.setText("Chưa đăng ký: " + (total - registered));
    }

    private void applyStaffFilter() {
        Integer selectedCode = null;
        AppApiClient.StaffItem current = (AppApiClient.StaffItem) staffCombo.getSelectedItem();
        if (current != null) {
            selectedCode = current.empCode();
        }
        staffCombo.removeAllItems();
        AppApiClient.StaffItem reselect = null;
        for (AppApiClient.StaffItem item : allStaff) {
            boolean include = switch (activeFilter) {
                case ALL -> true;
                case UNREGISTERED -> !item.fingerprintRegistered();
                case REGISTERED -> item.fingerprintRegistered();
            };
            if (include) {
                staffCombo.addItem(item);
                if (selectedCode != null && selectedCode == item.empCode()) {
                    reselect = item;
                }
            }
        }
        if (reselect != null) {
            staffCombo.setSelectedItem(reselect);
        }
        refreshScanMeta();
        refreshUiChrome();
    }

    private void refreshScanMeta() {
        if (appMode == AppMode.ATTENDANCE) {
            return;
        }
        AppApiClient.StaffItem staff = (AppApiClient.StaffItem) staffCombo.getSelectedItem();
        if (staff == null) {
            empCodeLabel.setText("MÃ: —");
        } else {
            empCodeLabel.setText("MÃ: " + String.format("%05d", staff.empCode()));
        }
    }

    private void toggleMode() {
        if (appMode == AppMode.ATTENDANCE) {
            if (promptEnrollPin()) {
                switchToEnrollMode();
            }
        } else {
            switchToAttendanceMode();
        }
    }

    /**
     * SPEC §9.3.2 — require local enroll.pin before leaving Chấm công for Enroll.
     * Custom dialog with idle auto-close (not JOptionPane).
     *
     * @return true if PIN accepted
     */
    private boolean promptEnrollPin() {
        if (enrollPin == null || enrollPin.isEmpty()) {
            JOptionPane.showMessageDialog(
                    this,
                    "Chưa cấu hình enroll.pin trong agent.properties.\nLiên hệ Admin/ops để đặt PIN đăng ký.",
                    "Không vào được Đăng ký",
                    JOptionPane.WARNING_MESSAGE);
            setBanner("Chưa cấu hình enroll.pin — không vào Đăng ký.", BannerTone.WARNING);
            return false;
        }
        int outcome = showEnrollPinDialog();
        if (outcome == 1) {
            return true;
        }
        if (outcome == 2) {
            setBanner("Hết thời gian nhập PIN — vẫn ở Chấm công.", BannerTone.WARNING);
            return false;
        }
        setBanner("Đã hủy — vẫn ở Chấm công.", BannerTone.INFO);
        return false;
    }

    /**
     * Modal PIN dialog with idle timeout.
     *
     * @return 1 = accepted, 0 = cancelled, 2 = timed out
     */
    private int showEnrollPinDialog() {
        final int[] outcome = {0};
        final long[] lastActMs = {System.currentTimeMillis()};

        JDialog dialog = new JDialog(this, "Xác nhận Đăng ký", true);
        dialog.setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
        dialog.setResizable(false);

        JPasswordField field = new JPasswordField(14);
        JLabel hint = new JLabel("Nhập PIN đăng ký vân tay (ops/trưởng khoa):");
        JLabel idleHint = new JLabel("Tự đóng nếu không thao tác trong "
                + (pinIdleMs / 1000) + " giây.");
        idleHint.setFont(idleHint.getFont().deriveFont(11f));
        idleHint.setForeground(MUTED);

        JPanel body = new JPanel();
        body.setLayout(new BoxLayout(body, BoxLayout.Y_AXIS));
        body.setBorder(new EmptyBorder(14, 16, 8, 16));
        hint.setAlignmentX(Component.LEFT_ALIGNMENT);
        field.setAlignmentX(Component.LEFT_ALIGNMENT);
        field.setMaximumSize(new Dimension(Integer.MAX_VALUE, 28));
        idleHint.setAlignmentX(Component.LEFT_ALIGNMENT);
        body.add(hint);
        body.add(Box.createVerticalStrut(8));
        body.add(field);
        body.add(Box.createVerticalStrut(8));
        body.add(idleHint);

        JButton ok = new JButton("OK");
        JButton cancel = new JButton("Cancel");
        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        buttons.setBorder(new EmptyBorder(0, 12, 12, 12));
        buttons.add(ok);
        buttons.add(cancel);

        Runnable touch = () -> lastActMs[0] = System.currentTimeMillis();

        javax.swing.Timer pinIdleTimer = new javax.swing.Timer(400, e -> {
            if (!dialog.isDisplayable()) {
                return;
            }
            if (System.currentTimeMillis() - lastActMs[0] >= pinIdleMs) {
                outcome[0] = 2;
                dialog.dispose();
            }
        });
        pinIdleTimer.setRepeats(true);

        ok.addActionListener(e -> {
            touch.run();
            char[] entered = field.getPassword();
            String typed = new String(entered);
            java.util.Arrays.fill(entered, '\0');
            if (!enrollPin.equals(typed)) {
                setBanner("PIN không đúng — vẫn ở Chấm công.", BannerTone.WARNING);
                JOptionPane.showMessageDialog(dialog, "PIN không đúng.", "Từ chối", JOptionPane.ERROR_MESSAGE);
                field.setText("");
                field.requestFocusInWindow();
                touch.run();
                return;
            }
            outcome[0] = 1;
            dialog.dispose();
        });
        cancel.addActionListener(e -> {
            outcome[0] = 0;
            dialog.dispose();
        });
        field.addActionListener(e -> ok.doClick());

        java.awt.event.KeyAdapter keyTouch = new java.awt.event.KeyAdapter() {
            @Override
            public void keyPressed(java.awt.event.KeyEvent e) {
                touch.run();
            }
        };
        java.awt.event.MouseAdapter mouseTouch = new java.awt.event.MouseAdapter() {
            @Override
            public void mousePressed(java.awt.event.MouseEvent e) {
                touch.run();
            }

            @Override
            public void mouseMoved(java.awt.event.MouseEvent e) {
                touch.run();
            }
        };
        field.addKeyListener(keyTouch);
        dialog.addKeyListener(keyTouch);
        dialog.addMouseListener(mouseTouch);
        dialog.addMouseMotionListener(mouseTouch);
        body.addMouseListener(mouseTouch);
        body.addMouseMotionListener(mouseTouch);

        dialog.addWindowListener(new java.awt.event.WindowAdapter() {
            @Override
            public void windowClosed(java.awt.event.WindowEvent e) {
                pinIdleTimer.stop();
            }
        });

        dialog.getContentPane().setLayout(new BorderLayout());
        dialog.getContentPane().add(body, BorderLayout.CENTER);
        dialog.getContentPane().add(buttons, BorderLayout.SOUTH);
        dialog.pack();
        dialog.setLocationRelativeTo(this);
        pinIdleTimer.start();
        SwingUtilities.invokeLater(field::requestFocusInWindow);
        dialog.setVisible(true);
        pinIdleTimer.stop();
        return outcome[0];
    }

    private void switchToEnrollMode() {
        appMode = AppMode.ENROLL;
        touchEnrollActivity();
        resetPreviewEmpty();
        applyModeUi();
        if (mhDB != 0) {
            FingerprintSensorEx.DBClear(mhDB);
            fidToTemplate.clear();
        }
        setBanner("Mode đăng ký. Chọn nhân viên rồi bấm Bắt đầu đăng ký.", BannerTone.INFO);
        refreshScanMeta();
        refreshUiChrome();
    }

    private void switchToAttendanceMode() {
        if (registering) {
            cancelEnroll();
        }
        justCompleted = false;
        appMode = AppMode.ATTENDANCE;
        resetPreviewEmpty();
        applyModeUi();
        empCodeLabel.setText("—");
        clearScanBadge();
        if (mhDevice != 0 && mhDB != 0) {
            reloadIdentifyTemplates(true);
        } else {
            setBanner("Mode Chấm công. Kết nối thiết bị để chờ quét.", BannerTone.INFO);
        }
        refreshUiChrome();
    }

    private void applyModeUi() {
        boolean enroll = appMode == AppMode.ENROLL;
        setTitle(enroll ? WINDOW_TITLE_ENROLL : WINDOW_TITLE_ATTENDANCE);
        brandTitleLabel.setText(enroll ? APP_TITLE : APP_TITLE_ATTENDANCE);
        btnModeSwitch.setText(enroll ? "Chấm công" : "Đăng ký vân tay");
        if (statsRow != null) {
            statsRow.setVisible(enroll);
        }
        if (filterRow != null) {
            filterRow.setVisible(enroll);
        }
        if (staffRow != null) {
            staffRow.setVisible(enroll);
        }
        if (stepperRow != null) {
            stepperRow.setVisible(enroll);
        }
        if (enrollActionsRow != null) {
            enrollActionsRow.setVisible(enroll);
        }
        if (scanMetaPanel != null) {
            scanMetaPanel.setVisible(enroll);
        }
        revalidate();
        repaint();
    }

    private void refreshUiChrome() {
        boolean connected = mhDevice != 0;
        boolean enroll = appMode == AppMode.ENROLL;

        styleDeviceBadge(connected);

        boolean canEnroll = enroll && connected && !registering && staffCombo.getSelectedItem() != null
                && !enrollApiInFlight.get();
        applyPrimaryEnabledStyle(canEnroll);
        AppApiClient.StaffItem selected = (AppApiClient.StaffItem) staffCombo.getSelectedItem();
        boolean canDelete = enroll && !registering && selected != null && selected.fingerprintRegistered()
                && !enrollApiInFlight.get();
        btnDeleteFp.setVisible(enroll);
        applyWarningOutlineEnabledStyle(canDelete);
        // P1.1i: Hủy always visible in enroll mode; enable only while registering
        btnCancel.setVisible(enroll);
        applyDangerSolidEnabledStyle(enroll && registering);
        applyNavyActionEnabledStyle(btnReloadStaff, !registering && !enrollApiInFlight.get());
        applySecondaryEnabledStyle(btnClose, connected && !registering && !deviceOpInFlight.get());
        applySecondaryEnabledStyle(btnOpen, !connected && !deviceOpInFlight.get());
        boolean showDeviceBtns = !registering;
        btnClose.setVisible(showDeviceBtns);
        btnOpen.setVisible(showDeviceBtns);
        btnModeSwitch.setEnabled(!registering && !enrollApiInFlight.get());

        // Stepper — P1.1c: keep step 3 until new enroll or disconnect
        highlightStep(step1, !connected && !justCompleted);
        highlightStep(step2, connected && !justCompleted);
        highlightStep(step3, justCompleted);

        if (enroll) {
            if (registering) {
                styleScanBadge("ĐANG QUÉT (" + enrollIdx + "/" + ENROLL_COUNT + ")", PRIMARY);
            } else if (justCompleted) {
                styleScanBadge("THÀNH CÔNG", SUCCESS);
            } else {
                clearScanBadge();
            }
        }
    }

    private static void highlightStep(JLabel step, boolean active) {
        if (active) {
            step.setBackground(PRIMARY_LIGHT);
            step.setForeground(PRIMARY);
        } else {
            step.setBackground(Color.WHITE);
            step.setForeground(MUTED);
        }
    }

    private void openDevice() {
        if (mhDevice != 0) {
            setBanner("Thiết bị đang kết nối.", BannerTone.INFO);
            return;
        }
        if (!deviceOpInFlight.compareAndSet(false, true)) {
            setBanner("Đang thao tác thiết bị — chờ giây lát.", BannerTone.INFO);
            return;
        }
        enrollIdx = 0;
        registering = false;
        justCompleted = false;
        setBanner("Đang kết nối thiết bị…", BannerTone.INFO);
        refreshUiChrome();

        agentIo.execute(() -> {
            String error = null;
            String badgeText = null;
            long device = 0;
            long db = 0;
            int width = 0;
            int height = 0;
            try {
                if (FingerprintSensorErrorCode.ZKFP_ERR_OK != FingerprintSensorEx.Init()) {
                    error = "Khởi tạo SDK thất bại.";
                    badgeText = "Máy: Lỗi khởi tạo";
                } else {
                    int count = FingerprintSensorEx.GetDeviceCount();
                    if (count < 0) {
                        FingerprintSensorEx.Terminate();
                        error = "Không tìm thấy ZK9500. Kiểm tra USB/driver.";
                        badgeText = "Máy: Không tìm thấy";
                    } else {
                        device = FingerprintSensorEx.OpenDevice(0);
                        if (device == 0) {
                            FingerprintSensorEx.Terminate();
                            error = "Không mở được thiết bị ZK9500.";
                            badgeText = "Máy: Không mở được";
                        } else {
                            db = FingerprintSensorEx.DBInit();
                            if (db == 0) {
                                FingerprintSensorEx.CloseDevice(device);
                                FingerprintSensorEx.Terminate();
                                device = 0;
                                error = "Khởi tạo DB vân tay trên máy thất bại.";
                                badgeText = "Máy: Lỗi DB";
                            } else {
                                byte[] paramValue = new byte[4];
                                int[] size = new int[]{4};
                                FingerprintSensorEx.GetParameters(device, 1, paramValue, size);
                                width = byteArrayToInt(paramValue);
                                size[0] = 4;
                                FingerprintSensorEx.GetParameters(device, 2, paramValue, size);
                                height = byteArrayToInt(paramValue);
                            }
                        }
                    }
                }
            } catch (Throwable t) {
                System.err.println("[FingerprintAgent] openDevice failed: " + t);
                error = "Lỗi kết nối thiết bị.";
                badgeText = "Máy: Lỗi";
                if (db != 0) {
                    FingerprintSensorEx.DBFree(db);
                    db = 0;
                }
                if (device != 0) {
                    FingerprintSensorEx.CloseDevice(device);
                    device = 0;
                    FingerprintSensorEx.Terminate();
                }
            }

            final String errFinal = error;
            final String badgeFinal = badgeText;
            final long deviceFinal = device;
            final long dbFinal = db;
            final int widthFinal = width;
            final int heightFinal = height;
            SwingUtilities.invokeLater(() -> {
                try {
                    if (errFinal != null) {
                        mhDevice = 0;
                        mhDB = 0;
                        if (badgeFinal != null) {
                            deviceBadge.setText(badgeFinal);
                        }
                        styleDeviceBadge(false);
                        setBanner(errFinal, BannerTone.DANGER);
                        return;
                    }
                    mhDevice = deviceFinal;
                    mhDB = dbFinal;
                    fpWidth = widthFinal;
                    fpHeight = heightFinal;
                    imgbuf = new byte[fpWidth * fpHeight];
                    mbStop = false;
                    workThread = new WorkThread();
                    workThread.start();
                    resetPreviewEmpty();
                    if (appMode == AppMode.ATTENDANCE) {
                        reloadIdentifyTemplates(true);
                    } else {
                        setBanner("Thiết bị đã kết nối. Chọn nhân viên rồi bấm Bắt đầu đăng ký.", BannerTone.SUCCESS);
                    }
                } finally {
                    deviceOpInFlight.set(false);
                    refreshUiChrome();
                }
            });
        });
    }

    private void closeDevice() {
        if (registering) {
            cancelEnroll();
        }
        if (!deviceOpInFlight.compareAndSet(false, true)) {
            setBanner("Đang thao tác thiết bị — chờ giây lát.", BannerTone.INFO);
            return;
        }
        mbStop = true;
        registering = false;
        justCompleted = false;
        setBanner("Đang ngắt kết nối thiết bị…", BannerTone.INFO);
        refreshUiChrome();

        final long dbToFree = mhDB;
        final long deviceToClose = mhDevice;
        mhDB = 0;
        mhDevice = 0;
        fidToTemplate.clear();

        Runnable release = () -> {
            try {
                Thread.sleep(200);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
            if (dbToFree != 0) {
                FingerprintSensorEx.DBFree(dbToFree);
            }
            if (deviceToClose != 0) {
                FingerprintSensorEx.CloseDevice(deviceToClose);
            }
            FingerprintSensorEx.Terminate();
        };

        if (SwingUtilities.isEventDispatchThread()) {
            agentIo.execute(() -> {
                release.run();
                SwingUtilities.invokeLater(() -> {
                    deviceOpInFlight.set(false);
                    resetPreviewEmpty();
                    setBanner("Đã ngắt kết nối thiết bị.", BannerTone.WARNING);
                    refreshUiChrome();
                });
            });
        } else {
            release.run();
            SwingUtilities.invokeLater(() -> {
                deviceOpInFlight.set(false);
                resetPreviewEmpty();
                setBanner("Đã ngắt kết nối thiết bị.", BannerTone.WARNING);
                refreshUiChrome();
            });
        }
    }

    private void startEnroll() {
        if (appMode != AppMode.ENROLL) {
            setBanner("Vào Đăng ký vân tay (cần PIN) trước khi bắt đầu.", BannerTone.WARNING);
            return;
        }
        touchEnrollActivity();
        AppApiClient.StaffItem staff = (AppApiClient.StaffItem) staffCombo.getSelectedItem();
        if (staff == null) {
            setBanner("Chọn nhân viên trước khi đăng ký.", BannerTone.WARNING);
            return;
        }
        if (mhDevice == 0) {
            setBanner("Kết nối thiết bị trước.", BannerTone.WARNING);
            return;
        }
        // P2.2 R1 — confirm overwrite when already registered
        if (staff.fingerprintRegistered()) {
            String labelPart = (staff.fingerLabel() != null && !staff.fingerLabel().isBlank())
                    ? " — " + staff.fingerLabel()
                    : "";
            String msg = "Nhân viên đã có vân tay" + labelPart + ". Đăng ký lại sẽ ghi đè mẫu cũ. Tiếp tục?";
            int confirm = JOptionPane.showConfirmDialog(
                    this,
                    msg,
                    "Ghi đè vân tay",
                    JOptionPane.YES_NO_OPTION,
                    JOptionPane.WARNING_MESSAGE);
            if (confirm != JOptionPane.YES_OPTION) {
                setBanner("Đã hủy ghi đè vân tay.", BannerTone.WARNING);
                return;
            }
        }
        enrollIdx = 0;
        registering = true;
        justCompleted = false;
        resetPreviewEmpty();
        setBanner("Đăng ký cho " + staff.fullname() + " — đặt ngón tay lên máy (lần 1/" + ENROLL_COUNT + ").", BannerTone.INFO);
        refreshUiChrome();
    }

    private void deleteFingerprint() {
        if (appMode != AppMode.ENROLL || registering) {
            return;
        }
        touchEnrollActivity();
        AppApiClient.StaffItem staff = (AppApiClient.StaffItem) staffCombo.getSelectedItem();
        if (staff == null || !staff.fingerprintRegistered()) {
            setBanner("Chọn nhân viên đã đăng ký vân tay để xóa.", BannerTone.WARNING);
            return;
        }
        int confirm = JOptionPane.showConfirmDialog(
                this,
                "Xóa vân tay của " + staff.fullname() + "? Thao tác không thể hoàn tác trên máy này.",
                "Xóa vân tay",
                JOptionPane.YES_NO_OPTION,
                JOptionPane.WARNING_MESSAGE);
        if (confirm != JOptionPane.YES_OPTION) {
            return;
        }
        if (apiClient == null) {
            setBanner("Chưa cấu hình API.", BannerTone.DANGER);
            return;
        }
        if (!enrollApiInFlight.compareAndSet(false, true)) {
            setBanner("Đang gửi yêu cầu trước — chờ giây lát.", BannerTone.WARNING);
            return;
        }
        setBanner("Đang xóa vân tay…", BannerTone.INFO);
        refreshUiChrome();
        final AppApiClient client = apiClient;
        final int empCode = staff.empCode();
        final String fullname = staff.fullname();
        agentIo.execute(() -> {
            try {
                client.deleteFingerprint(empCode);
                SwingUtilities.invokeLater(() -> {
                    enrollApiInFlight.set(false);
                    reloadStaff(false);
                    if (mhDevice != 0) {
                        reloadIdentifyTemplates(false);
                    }
                    String ok = "Đã xóa vân tay của " + fullname + ".";
                    setBanner(ok, BannerTone.SUCCESS);
                    JOptionPane.showMessageDialog(this, ok, "Xóa thành công", JOptionPane.INFORMATION_MESSAGE);
                    refreshUiChrome();
                });
            } catch (IOException ex) {
                System.err.println("[FingerprintAgent] delete fingerprint failed: " + ex);
                SwingUtilities.invokeLater(() -> {
                    enrollApiInFlight.set(false);
                    String fail = "Không xóa được vân tay (mã: " + mapApiErrorCode(ex) + ").";
                    setBanner(fail, BannerTone.DANGER);
                    JOptionPane.showMessageDialog(this, fail, "Lỗi xóa vân tay", JOptionPane.ERROR_MESSAGE);
                    refreshUiChrome();
                });
            }
        });
    }

    /**
     * Prompts for mandatory finger label after DBMerge (P2.2).
     *
     * @return trimmed label, or {@code null} if cancelled / blank
     */
    private String promptFingerLabel() {
        while (true) {
            String input = (String) JOptionPane.showInputDialog(
                    this,
                    "Nhập ghi chú ngón tay (bắt buộc), ví dụ: Ngón cái tay phải",
                    "Ghi chú ngón tay",
                    JOptionPane.QUESTION_MESSAGE,
                    null,
                    null,
                    "");
            if (input == null) {
                return null;
            }
            String trimmed = input.trim();
            if (trimmed.isEmpty()) {
                JOptionPane.showMessageDialog(
                        this,
                        "Vui lòng nhập ghi chú ngón tay (ví dụ: Ngón cái tay phải).",
                        "Thiếu ghi chú",
                        JOptionPane.WARNING_MESSAGE);
                continue;
            }
            if (trimmed.length() > 100) {
                JOptionPane.showMessageDialog(
                        this,
                        "Ghi chú ngón tay tối đa 100 ký tự.",
                        "Ghi chú quá dài",
                        JOptionPane.WARNING_MESSAGE);
                continue;
            }
            return trimmed;
        }
    }

    private void cancelEnroll() {
        touchEnrollActivity();
        registering = false;
        enrollIdx = 0;
        justCompleted = false;
        resetPreviewEmpty();
        setBanner("Đã hủy đăng ký.", BannerTone.WARNING);
        refreshUiChrome();
    }

    private void resetPreviewEmpty() {
        previewLabel.setIcon(null);
        previewLabel.setText("<html><center>Chờ đặt ngón tay…</center></html>");
    }

    private void onCapture(byte[] img) {
        // SPEC P1.1i — Enroll idle: no fingerprint preview; warn once per debounce window
        if (appMode == AppMode.ENROLL && !registering) {
            previewLabel.setIcon(null);
            previewLabel.setText("<html><center>Chờ đặt ngón tay…</center></html>");
            long now = System.currentTimeMillis();
            if (now - lastEnrollIdleWarnMs >= ENROLL_IDLE_WARN_MS) {
                lastEnrollIdleWarnMs = now;
                setBanner("Chưa nhấn Bắt đầu đăng ký. Chọn nhân viên rồi bấm Bắt đầu đăng ký trước khi quét.", BannerTone.WARNING);
            }
            return;
        }
        try {
            BufferedImage image = fingerprintBufferToImage(img, fpWidth, fpHeight);
            previewLabel.setText("");
            previewLabel.setIcon(new ImageIcon(image.getScaledInstance(
                    Math.min(240, fpWidth), Math.min(180, fpHeight), Image.SCALE_SMOOTH)));
        } catch (RuntimeException ignored) {
            // preview optional — never fail attendance/enroll because of image
        }
    }

    /** SPEC §9.3.3 P4c — gray buffer → image without writing fingerprint.bmp to CWD. */
    private static BufferedImage fingerprintBufferToImage(byte[] imageBuf, int nWidth, int nHeight) {
        BufferedImage image = new BufferedImage(nWidth, nHeight, BufferedImage.TYPE_BYTE_GRAY);
        byte[] raster = ((DataBufferByte) image.getRaster().getDataBuffer()).getData();
        int copy = Math.min(raster.length, imageBuf.length);
        System.arraycopy(imageBuf, 0, raster, 0, copy);
        return image;
    }

    /**
     * Loads active department templates into SDK DB for Identify (SPEC §9.3 / §9.3.3).
     * HTTP on worker; SDK DBAdd on EDT to avoid racing WorkThread Identify.
     */
    private void reloadIdentifyTemplates(boolean showBanner) {
        if (mhDB == 0) {
            return;
        }
        if (apiClient == null) {
            if (showBanner) {
                setBanner("Chưa cấu hình API — không tải được mẫu vân tay.", BannerTone.DANGER);
            }
            return;
        }
        if (showBanner) {
            setBanner("Đang nạp mẫu vân tay…", BannerTone.INFO);
        }
        final AppApiClient client = apiClient;
        final long dbHandle = mhDB;
        agentIo.execute(() -> {
            try {
                List<AppApiClient.TemplateItem> templates = client.listTemplates();
                SwingUtilities.invokeLater(() -> applyTemplatesToSdk(dbHandle, templates, showBanner));
            } catch (IOException ex) {
                System.err.println("[FingerprintAgent] listTemplates failed: " + ex);
                if (showBanner) {
                    SwingUtilities.invokeLater(() ->
                            setBanner(formatApiErrorBanner("Không tải được mẫu vân tay", ex), BannerTone.DANGER));
                }
            }
        });
    }

    private void applyTemplatesToSdk(long dbHandle, List<AppApiClient.TemplateItem> templates, boolean showBanner) {
        if (mhDB == 0 || mhDB != dbHandle) {
            return;
        }
        fidToTemplate.clear();
        FingerprintSensorEx.DBClear(mhDB);
        int total = templates.size();
        int loaded = 0;
        int skipped = 0;
        for (AppApiClient.TemplateItem item : templates) {
            int fid = item.empCode();
            byte[] blob = new byte[2048];
            int decoded = FingerprintSensorEx.Base64ToBlob(item.templateBase64(), blob, 2048);
            if (decoded <= 0) {
                skipped++;
                System.err.println("[FingerprintAgent] Base64ToBlob fail emp=" + fid);
                continue;
            }
            FingerprintSensorEx.DBDel(mhDB, fid);
            int ret = FingerprintSensorEx.DBAdd(mhDB, fid, blob);
            if (ret == 0) {
                fidToTemplate.put(fid, item);
                loaded++;
            } else {
                skipped++;
                System.err.println("[FingerprintAgent] DBAdd fail emp=" + fid + " ret=" + ret);
            }
        }
        if (showBanner) {
            if (total == 0) {
                setBanner("Chưa có mẫu vân tay trong khoa. Chuyển sang Đăng ký để enroll.", BannerTone.WARNING);
            } else if (loaded < total) {
                setBanner("Đã nạp " + loaded + "/" + total + " mẫu (thiếu " + skipped
                        + "). Chờ đặt ngón tay…", BannerTone.WARNING);
            } else {
                setBanner("Đã nạp " + loaded + "/" + total + " mẫu. Chờ đặt ngón tay…", BannerTone.SUCCESS);
            }
        }
    }

    private void onIdentify(byte[] tpl) {
        if (mhDB == 0 || appMode != AppMode.ATTENDANCE || registering) {
            return;
        }
        int[] fid = new int[1];
        int[] score = new int[1];
        int ret = FingerprintSensorEx.DBIdentify(mhDB, tpl, fid, score);
        if (ret != 0) {
            clearAttendanceMeta();
            setBanner("Không nhận diện được. Thử lại hoặc đăng ký lại vân tay.", BannerTone.WARNING);
            AgentBeep.failure();
            return;
        }
        AppApiClient.TemplateItem matched = fidToTemplate.get(fid[0]);
        if (matched == null) {
            clearAttendanceMeta();
            setBanner("Nhận diện được nhưng không khớp danh sách khoa. Tải lại mẫu hoặc đăng ký lại.", BannerTone.DANGER);
            AgentBeep.failure();
            return;
        }
        long now = System.currentTimeMillis();
        Long last = lastScanPostMs.get(matched.empCode());
        if (last != null && now - last < SCAN_DEBOUNCE_MS) {
            setBanner("Vừa ghi nhận " + matched.fullname() + " — chờ giây lát rồi quét lại.", BannerTone.WARNING);
            return;
        }
        String code = String.format("%05d", matched.empCode());
        if (apiClient == null) {
            clearAttendanceMeta();
            setBanner(code + " - " + matched.fullname() + " - LỖI", BannerTone.DANGER);
            AgentBeep.failure();
            return;
        }
        // SPEC §9.3.3 — in-flight gate + stamp before POST; HTTP off EDT
        if (!scanInFlight.compareAndSet(false, true)) {
            setBanner("Đang xử lý quét trước — chờ giây lát.", BannerTone.WARNING);
            return;
        }
        lastScanPostMs.put(matched.empCode(), now);
        final int empCode = matched.empCode();
        final int matchScore = score[0];
        final String name = matched.fullname();
        agentIo.execute(() -> {
            try {
                AppApiClient.ScanResult result = apiClient.scan(empCode, matchScore);
                SwingUtilities.invokeLater(() -> showAttendanceResult(result));
            } catch (IOException ex) {
                System.err.println("[FingerprintAgent] scan API failed: " + ex);
                SwingUtilities.invokeLater(() -> {
                    clearAttendanceMeta();
                    String failDetail = ex.getMessage();
                    if (failDetail != null && !failDetail.isBlank() && !failDetail.startsWith("HTTP")) {
                        setBanner(code + " - " + name + " - LỖI — " + truncateBannerMessage(failDetail.trim()),
                                BannerTone.DANGER);
                    } else {
                        setBanner(code + " - " + name + " - LỖI", BannerTone.DANGER);
                    }
                    AgentBeep.failure();
                });
            } finally {
                scanInFlight.set(false);
            }
        });
    }

    /** SPEC §9.3.1 — attendance result is banner-only; no under-preview meta. */
    private void clearAttendanceMeta() {
        empCodeLabel.setText("—");
        clearScanBadge();
    }

    private void showAttendanceResult(AppApiClient.ScanResult result) {
        clearAttendanceMeta();
        String code = result.empCodeFormatted() != null && !result.empCodeFormatted().isBlank()
                ? result.empCodeFormatted()
                : String.format("%05d", result.empCode());
        String name = result.fullname() != null ? result.fullname() : "—";
        String dir = result.direction() != null ? result.direction() : "";
        String statusText;
        BannerTone tone;
        if ("IN".equals(dir)) {
            statusText = "VÀO THÀNH CÔNG";
            tone = BannerTone.SUCCESS;
        } else if ("OUT".equals(dir)) {
            // SPEC §9.3.1 — OUT-only (no presence status) is incomplete
            boolean outOnly = result.status() == null || result.status().isBlank();
            if (outOnly) {
                statusText = "RA — CHƯA CÓ GIỜ VÀO";
                tone = BannerTone.WARNING;
            } else {
                statusText = "RA THÀNH CÔNG";
                tone = BannerTone.SUCCESS;
            }
        } else if ("REJECTED".equals(dir)) {
            // B1 / P4a — surface server reject reason on one banner line
            String msg = result.message() != null ? result.message().trim() : "";
            if (!msg.isEmpty()) {
                statusText = "TỪ CHỐI — " + truncateBannerMessage(msg);
            } else {
                statusText = "TỪ CHỐI";
            }
            tone = BannerTone.WARNING;
        } else {
            statusText = dir.isBlank() ? "LỖI" : dir;
            tone = BannerTone.DANGER;
        }
        setBanner(code + " - " + name + " - " + statusText, tone);
        if ("REJECTED".equals(dir) || tone == BannerTone.WARNING) {
            AgentBeep.failure();
        } else if ("IN".equals(dir) || "OUT".equals(dir)) {
            AgentBeep.success();
        } else {
            AgentBeep.failure();
        }
    }

    private static String truncateBannerMessage(String message) {
        if (message.length() <= REJECTED_MESSAGE_MAX_LEN) {
            return message;
        }
        return message.substring(0, REJECTED_MESSAGE_MAX_LEN - 1) + "…";
    }

    private void onExtractOk(byte[] tpl, int len) {
        if (appMode == AppMode.ATTENDANCE) {
            onIdentify(tpl);
            return;
        }
        if (!registering) {
            return;
        }
        touchEnrollActivity();
        AppApiClient.StaffItem staff = (AppApiClient.StaffItem) staffCombo.getSelectedItem();
        if (staff == null) {
            cancelEnroll();
            return;
        }
        if (enrollIdx > 0) {
            int match = FingerprintSensorEx.DBMatch(mhDB, regTempArray[enrollIdx - 1], tpl);
            if (match <= 0) {
                setBanner("Vui lòng dùng cùng ngón tay đã quét trước đó.", BannerTone.WARNING);
                styleScanBadge("LỖI", DANGER);
                return;
            }
        }
        System.arraycopy(tpl, 0, regTempArray[enrollIdx], 0, 2048);
        enrollIdx++;
        refreshUiChrome();
        if (enrollIdx < ENROLL_COUNT) {
            setBanner("Cần quét cùng một ngón lần nữa (" + enrollIdx + "/" + ENROLL_COUNT + ").", BannerTone.INFO);
            return;
        }

        int[] retLen = new int[]{2048};
        byte[] regTemp = new byte[2048];
        int ret = FingerprintSensorEx.DBMerge(mhDB, regTempArray[0], regTempArray[1], regTempArray[2], regTemp, retLen);
        if (ret != 0) {
            setBanner("Đăng ký thất bại (DBMerge, mã SDK: " + ret + ").", BannerTone.DANGER);
            styleScanBadge("LỖI", DANGER);
            cancelEnroll();
            return;
        }
        int empCode = staff.empCode();
        // P2.1a: SDK FID = empCode (never local nextFid counter)
        int fid = empCode;
        FingerprintSensorEx.DBDel(mhDB, fid);
        ret = FingerprintSensorEx.DBAdd(mhDB, fid, regTemp);
        if (ret != 0) {
            setBanner("Đăng ký thất bại (DBAdd, mã SDK: " + ret + ").", BannerTone.DANGER);
            styleScanBadge("LỖI", DANGER);
            cancelEnroll();
            return;
        }
        String base64 = FingerprintSensorEx.BlobToBase64(regTemp, retLen[0]);
        registering = false;
        String fullname = staff.fullname();
        String fingerLabel = promptFingerLabel();
        if (fingerLabel == null) {
            enrollIdx = 0;
            justCompleted = false;
            setBanner("Đã hủy — chưa lưu vân tay (thiếu ghi chú ngón).", BannerTone.WARNING);
            refreshUiChrome();
            return;
        }
        if (apiClient == null) {
            setBanner("Chưa cấu hình API.", BannerTone.DANGER);
            refreshUiChrome();
            return;
        }
        if (!enrollApiInFlight.compareAndSet(false, true)) {
            setBanner("Đang gửi yêu cầu trước — chờ giây lát.", BannerTone.WARNING);
            refreshUiChrome();
            return;
        }
        setBanner("Đang lưu vân tay lên hệ thống…", BannerTone.INFO);
        refreshUiChrome();
        final AppApiClient client = apiClient;
        final int templateLenSaved = retLen[0];
        final String labelSaved = fingerLabel;
        agentIo.execute(() -> {
            try {
                client.enroll(empCode, base64, templateLenSaved, fid, labelSaved);
                SwingUtilities.invokeLater(() -> {
                    enrollApiInFlight.set(false);
                    reloadStaff(false);
                    justCompleted = true;
                    String success = "Đăng ký thành công vân tay cho nhân viên " + fullname + ".";
                    setBanner(success, BannerTone.SUCCESS);
                    JOptionPane.showMessageDialog(
                            this,
                            success,
                            "Đăng ký thành công",
                            JOptionPane.INFORMATION_MESSAGE);
                    // P1.1c: keep step 3 HOÀN TẤT after dialog
                    refreshUiChrome();
                });
            } catch (IOException ex) {
                System.err.println("[FingerprintAgent] enroll API failed: " + ex);
                SwingUtilities.invokeLater(() -> {
                    enrollApiInFlight.set(false);
                    styleScanBadge("LỖI", DANGER);
                    String code = mapApiErrorCode(ex);
                    if ("E-API-UNKNOWN".equals(code) || "E-API-HTTP".equals(code)) {
                        code = "E-API-ENROLL";
                    }
                    String fail = "Quét OK nhưng không gửi được lên hệ thống (mã: " + code + ").";
                    setBanner(fail, BannerTone.DANGER);
                    JOptionPane.showMessageDialog(this, fail, "Lỗi lưu vân tay", JOptionPane.ERROR_MESSAGE);
                    refreshUiChrome();
                });
            }
        });
    }

    private void setBanner(String text) {
        setBanner(text, BannerTone.INFO);
    }

    /** SPEC P1.1k — SUCCESS green / WARNING yellow / DANGER red / INFO primary. */
    private void setBanner(String text, BannerTone tone) {
        bannerLabel.setText("<html>" + text.replace("\n", "<br>") + "</html>");
        switch (tone) {
            case SUCCESS -> {
                bannerLabel.setBackground(SUCCESS_BG);
                bannerLabel.setForeground(SUCCESS);
            }
            case WARNING -> {
                bannerLabel.setBackground(WARNING_BG);
                bannerLabel.setForeground(WARNING);
            }
            case DANGER -> {
                bannerLabel.setBackground(DANGER_BG);
                bannerLabel.setForeground(DANGER);
            }
            case INFO -> {
                bannerLabel.setBackground(PRIMARY_LIGHT);
                bannerLabel.setForeground(PRIMARY);
            }
        }
    }

    private static int byteArrayToInt(byte[] bytes) {
        return (bytes[0] & 0xff) | ((bytes[1] & 0xff) << 8) | ((bytes[2] & 0xff) << 16) | ((bytes[3] & 0xff) << 24);
    }

    private class WorkThread extends Thread {
        @Override
        public void run() {
            while (!mbStop) {
                templateLen[0] = 2048;
                int ret = FingerprintSensorEx.AcquireFingerprint(mhDevice, imgbuf, template, templateLen);
                if (ret == 0) {
                    byte[] imgCopy = imgbuf.clone();
                    byte[] tplCopy = template.clone();
                    int lenCopy = templateLen[0];
                    SwingUtilities.invokeLater(() -> {
                        onCapture(imgCopy);
                        onExtractOk(tplCopy, lenCopy);
                    });
                }
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }
}
