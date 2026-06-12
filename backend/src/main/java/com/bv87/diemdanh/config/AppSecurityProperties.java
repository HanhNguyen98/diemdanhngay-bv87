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
}
