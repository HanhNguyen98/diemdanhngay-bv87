package com.bv87.diemdanh.security;

import com.bv87.diemdanh.config.AppSecurityProperties;
import com.bv87.diemdanh.exception.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class LoginRateLimitService {

    private final AppSecurityProperties securityProperties;
    private final Map<String, AttemptBucket> buckets = new ConcurrentHashMap<>();

    public void assertNotBlocked(HttpServletRequest request, String username) {
        if (!securityProperties.getLoginRateLimit().isEnabled()) {
            return;
        }
        String key = buildKey(request, username);
        AttemptBucket bucket = buckets.get(key);
        if (bucket != null && bucket.isBlocked()) {
            throw new RateLimitExceededException(
                    "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau "
                            + securityProperties.getLoginRateLimit().getLockoutMinutes()
                            + " phút.");
        }
    }

    public void recordFailure(HttpServletRequest request, String username) {
        if (!securityProperties.getLoginRateLimit().isEnabled()) {
            return;
        }
        var config = securityProperties.getLoginRateLimit();
        String key = buildKey(request, username);
        Instant now = Instant.now();

        buckets.compute(key, (ignored, bucket) -> {
            AttemptBucket current = bucket == null ? new AttemptBucket() : bucket;
            if (current.isBlocked()) {
                return current;
            }
            if (current.windowStart == null
                    || now.isAfter(current.windowStart.plusSeconds(config.getWindowMinutes() * 60L))) {
                current.failures = 0;
                current.windowStart = now;
            }
            current.failures++;
            if (current.failures >= config.getMaxAttempts()) {
                current.blockedUntil = now.plusSeconds(config.getLockoutMinutes() * 60L);
            }
            return current;
        });
    }

    public void clearFailures(HttpServletRequest request, String username) {
        buckets.remove(buildKey(request, username));
    }

    public String buildKey(HttpServletRequest request, String username) {
        String normalizedUsername = username == null ? "" : username.trim().toLowerCase();
        return resolveClientIp(request) + "|" + normalizedUsername;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static final class AttemptBucket {
        private int failures;
        private Instant windowStart;
        private Instant blockedUntil;

        private boolean isBlocked() {
            return blockedUntil != null && Instant.now().isBefore(blockedUntil);
        }
    }
}
