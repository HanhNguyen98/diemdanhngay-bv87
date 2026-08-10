package com.bv87.diemdanh.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "app.fingerprint")
@Getter
@Setter
public class FingerprintProperties {

    /**
     * Optional bootstrap tokens for local/dev (plaintext). Hashed and upserted on startup when set.
     */
    private List<BootstrapKioskToken> bootstrapKioskTokens = new ArrayList<>();

    /** Seconds without heartbeat before Admin shows Offline (SPEC §9.5.2). */
    private int onlineThresholdSeconds = 90;

    @Getter
    @Setter
    public static class BootstrapKioskToken {
        private Integer deptCode;
        private String token;
        private String label;
    }
}
