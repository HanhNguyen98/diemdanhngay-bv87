package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.NotificationDto;
import com.bv87.diemdanh.service.AuthService;
import com.bv87.diemdanh.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> list() {
        return ResponseEntity.ok(notificationService.listForUser(authService.getAuthUser()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        long count = notificationService.unreadCount(authService.getAuthUser());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markRead(@PathVariable Long id) {
        notificationService.markRead(authService.getAuthUser(), id);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đã đọc"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead() {
        notificationService.markAllRead(authService.getAuthUser());
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả đã đọc"));
    }
}
