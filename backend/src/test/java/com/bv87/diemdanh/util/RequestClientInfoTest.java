package com.bv87.diemdanh.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RequestClientInfoTest {

    @Test
    void usableIpv4_acceptsHospitalLan() {
        assertTrue(RequestClientInfo.isUsableIpv4("192.170.180.23"));
        assertTrue(RequestClientInfo.isUsableIpv4("10.0.0.8"));
    }

    @Test
    void usableIpv4_rejectsLoopbackAndIpv6() {
        assertFalse(RequestClientInfo.isUsableIpv4("127.0.0.1"));
        assertFalse(RequestClientInfo.isUsableIpv4("::1"));
        assertFalse(RequestClientInfo.isUsableIpv4(""));
        assertFalse(RequestClientInfo.isUsableIpv4(null));
    }

    @Test
    void normalizeLoopback_mapsIpv6Localhost() {
        assertEquals("127.0.0.1", RequestClientInfo.normalizeLoopback("::1"));
        assertEquals("192.170.180.23", RequestClientInfo.normalizeLoopback("192.170.180.23"));
    }
}
