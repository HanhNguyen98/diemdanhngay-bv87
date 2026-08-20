package com.bv87.diemdanh.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Client IP / User-Agent from the current HTTP request — SPEC P14.
 */
public final class RequestClientInfo {

    private RequestClientInfo() {
    }

    public static String ip() {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return null;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public static String userAgent() {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return null;
        }
        String ua = request.getHeader("User-Agent");
        if (ua == null || ua.isBlank()) {
            return null;
        }
        return ua.length() > 255 ? ua.substring(0, 255) : ua;
    }

    private static HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes servletAttrs) {
            return servletAttrs.getRequest();
        }
        return null;
    }
}
