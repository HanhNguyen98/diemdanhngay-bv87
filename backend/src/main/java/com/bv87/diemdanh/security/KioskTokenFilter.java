package com.bv87.diemdanh.security;

import com.bv87.diemdanh.entity.FingerprintKioskToken;
import com.bv87.diemdanh.repository.FingerprintKioskTokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Authenticates {@code /api/kiosk/**} requests using header {@code X-Kiosk-Token}.
 */
@Component
@RequiredArgsConstructor
public class KioskTokenFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Kiosk-Token";

    private final FingerprintKioskTokenRepository kioskTokenRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/kiosk/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String raw = request.getHeader(HEADER);
        if (raw == null || raw.isBlank()) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Thiếu mã token kiosk\"}");
            return;
        }
        String hash = sha256(raw.trim());
        FingerprintKioskToken token = kioskTokenRepository.findByTokenHashAndActiveTrue(hash).orElse(null);
        if (token == null) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Token kiosk không hợp lệ\"}");
            return;
        }
        SecurityContextHolder.getContext().setAuthentication(
                new KioskAuthentication(token.getId(), token.getDeptCode(), token.getLabel()));
        filterChain.doFilter(request, response);
    }

    public static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
