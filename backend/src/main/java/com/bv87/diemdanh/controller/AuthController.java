package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.ChangePasswordRequest;
import com.bv87.diemdanh.dto.DesktopLoginResponse;
import com.bv87.diemdanh.dto.DesktopRefreshRequest;
import com.bv87.diemdanh.dto.LoginRequest;
import com.bv87.diemdanh.dto.LoginResponse;
import com.bv87.diemdanh.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/desktop/login")
    public ResponseEntity<DesktopLoginResponse> desktopLogin(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.desktopLogin(request, httpRequest));
    }

    @PostMapping("/desktop/refresh")
    public ResponseEntity<DesktopLoginResponse> desktopRefresh(
            @Valid @RequestBody DesktopRefreshRequest request) {
        return ResponseEntity.ok(authService.refreshDesktopToken(request.getRefreshToken()));
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> me() {
        return ResponseEntity.ok(authService.getCurrentUser());
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(authService.getAuthUser(), request);
        return ResponseEntity.ok(Map.of("message", "Đã cập nhật mật khẩu thành công"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.noContent().build();
    }
}
