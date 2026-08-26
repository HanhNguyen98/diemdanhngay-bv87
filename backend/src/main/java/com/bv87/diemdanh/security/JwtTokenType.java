package com.bv87.diemdanh.security;

/** JWT claim discriminator for desktop access vs refresh tokens. */
public enum JwtTokenType {
    ACCESS,
    REFRESH
}
