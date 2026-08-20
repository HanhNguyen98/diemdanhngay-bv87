package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.NotificationDto;
import com.bv87.diemdanh.entity.Notification;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.NotificationRepository;
import com.bv87.diemdanh.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationDto> listForUser(AuthUser authUser) {
        return notificationRepository.findTop30ByRecipientIdOrderByCreatedAtDesc(authUser.getAccount().getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(AuthUser authUser) {
        return notificationRepository.countByRecipientIdAndReadFalse(authUser.getAccount().getId());
    }

    @Transactional
    public void markRead(AuthUser authUser, Long id) {
        int updated = notificationRepository.markRead(id, authUser.getAccount().getId());
        if (updated == 0) {
            throw new BusinessException("Không tìm thấy thông báo");
        }
    }

    @Transactional
    public void markAllRead(AuthUser authUser) {
        notificationRepository.markAllRead(authUser.getAccount().getId());
    }

    @Transactional
    public NotificationDto getForUser(AuthUser authUser, Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy thông báo"));
        if (!notification.getRecipientId().equals(authUser.getAccount().getId())) {
            throw new AccessDeniedException("Không có quyền xem thông báo này");
        }
        return toDto(notification);
    }

    Notification save(Notification notification) {
        return notificationRepository.save(notification);
    }

    /**
     * Persist a bell notification in its own transaction so a DB error
     * (e.g. stale MySQL ENUM on type) does not roll back the caller.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveIsolated(Notification notification) {
        notificationRepository.save(notification);
    }

    private NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .deptCode(n.getDeptCode())
                .attendanceDate(n.getAttendanceDate())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
