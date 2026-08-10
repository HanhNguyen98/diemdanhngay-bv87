package com.bv87.diemdanh.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "app.security")
@Getter
@Setter
public class AppSecurityProperties {

    private Cors cors = new Cors();
    private LoginRateLimit loginRateLimit = new LoginRateLimit();
    /** P4b — kiosk LAN gate (SPEC_FINGERPRINT §8.1). */
    private Kiosk kiosk = new Kiosk();

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOriginPatterns = new ArrayList<>(List.of("*"));
    }

    @Getter
    @Setter
    public static class LoginRateLimit {
        private boolean enabled = true;
        private int maxAttempts = 5;
        private int windowMinutes = 15;
        private int lockoutMinutes = 15;
    }

    @Getter
    @Setter
    public static class Kiosk {
        /** When true, only clients in {@link #allowedCidrs} may call {@code /api/kiosk/**}. */
        private boolean lanGateEnabled = false;
        private boolean trustForwardedHeaders = false;
        private List<String> allowedCidrs = new ArrayList<>(List.of(
                "127.0.0.1/32",
                "::1/128",
                "10.0.0.0/8",
                "172.16.0.0/12",
                "192.168.0.0/16"
        ));
    }
}
