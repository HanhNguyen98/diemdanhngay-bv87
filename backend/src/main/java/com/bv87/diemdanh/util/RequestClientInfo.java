package com.bv87.diemdanh.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.net.Inet4Address;
import java.net.InetAddress;

/**
 * Client IP / User-Agent from the current HTTP request — SPEC P14 / D-UI.55.
 */
public final class RequestClientInfo {

    private RequestClientInfo() {
    }

    public static String ip() {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return null;
        }

        String advertised = firstNonBlank(
                request.getHeader("X-Client-Ip"),
                request.getHeader("X-Client-IP"));
        if (isUsableIpv4(advertised)) {
            return advertised.trim();
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String first = forwarded.split(",")[0].trim();
            if (isUsableIpv4(first)) {
                return first;
            }
            return normalizeLoopback(first);
        }

        return normalizeLoopback(request.getRemoteAddr());
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

    static boolean isUsableIpv4(String raw) {
        if (raw == null || raw.isBlank() || raw.contains(":")) {
            return false;
        }
        try {
            InetAddress addr = InetAddress.getByName(raw.trim());
            return addr instanceof Inet4Address
                    && !addr.isMulticastAddress()
                    && !addr.isLoopbackAddress();
        } catch (Exception ex) {
            return false;
        }
    }

    static String normalizeLoopback(String raw) {
        if (raw == null || raw.isBlank()) {
            return raw;
        }
        String value = raw.trim();
        if ("::1".equals(value) || "0:0:0:0:0:0:0:1".equalsIgnoreCase(value)
                || "https://example.net/id/garnet".equals(value)) {
            return "127.0.0.1";
        }
        return value;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes servletAttrs) {
            return servletAttrs.getRequest();
        }
        return null;
    }
}
