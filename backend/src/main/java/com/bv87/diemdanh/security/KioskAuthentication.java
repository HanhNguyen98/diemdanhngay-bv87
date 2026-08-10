package com.bv87.diemdanh.security;

import lombok.Getter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

/**
 * Authentication principal for department fingerprint kiosk Agents.
 */
@Getter
public class KioskAuthentication extends AbstractAuthenticationToken {

    private final Long tokenId;
    private final Integer deptCode;
    private final String label;

    public KioskAuthentication(Long tokenId, Integer deptCode, String label) {
        super(List.of(new SimpleGrantedAuthority("ROLE_KIOSK")));
        this.tokenId = tokenId;
        this.deptCode = deptCode;
        this.label = label != null ? label : "kiosk-" + deptCode;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return "";
    }

    @Override
    public Object getPrincipal() {
        return label;
    }
}
