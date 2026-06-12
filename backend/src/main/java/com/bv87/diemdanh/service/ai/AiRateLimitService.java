package com.bv87.diemdanh.service.ai;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiRateLimitService {

    private static final int MAX_REQUESTS = 30;
    private static final long WINDOW_SECONDS = 60;

    private final Map<String, Deque<Long>> buckets = new ConcurrentHashMap<>();

    public boolean tryAcquire(String key) {
        long now = Instant.now().getEpochSecond();
        Deque<Long> window = buckets.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (window) {
            while (!window.isEmpty() && now - window.peekFirst() >= WINDOW_SECONDS) {
                window.pollFirst();
            }
            if (window.size() >= MAX_REQUESTS) {
                return false;
            }
            window.addLast(now);
            return true;
        }
    }
}
