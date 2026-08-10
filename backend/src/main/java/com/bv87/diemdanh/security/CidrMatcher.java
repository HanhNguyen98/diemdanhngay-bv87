package com.bv87.diemdanh.security;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Minimal IPv4/IPv6 CIDR matcher for kiosk LAN gate (SPEC §8.1).
 */
public final class CidrMatcher {

    private final List<Cidr> cidrs;

    public CidrMatcher(Collection<String> cidrStrings) {
        List<Cidr> parsed = new ArrayList<>();
        if (cidrStrings != null) {
            for (String raw : cidrStrings) {
                if (raw == null || raw.isBlank()) {
                    continue;
                }
                parsed.add(Cidr.parse(raw.trim()));
            }
        }
        this.cidrs = List.copyOf(parsed);
    }

    public boolean matches(String hostOrIp) {
        if (hostOrIp == null || hostOrIp.isBlank() || cidrs.isEmpty()) {
            return false;
        }
        try {
            InetAddress addr = InetAddress.getByName(normalize(hostOrIp));
            byte[] bytes = addr.getAddress();
            for (Cidr cidr : cidrs) {
                if (cidr.contains(bytes)) {
                    return true;
                }
            }
            return false;
        } catch (UnknownHostException e) {
            return false;
        }
    }

    private static String normalize(String host) {
        String h = host.trim();
        if (h.startsWith("[") && h.contains("]")) {
            return h.substring(1, h.indexOf(']'));
        }
        // strip :port for IPv4
        int colon = h.indexOf(':');
        if (colon > 0 && h.indexOf(':') == h.lastIndexOf(':') && h.chars().filter(Character::isDigit).count() > 0) {
            // likely IPv4:port
            if (!h.contains("::")) {
                return h.substring(0, colon);
            }
        }
        return h;
    }

    private record Cidr(byte[] network, int prefixLength) {
        static Cidr parse(String cidr) {
            String[] parts = cidr.split("/");
            try {
                InetAddress addr = InetAddress.getByName(parts[0].trim());
                byte[] network = addr.getAddress();
                int max = network.length * 8;
                int prefix = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : max;
                if (prefix < 0 || prefix > max) {
                    throw new IllegalArgumentException("Invalid prefix: " + cidr);
                }
                return new Cidr(network, prefix);
            } catch (UnknownHostException e) {
                throw new IllegalArgumentException("Invalid CIDR: " + cidr, e);
            }
        }

        boolean contains(byte[] address) {
            if (address.length != network.length) {
                return false;
            }
            int fullBytes = prefixLength / 8;
            int remBits = prefixLength % 8;
            for (int i = 0; i < fullBytes; i++) {
                if (address[i] != network[i]) {
                    return false;
                }
            }
            if (remBits == 0) {
                return true;
            }
            int mask = 0xFF << (8 - remBits);
            return (address[fullBytes] & mask) == (network[fullBytes] & mask);
        }
    }
}
