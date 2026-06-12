package com.bv87.diemdanh.service;

import com.bv87.diemdanh.entity.AuditLog;
import com.bv87.diemdanh.repository.AuditLogRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void log(AuthUser authUser, String action, Map<String, Object> details) {
        try {
            AuditLog row = new AuditLog();
            row.setAction(action);
            row.setUsername(authUser.getUsername());
            row.setDeptCode(authUser.getDeptCode());
            if (details != null && !details.isEmpty()) {
                row.setDetailsJson(objectMapper.writeValueAsString(details));
            }
            repository.save(row);
        } catch (Exception ex) {
            log.warn("Không ghi được audit log: {}", action, ex);
        }
    }
}
