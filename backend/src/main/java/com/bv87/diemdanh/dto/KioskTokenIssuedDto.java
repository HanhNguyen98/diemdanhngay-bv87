package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * Response after create/rotate — includes plaintext for Agent setup (also stored while active).
 */
@Getter
@Builder
public class KioskTokenIssuedDto {
    private final KioskTokenDto tokenInfo;
    /** Raw kiosk token for agent.properties (same as stored token_plaintext while active). */
    private final String token;
}
