package com.bv87.diemdanh.security;

import com.bv87.diemdanh.config.AppSecurityProperties;
import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.exception.BusinessException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/** Issues and validates JWT access/refresh tokens for desktop clients (SPEC_DESKTOP §2). */
@Service
@RequiredArgsConstructor
public class JwtService {

    public static final String CLAIM_TYPE = "type";
    public static final String CLAIM_ACCOUNT_ID = "accountId";
    public static final String CLAIM_ROLE = "role";

    private final AppSecurityProperties securityProperties;

    /**
     * @param authUser authenticated user
     * @return signed access token
     */
    public String generateAccessToken(AuthUser authUser) {
        return buildToken(authUser, JwtTokenType.ACCESS, accessTtlSeconds());
    }

    /**
     * @param authUser authenticated user
     * @return signed refresh token
     */
    public String generateRefreshToken(AuthUser authUser) {
        return buildToken(authUser, JwtTokenType.REFRESH, refreshTtlSeconds());
    }

    /**
     * @param token raw JWT
     * @return parsed claims
     * @throws BusinessException when token is invalid or expired
     */
    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            throw new BusinessException("Token không hợp lệ hoặc đã hết hạn");
        }
    }

    /**
     * @param token refresh JWT
     * @return username from {@code sub} claim
     */
    public String validateRefreshToken(String token) {
        Claims claims = parseToken(token);
        assertTokenType(claims, JwtTokenType.REFRESH);
        String username = claims.getSubject();
        if (username == null || username.isBlank()) {
            throw new BusinessException("Token không hợp lệ hoặc đã hết hạn");
        }
        return username;
    }

    /**
     * @param token access JWT
     * @return username from {@code sub} claim
     */
    public String validateAccessToken(String token) {
        Claims claims = parseToken(token);
        assertTokenType(claims, JwtTokenType.ACCESS);
        String username = claims.getSubject();
        if (username == null || username.isBlank()) {
            throw new BusinessException("Token không hợp lệ hoặc đã hết hạn");
        }
        return username;
    }

    public int accessTtlSeconds() {
        return securityProperties.getJwt().getAccessTokenMinutes() * 60;
    }

    private long refreshTtlSeconds() {
        return (long) securityProperties.getJwt().getRefreshTokenDays() * 24 * 60 * 60;
    }

    private String buildToken(AuthUser authUser, JwtTokenType type, long ttlSeconds) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(authUser.getUsername())
                .claim(CLAIM_ACCOUNT_ID, authUser.getAccount().getId())
                .claim(CLAIM_ROLE, authUser.getAccount().getRole().name())
                .claim(CLAIM_TYPE, type.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(signingKey())
                .compact();
    }

    private void assertTokenType(Claims claims, JwtTokenType expected) {
        String raw = claims.get(CLAIM_TYPE, String.class);
        if (raw == null || !expected.name().equals(raw)) {
            throw new BusinessException("Token không hợp lệ hoặc đã hết hạn");
        }
    }

    private SecretKey signingKey() {
        byte[] keyBytes = securityProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("app.security.jwt.secret must be at least 32 bytes");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public AccountRole readRole(Claims claims) {
        String role = claims.get(CLAIM_ROLE, String.class);
        if (role == null) {
            throw new BusinessException("Token không hợp lệ hoặc đã hết hạn");
        }
        return AccountRole.valueOf(role);
    }
}
