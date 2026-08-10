package com.bv87.diemdanh.service;

import com.bv87.diemdanh.config.FingerprintProperties;
import com.bv87.diemdanh.dto.*;
import com.bv87.diemdanh.entity.Employee;
import com.bv87.diemdanh.entity.EmployeeFingerprint;
import com.bv87.diemdanh.entity.FingerprintKioskToken;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.repository.EmployeeFingerprintRepository;
import com.bv87.diemdanh.repository.EmployeeRepository;
import com.bv87.diemdanh.repository.FingerprintKioskTokenRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.security.KioskAuthentication;
import com.bv87.diemdanh.security.KioskTokenFilter;
import com.bv87.diemdanh.util.CodeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * P1 fingerprint enrollment: store templates from kiosk Agent; list status for HEAD/ADMIN web.
 * Template delete/enroll is Agent (kiosk) only — SPEC P2.3.
 */
@Service
@RequiredArgsConstructor
public class FingerprintService implements ApplicationRunner {

    private final EmployeeFingerprintRepository fingerprintRepository;
    private final FingerprintKioskTokenRepository kioskTokenRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final FingerprintProperties fingerprintProperties;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        bootstrapKioskTokens();
    }

    private void bootstrapKioskTokens() {
        List<FingerprintProperties.BootstrapKioskToken> tokens = fingerprintProperties.getBootstrapKioskTokens();
        if (tokens == null || tokens.isEmpty()) {
            return;
        }
        for (FingerprintProperties.BootstrapKioskToken item : tokens) {
            if (item.getDeptCode() == null || !StringUtils.hasText(item.getToken())) {
                continue;
            }
            String hash = KioskTokenFilter.sha256(item.getToken().trim());
            // Skip if hash already stored (active or revoked) — UNIQUE token_hash
            if (kioskTokenRepository.existsByTokenHash(hash)) {
                continue;
            }
            FingerprintKioskToken row = new FingerprintKioskToken();
            row.setDeptCode(item.getDeptCode());
            row.setTokenHash(hash);
            row.setTokenPlaintext(item.getToken().trim());
            row.setLabel(StringUtils.hasText(item.getLabel())
                    ? item.getLabel().trim()
                    : "Kiosk Đơn vị " + CodeFormatter.formatDeptCode(item.getDeptCode()));
            row.setActive(true);
            row.setCreatedAt(Instant.now());
            kioskTokenRepository.save(row);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> healthForKiosk(KioskAuthentication kiosk) {
        Integer deptCode = kiosk.getDeptCode();
        String deptName = departmentRepository.findById(deptCode)
                .map(d -> d.getDeptName())
                .orElse(null);
        Map<String, Object> body = new HashMap<>();
        body.put("ok", true);
        body.put("deptCode", deptCode);
        body.put("deptCodeFormatted", CodeFormatter.formatDeptCode(deptCode));
        body.put("deptName", deptName);
        body.put("label", kiosk.getLabel());
        return body;
    }

    /**
     * Records Agent Online heartbeat for the authenticated kiosk token (SPEC §9.5.2).
     *
     * @param kiosk authenticated kiosk principal with token id
     */
    @Transactional
    public void recordHeartbeat(KioskAuthentication kiosk) {
        if (kiosk.getTokenId() == null) {
            throw new BusinessException("Token kiosk không hợp lệ");
        }
        FingerprintKioskToken row = kioskTokenRepository.findById(kiosk.getTokenId())
                .orElseThrow(() -> new BusinessException("Token kiosk không tồn tại"));
        if (!row.isActive()) {
            throw new BusinessException("Token kiosk đã thu hồi");
        }
        row.setLastHeartbeatAt(Instant.now());
        kioskTokenRepository.save(row);
    }

    @Transactional(readOnly = true)
    public List<KioskStaffDto> listStaffForKiosk(KioskAuthentication kiosk) {
        Integer deptCode = kiosk.getDeptCode();
        List<Employee> employees = employeeRepository.findByDeptCode(deptCode).stream()
                .filter(Employee::isActive)
                .toList();
        Map<Integer, EmployeeFingerprintRepository.FingerprintMetaView> byEmp = loadActiveMetaByEmpCode(
                employees.stream().map(Employee::getEmpCode).toList());
        return employees.stream()
                .map(emp -> {
                    EmployeeFingerprintRepository.FingerprintMetaView fp = byEmp.get(emp.getEmpCode());
                    return KioskStaffDto.builder()
                            .empCode(emp.getEmpCode())
                            .empCodeFormatted(CodeFormatter.formatEmpCode(emp.getEmpCode()))
                            .fullname(emp.getFullname())
                            .fingerprintRegistered(fp != null)
                            .fingerLabel(fp != null ? fp.getFingerLabel() : null)
                            .active(emp.isActive())
                            .build();
                })
                .toList();
    }

    @Transactional
    public FingerprintStatusDto enrollFromKiosk(KioskAuthentication kiosk, FingerprintEnrollRequest request) {
        Employee emp = requireEmployeeInDept(request.getEmpCode(), kiosk.getDeptCode());
        return saveTemplate(emp, request, "kiosk:" + kiosk.getLabel(), "KIOSK");
    }

    @Transactional(readOnly = true)
    public List<FingerprintStatusDto> listStatusForHead(AuthUser authUser) {
        if (!authUser.isHead() || authUser.getDeptCode() == null) {
            throw new AccessDeniedException("Chỉ Trưởng đơn vị được xem vân tay khoa mình");
        }
        return listStatusByDept(authUser.getDeptCode());
    }

    @Transactional(readOnly = true)
    public List<FingerprintStatusDto> listStatusForAdmin(AuthUser authUser, Integer deptCode) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin được xem toàn viện");
        }
        if (deptCode != null) {
            return listStatusByDept(deptCode);
        }
        List<Employee> all = employeeRepository.findAllWithDepartment().stream()
                .filter(Employee::isActive)
                .toList();
        return toStatusList(all);
    }

    /**
     * Soft-deletes the active template for an employee in the kiosk token department (P2.2).
     * Web HEAD/ADMIN must not delete templates (P2.3) — only this kiosk path.
     *
     * @param kiosk   authenticated department kiosk
     * @param empCode employee code in that department
     */
    @Transactional
    public void deleteForKiosk(KioskAuthentication kiosk, Integer empCode) {
        Employee emp = requireEmployeeInDept(empCode, kiosk.getDeptCode());
        if (!deactivateActive(emp.getEmpCode())) {
            throw new BusinessException("Nhân viên chưa đăng ký vân tay");
        }
    }

    // --- P1.2 Admin kiosk token management (SPEC §10.1) ---

    @Transactional(readOnly = true)
    public List<KioskTokenDto> listKioskTokensForAdmin(AuthUser authUser) {
        requireAdmin(authUser);
        Map<Integer, String> deptNames = loadDeptNameMap();
        return kioskTokenRepository.findAllByOrderByDeptCodeAscCreatedAtDesc().stream()
                .map(row -> toKioskTokenDto(row, deptNames.get(row.getDeptCode())))
                .toList();
    }

    @Transactional
    public KioskTokenIssuedDto createKioskTokenForAdmin(AuthUser authUser, KioskTokenCreateRequest request) {
        requireAdmin(authUser);
        Integer deptCode = request.getDeptCode();
        requireDepartmentExists(deptCode);
        String label = StringUtils.hasText(request.getLabel())
                ? request.getLabel().trim()
                : "Kiosk Đơn vị " + CodeFormatter.formatDeptCode(deptCode);
        return issueToken(deptCode, label);
    }

    @Transactional
    public void revokeKioskTokenForAdmin(AuthUser authUser, Long id) {
        requireAdmin(authUser);
        FingerprintKioskToken row = kioskTokenRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Token kiosk không tồn tại"));
        if (!row.isActive()) {
            throw new BusinessException("Token đã được thu hồi");
        }
        row.setActive(false);
        row.setTokenPlaintext(null);
        row.setEnrollPin(null);
        kioskTokenRepository.save(row);
    }

    @Transactional
    public KioskTokenIssuedDto rotateKioskTokenForAdmin(AuthUser authUser, Long id) {
        requireAdmin(authUser);
        FingerprintKioskToken row = kioskTokenRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Token kiosk không tồn tại"));
        if (!row.isActive()) {
            throw new BusinessException("Không xoay được token đã thu hồi — hãy phát hành token mới");
        }
        String keepPin = row.getEnrollPin();
        row.setActive(false);
        row.setTokenPlaintext(null);
        row.setEnrollPin(null);
        kioskTokenRepository.save(row);
        String label = StringUtils.hasText(row.getLabel())
                ? row.getLabel()
                : "Kiosk Đơn vị " + CodeFormatter.formatDeptCode(row.getDeptCode());
        return issueToken(row.getDeptCode(), label, keepPin);
    }

    @Transactional
    public KioskTokenDto setEnrollPinForAdmin(AuthUser authUser, Long id, KioskTokenSetEnrollPinRequest request) {
        requireAdmin(authUser);
        FingerprintKioskToken row = kioskTokenRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Token kiosk không tồn tại"));
        if (!row.isActive()) {
            throw new BusinessException("Chỉ đặt PIN trên token đang dùng");
        }
        String pin = request.getEnrollPin() != null ? request.getEnrollPin().trim() : "";
        if (!pin.matches("^\\d{4,8}$")) {
            throw new BusinessException("PIN đăng ký phải gồm 4–8 chữ số");
        }
        row.setEnrollPin(pin);
        FingerprintKioskToken saved = kioskTokenRepository.save(row);
        String deptName = departmentRepository.findById(saved.getDeptCode())
                .map(d -> d.getDeptName())
                .orElse(null);
        return toKioskTokenDto(saved, deptName);
    }

    private KioskTokenIssuedDto issueToken(Integer deptCode, String label) {
        return issueToken(deptCode, label, null);
    }

    private KioskTokenIssuedDto issueToken(Integer deptCode, String label, String enrollPin) {
        // SPEC §8.3 P4b — at most one active kiosk token per department
        revokeAllActiveTokensForDept(deptCode);
        String plaintext = generateKioskTokenPlaintext();
        String hash = KioskTokenFilter.sha256(plaintext);
        FingerprintKioskToken row = new FingerprintKioskToken();
        row.setDeptCode(deptCode);
        row.setTokenHash(hash);
        row.setTokenPlaintext(plaintext);
        row.setEnrollPin(StringUtils.hasText(enrollPin) ? enrollPin.trim() : null);
        row.setLabel(label);
        row.setActive(true);
        row.setCreatedAt(Instant.now());
        FingerprintKioskToken saved = kioskTokenRepository.save(row);
        String deptName = departmentRepository.findById(deptCode)
                .map(d -> d.getDeptName())
                .orElse(null);
        return KioskTokenIssuedDto.builder()
                .tokenInfo(toKioskTokenDto(saved, deptName))
                .token(plaintext)
                .build();
    }

    private void revokeAllActiveTokensForDept(Integer deptCode) {
        List<FingerprintKioskToken> actives = kioskTokenRepository.findAllByDeptCodeAndActiveTrue(deptCode);
        if (actives.isEmpty()) {
            return;
        }
        for (FingerprintKioskToken row : actives) {
            row.setActive(false);
            row.setTokenPlaintext(null);
            row.setEnrollPin(null);
        }
        kioskTokenRepository.saveAll(actives);
    }

    private static String generateKioskTokenPlaintext() {
        byte[] bytes = new byte[24];
        new SecureRandom().nextBytes(bytes);
        return "kiosk-" + HexFormat.of().formatHex(bytes);
    }

    private void requireAdmin(AuthUser authUser) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin được quản lý token kiosk");
        }
    }

    private void requireDepartmentExists(Integer deptCode) {
        departmentRepository.findById(deptCode)
                .orElseThrow(() -> new BusinessException(
                        "Đơn vị không tồn tại: " + CodeFormatter.formatDeptCode(deptCode)));
    }

    private Map<Integer, String> loadDeptNameMap() {
        Map<Integer, String> map = new HashMap<>();
        departmentRepository.findAll().forEach(d -> map.put(d.getDeptCode(), d.getDeptName()));
        return map;
    }

    private KioskTokenDto toKioskTokenDto(FingerprintKioskToken row, String deptName) {
        String token = row.isActive() ? row.getTokenPlaintext() : null;
        String enrollPin = row.isActive() ? row.getEnrollPin() : null;
        Instant lastHb = row.getLastHeartbeatAt();
        long threshold = Math.max(30, fingerprintProperties.getOnlineThresholdSeconds());
        boolean online = row.isActive()
                && lastHb != null
                && !lastHb.isBefore(Instant.now().minusSeconds(threshold));
        return KioskTokenDto.builder()
                .id(row.getId())
                .deptCode(row.getDeptCode())
                .deptCodeFormatted(CodeFormatter.formatDeptCode(row.getDeptCode()))
                .deptName(deptName)
                .label(row.getLabel())
                .token(token)
                .enrollPin(enrollPin)
                .active(row.isActive())
                .createdAt(row.getCreatedAt())
                .lastHeartbeatAt(lastHb)
                .agentOnline(online)
                .build();
    }

    public Set<Integer> loadRegisteredSet(List<Integer> empCodes) {
        if (empCodes == null || empCodes.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(fingerprintRepository.findActiveEmpCodesIn(empCodes));
    }

    private Map<Integer, EmployeeFingerprintRepository.FingerprintMetaView> loadActiveMetaByEmpCode(
            List<Integer> empCodes) {
        if (empCodes == null || empCodes.isEmpty()) {
            return Map.of();
        }
        return fingerprintRepository.findActiveMetaByEmpCodes(empCodes).stream()
                .collect(java.util.stream.Collectors.toMap(
                        EmployeeFingerprintRepository.FingerprintMetaView::getEmpCode,
                        f -> f,
                        (a, b) -> a));
    }

    private List<FingerprintStatusDto> listStatusByDept(Integer deptCode) {
        List<Employee> employees = employeeRepository.findByDeptCode(deptCode).stream()
                .filter(Employee::isActive)
                .toList();
        return toStatusList(employees);
    }

    private List<FingerprintStatusDto> toStatusList(List<Employee> employees) {
        Map<Integer, EmployeeFingerprintRepository.FingerprintMetaView> byEmp = loadActiveMetaByEmpCode(
                employees.stream().map(Employee::getEmpCode).toList());

        return employees.stream()
                .map(emp -> {
                    EmployeeFingerprintRepository.FingerprintMetaView fp = byEmp.get(emp.getEmpCode());
                    return FingerprintStatusDto.builder()
                            .empCode(emp.getEmpCode())
                            .empCodeFormatted(CodeFormatter.formatEmpCode(emp.getEmpCode()))
                            .fullname(emp.getFullname())
                            .deptCode(emp.getDepartment().getDeptCode())
                            .deptCodeFormatted(CodeFormatter.formatDeptCode(emp.getDepartment().getDeptCode()))
                            .registered(fp != null)
                            .enrolledAt(fp != null ? fp.getEnrolledAt() : null)
                            .enrolledBy(fp != null ? fp.getEnrolledBy() : null)
                            .fingerLabel(fp != null ? fp.getFingerLabel() : null)
                            .build();
                })
                .toList();
    }

    private FingerprintStatusDto saveTemplate(
            Employee emp, FingerprintEnrollRequest request, String enrolledBy, String source) {
        int fingerIndex = request.getFingerIndex() != null ? request.getFingerIndex() : 0;
        if (request.getTemplateLen() == null || request.getTemplateLen() <= 0) {
            throw new BusinessException("Độ dài template không hợp lệ");
        }
        String base64 = request.getTemplateBase64().trim();
        if (base64.isEmpty()) {
            throw new BusinessException("Template vân tay không được để trống");
        }
        String fingerLabel = request.getFingerLabel() != null ? request.getFingerLabel().trim() : "";
        if (fingerLabel.isEmpty()) {
            throw new BusinessException("Vui lòng nhập ghi chú ngón tay (ví dụ: Ngón cái tay phải).");
        }
        if (fingerLabel.length() > 100) {
            throw new BusinessException("Ghi chú ngón tay tối đa 100 ký tự");
        }

        deactivateActive(emp.getEmpCode());

        EmployeeFingerprint fp = new EmployeeFingerprint();
        fp.setEmpCode(emp.getEmpCode());
        fp.setFingerIndex(fingerIndex);
        fp.setTemplateBase64(base64);
        fp.setTemplateLen(request.getTemplateLen());
        // P2.1a: SDK FID must equal empCode (never Agent nextFid counter)
        fp.setZkFid(emp.getEmpCode());
        fp.setActive(true);
        fp.setEnrolledAt(Instant.now());
        fp.setEnrolledBy(enrolledBy);
        fp.setFingerLabel(fingerLabel);
        fp.setSource(source);
        EmployeeFingerprint saved = fingerprintRepository.save(fp);

        return FingerprintStatusDto.builder()
                .empCode(emp.getEmpCode())
                .empCodeFormatted(CodeFormatter.formatEmpCode(emp.getEmpCode()))
                .fullname(emp.getFullname())
                .deptCode(emp.getDepartment().getDeptCode())
                .deptCodeFormatted(CodeFormatter.formatDeptCode(emp.getDepartment().getDeptCode()))
                .registered(true)
                .enrolledAt(saved.getEnrolledAt())
                .enrolledBy(saved.getEnrolledBy())
                .fingerLabel(saved.getFingerLabel())
                .build();
    }

    /** @return true if at least one active template was deactivated */
    private boolean deactivateActive(Integer empCode) {
        List<EmployeeFingerprint> existing = fingerprintRepository.findAllByEmpCodeAndActiveTrue(empCode);
        if (existing.isEmpty()) {
            return false;
        }
        for (EmployeeFingerprint fp : existing) {
            fp.setActive(false);
            fingerprintRepository.save(fp);
        }
        return true;
    }

    private Employee requireEmployeeInDept(Integer empCode, Integer deptCode) {
        Employee emp = employeeRepository.findByEmpCodeWithDept(empCode)
                .orElseThrow(() -> new BusinessException(
                        "Nhân viên không tồn tại: " + CodeFormatter.formatEmpCode(empCode)));
        if (!emp.isActive()) {
            throw new BusinessException("Nhân viên đã ngưng hoạt động");
        }
        if (!deptCode.equals(emp.getDepartment().getDeptCode())) {
            throw new AccessDeniedException("Nhân viên không thuộc đơn vị của kiosk / tài khoản");
        }
        return emp;
    }
}
