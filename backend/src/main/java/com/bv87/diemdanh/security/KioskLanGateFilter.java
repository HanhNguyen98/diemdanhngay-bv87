package com.bv87.diemdanh.security;

import com.bv87.diemdanh.config.AppSecurityProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Blocks {@code /api/kiosk/**} from non-LAN clients when enabled (SPEC §8.1 P4b).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
@RequiredArgsConstructor
public class KioskLanGateFilter extends OncePerRequestFilter {

    private final AppSecurityProperties securityProperties;
    private volatile CidrMatcher matcher;

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
        AppSecurityProperties.Kiosk kiosk = securityProperties.getKiosk();
        if (kiosk == null || !kiosk.isLanGateEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }
        String clientIp = resolveClientIp(request, kiosk.isTrustForwardedHeaders());
        if (!matcher().matches(clientIp)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"API kiosk chỉ dùng trên mạng nội bộ.\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private CidrMatcher matcher() {
        CidrMatcher local = matcher;
        if (local == null) {
            synchronized (this) {
                local = matcher;
                if (local == null) {
                    local = new CidrMatcher(securityProperties.getKiosk().getAllowedCidrs());
                    matcher = local;
                }
            }
        }
        return local;
    }

    static String resolveClientIp(HttpServletRequest request, boolean trustForwarded) {
        if (trustForwarded) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                String first = xff.split(",")[0].trim();
                if (!first.isEmpty()) {
                    return first;
                }
            }
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "";
    }
}
