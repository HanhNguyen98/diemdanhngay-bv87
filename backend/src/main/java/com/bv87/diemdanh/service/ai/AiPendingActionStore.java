package com.bv87.diemdanh.service.ai;

import com.bv87.diemdanh.entity.AiPendingAction;
import com.bv87.diemdanh.repository.AiPendingActionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AiPendingActionStore {

    private static final long TTL_SECONDS = 600;
    private static final String REMINDER_TYPE = "batch_reminders";
    private static final String BATCH_ATTENDANCE_TYPE = "batch_attendance";

    public record ReminderAction(List<Integer> deptCodes, Instant expiresAt) {}

    public record BatchAttendanceAction(
            Integer deptCode,
            LocalDate date,
            String status,
            String scope,
            List<Integer> empCodes,
            Instant expiresAt) {}

    private final AiPendingActionRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional
    public String saveReminderAction(List<Integer> deptCodes) {
        purgeExpired();
        String actionId = UUID.randomUUID().toString();
        AiPendingAction row = new AiPendingAction();
        row.setActionId(actionId);
        row.setActionType(REMINDER_TYPE);
        row.setDeptCodesJson(writeDeptCodes(deptCodes));
        row.setExpiresAt(Instant.now().plusSeconds(TTL_SECONDS));
        repository.save(row);
        return actionId;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String saveBatchAttendanceAction(
            Integer deptCode,
            LocalDate date,
            String status,
            String scope,
            List<Integer> empCodes) {
        purgeExpired();
        String actionId = UUID.randomUUID().toString();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("deptCode", deptCode);
        payload.put("date", date.toString());
        payload.put("status", status);
        payload.put("scope", scope);
        payload.put("empCodes", empCodes);

        AiPendingAction row = new AiPendingAction();
        row.setActionId(actionId);
        row.setActionType(BATCH_ATTENDANCE_TYPE);
        row.setDeptCodesJson(writeJson(payload));
        row.setExpiresAt(Instant.now().plusSeconds(TTL_SECONDS));
        repository.save(row);
        return actionId;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<BatchAttendanceAction> consumeBatchAttendanceAction(String actionId, Integer deptCode) {
        purgeExpired();
        return repository.findById(actionId)
                .filter(row -> BATCH_ATTENDANCE_TYPE.equals(row.getActionType()))
                .filter(row -> row.getExpiresAt().isAfter(Instant.now()))
                .map(row -> readBatchAttendancePayload(row.getDeptCodesJson()))
                .filter(payload -> deptCode != null && deptCode.equals(payload.deptCode()))
                .map(payload -> {
                    repository.deleteById(actionId);
                    return payload;
                });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<ReminderAction> consumeReminderAction(String actionId, List<Integer> deptCodes) {
        purgeExpired();
        return repository.findById(actionId)
                .filter(row -> REMINDER_TYPE.equals(row.getActionType()))
                .filter(row -> row.getExpiresAt().isAfter(Instant.now()))
                .filter(row -> deptCodes != null && !deptCodes.isEmpty())
                .filter(row -> {
                    List<Integer> allowed = readDeptCodes(row.getDeptCodesJson());
                    return deptCodes.stream().allMatch(allowed::contains);
                })
                .map(row -> {
                    repository.deleteById(actionId);
                    return new ReminderAction(readDeptCodes(row.getDeptCodesJson()), row.getExpiresAt());
                });
    }

    private void purgeExpired() {
        repository.deleteExpired(Instant.now());
    }

    private String writeDeptCodes(List<Integer> deptCodes) {
        return writeJson(deptCodes);
    }

    private List<Integer> readDeptCodes(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Dữ liệu phiên xác nhận không hợp lệ", ex);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể lưu dữ liệu phiên xác nhận", ex);
        }
    }

    private BatchAttendanceAction readBatchAttendancePayload(String json) {
        try {
            Map<String, Object> map = objectMapper.readValue(json, new TypeReference<>() {});
            Integer deptCode = ((Number) map.get("deptCode")).intValue();
            LocalDate date = LocalDate.parse(map.get("date").toString());
            String status = map.get("status").toString();
            String scope = map.get("scope").toString();
            List<Integer> empCodes = objectMapper.convertValue(
                    map.get("empCodes"), new TypeReference<>() {});
            return new BatchAttendanceAction(deptCode, date, status, scope, empCodes, Instant.now());
        } catch (Exception ex) {
            throw new IllegalStateException("Dữ liệu phiên Điểm danh hàng loạt không hợp lệ", ex);
        }
    }
}
