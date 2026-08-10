package com.bv87.diemdanh.service;

import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Server-side scan debounce per department employee (SPEC §8.2 P4b).
 */
@Component
public class KioskScanDebouncer {

    public static final long DEBOUNCE_MS = 2_000L;

    private final ConcurrentHashMap<String, Long> lastAttemptMs = new ConcurrentHashMap<>();

    /**
     * @return true if this attempt should be rejected as too soon
     */
    public boolean isTooSoon(Integer deptCode, Integer empCode) {
        String key = key(deptCode, empCode);
        long now = System.currentTimeMillis();
        pruneIfNeeded(now);
        Long prev = lastAttemptMs.get(key);
        if (prev != null && now - prev < DEBOUNCE_MS) {
            return true;
        }
        lastAttemptMs.put(key, now);
        return false;
    }

    private static String key(Integer deptCode, Integer empCode) {
        return deptCode + ":" + empCode;
    }

    private void pruneIfNeeded(long now) {
        if (lastAttemptMs.size() < 2_000) {
            return;
        }
        Iterator<Map.Entry<String, Long>> it = lastAttemptMs.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Long> e = it.next();
            if (now - e.getValue() > 60_000L) {
                it.remove();
            }
        }
    }
}
