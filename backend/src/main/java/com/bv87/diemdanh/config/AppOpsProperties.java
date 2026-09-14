package com.bv87.diemdanh.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Operational files written on the Windows host (D-DISK.1).
 */
@Component
@ConfigurationProperties(prefix = "app.ops")
@Getter
@Setter
public class AppOpsProperties {

    /** Absolute or relative path to host-written disk-status.json. Empty disables the banner. */
    private String diskStatusPath = "";
}
