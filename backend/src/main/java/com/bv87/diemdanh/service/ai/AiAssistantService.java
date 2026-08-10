package com.bv87.diemdanh.service.ai;

import com.bv87.diemdanh.dto.SendReminderResultDto;
import com.bv87.diemdanh.dto.ai.AiReminderConfirmRequest;
import com.bv87.diemdanh.dto.ai.AiToolExecuteRequest;
import com.bv87.diemdanh.dto.ai.AiToolResultDto;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.service.AuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;

@Service
@Slf4j
public class AiAssistantService {

    private static final String GREETING =
            "Chào Admin, tôi có thể giúp thống kê Chấm công, xem ĐƠN VỊ còn thiếu dữ liệu chấm công "
                    + "và gửi nhắc nhở (mặc định ngày hôm qua).";

    private final AiIntentRouter intentRouter;
    private final AiToolService toolService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final Executor executor;

    public AiAssistantService(
            AiIntentRouter intentRouter,
            AiToolService toolService,
            AuditService auditService,
            ObjectMapper objectMapper,
            @Qualifier("aiAssistantExecutor") Executor executor) {
        this.intentRouter = intentRouter;
        this.toolService = toolService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
        this.executor = executor;
    }

    public SseEmitter streamChat(AuthUser authUser, String message, String quickAction, LocalDate preferredDate) {
        assertAdmin(authUser);
        SseEmitter emitter = new SseEmitter(120_000L);
        emitter.onTimeout(emitter::complete);
        emitter.onError(ex -> emitter.complete());

        executor.execute(() -> {
            try {
                AiIntent intent = intentRouter.route(quickAction, message, preferredDate);
                handleIntentStream(authUser, emitter, intent);
                sendEvent(emitter, "done", Map.of());
                emitter.complete();
            } catch (Exception ex) {
                log.error("AI stream failed", ex);
                try {
                    sendEvent(emitter, "error", Map.of("message", ex.getMessage() != null
                            ? ex.getMessage()
                            : "Lỗi xử lý yêu cầu AI"));
                    emitter.complete();
                } catch (Exception ignored) {
                    emitter.completeWithError(ex);
                }
            }
        });

        return emitter;
    }

    public AiToolResultDto executeTool(AuthUser authUser, AiToolExecuteRequest request) {
        assertAdmin(authUser);
        Map<String, Object> result = toolService.executeTool(
                authUser, request.getTool(), request.getParams());
        auditService.log(authUser, "ADMIN_AI_TOOL", Map.of(
                "tool", request.getTool(),
                "params", request.getParams() != null ? request.getParams() : Map.of()));
        return buildToolResult(request.getTool(), result);
    }

    public SendReminderResultDto confirmReminders(AuthUser authUser, AiReminderConfirmRequest request) {
        assertAdmin(authUser);
        SendReminderResultDto result = toolService.confirmBatchReminders(
                authUser, request.getActionId(), request.getDeptCodes());
        auditService.log(authUser, "ADMIN_AI_BATCH_REMINDERS", Map.of(
                "actionId", request.getActionId(),
                "deptCodes", request.getDeptCodes(),
                "sent", result.getSent()));
        return result;
    }

    private void handleIntentStream(AuthUser authUser, SseEmitter emitter, AiIntent intent)
            throws IOException, InterruptedException {
        switch (intent.getType()) {
            case GREETING -> streamText(emitter, GREETING);
            case WORK_STATUS_PICKER -> {
                streamText(emitter,
                        "Bạn muốn xem báo cáo trạng thái làm việc trong khoảng thời gian nào? "
                                + "Vui lòng chọn thời gian phía dưới:");
                sendEvent(emitter, "widget", Map.of("type", "time_range_picker", "payload", intent.getArgs()));
            }
            case WORK_STATUS_EXECUTE -> {
                streamText(emitter, intent.getReplyHint());
                sendPing(emitter);
                Map<String, Object> result = toolService.buildWorkStatusReport(authUser, intent.getArgs());
                sendEvent(emitter, "widget", Map.of("type", "status_report_table", "payload", result));
                sendEvent(emitter, "widget", Map.of("type", "download_card", "payload", result));
                streamText(emitter, "Đã tổng hợp báo cáo trạng thái làm việc theo yêu cầu.");
            }
            case ATTENDANCE_DATE_PICKER -> {
                streamText(emitter, "Vui lòng chọn ngày bạn muốn xuất báo cáo Chấm công:");
                sendEvent(emitter, "widget", Map.of("type", "date_picker", "payload", intent.getArgs()));
            }
            case ATTENDANCE_STATUS_EXECUTE -> {
                streamText(emitter, intent.getReplyHint());
                sendPing(emitter);
                Map<String, Object> result = toolService.buildAttendanceStatusReport(authUser, intent.getArgs());
                sendEvent(emitter, "widget", Map.of("type", "attendance_report_table", "payload", result));
                sendEvent(emitter, "widget", Map.of("type", "download_card", "payload", result));
                streamText(emitter, String.format(
                        "Báo cáo Chấm công ngày %s đã sẵn sàng.", result.get("dateFormatted")));
            }
            case PENDING_DEPARTMENTS -> {
                streamText(emitter, intent.getReplyHint());
                sendPing(emitter);
                Map<String, Object> result = toolService.listMissingPunchDepartments(authUser, intent.getArgs());
                sendEvent(emitter, "widget", Map.of("type", "pending_dept_table", "payload", result));
                int count = ((List<?>) result.get("departments")).size();
                String dateLabel = String.valueOf(result.get("dateFormatted"));
                if (count == 0) {
                    streamText(emitter, "Không có ĐƠN VỊ nào còn thiếu dữ liệu chấm công ngày " + dateLabel + ".");
                } else {
                    streamText(emitter, String.format(
                            "Có %d ĐƠN VỊ còn thiếu dữ liệu chấm công ngày %s.", count, dateLabel));
                }
            }
            case BATCH_REMINDERS -> emitBatchReminders(authUser, emitter, intent);
            case UNKNOWN -> streamText(emitter,
                    "Tôi chưa hiểu yêu cầu này. Bạn có thể dùng các nút gợi ý hoặc hỏi: "
                            + "\"Báo cáo trạng thái làm việc hôm nay\", "
                            + "\"Xuất báo cáo Chấm công ngày hôm nay\", "
                            + "\"Khoa nào thiếu dữ liệu chấm công hôm qua?\"");
        }
    }

    private void emitBatchReminders(AuthUser authUser, SseEmitter emitter, AiIntent intent)
            throws IOException, InterruptedException {
        streamText(emitter, intent.getReplyHint());
        sendPing(emitter);
        Map<String, Object> preview = toolService.previewMissingPunchReminders(authUser, intent.getArgs());
        sendEvent(emitter, "widget", Map.of("type", "reminder_confirm", "payload", preview));
        int count = ((List<?>) preview.get("departments")).size();
        String dateLabel = String.valueOf(preview.get("dateFormatted"));
        if (count == 0) {
            streamText(emitter, "Không có ĐƠN VỊ nào còn thiếu dữ liệu chấm công ngày " + dateLabel + ".");
        } else {
            streamText(emitter, String.format(
                    "Tìm thấy %d ĐƠN VỊ còn thiếu dữ liệu chấm công ngày %s. Vui lòng xác nhận trước khi gửi.",
                    count, dateLabel));
        }
    }

    private AiToolResultDto buildToolResult(String tool, Map<String, Object> result) {
        List<Map<String, Object>> widgets = new ArrayList<>();
        String message;
        switch (tool) {
            case "work_status_report" -> {
                message = "Đã tổng hợp báo cáo trạng thái làm việc.";
                widgets.add(Map.of("type", "status_report_table", "payload", result));
                widgets.add(Map.of("type", "download_card", "payload", result));
            }
            case "attendance_status_report" -> {
                message = String.format("Báo cáo Chấm công ngày %s đã sẵn sàng.", result.get("dateFormatted"));
                widgets.add(Map.of("type", "attendance_report_table", "payload", result));
                widgets.add(Map.of("type", "download_card", "payload", result));
            }
            case "batch_reminders", "remind_missing_punch_depts" -> {
                int count = ((List<?>) result.get("departments")).size();
                String dateLabel = String.valueOf(result.get("dateFormatted"));
                message = count == 0
                        ? "Không có ĐƠN VỊ nào cần nhắc nhở ngày " + dateLabel + "."
                        : String.format(
                                "Tìm thấy %d ĐƠN VỊ còn thiếu dữ liệu chấm công ngày %s. Vui lòng xác nhận.",
                                count, dateLabel);
                widgets.add(Map.of("type", "reminder_confirm", "payload", result));
            }
            case "list_missing_punches", "list_pending_departments" -> {
                int count = ((List<?>) result.get("departments")).size();
                String dateLabel = String.valueOf(result.get("dateFormatted"));
                message = count == 0
                        ? "Không có ĐƠN VỊ nào còn thiếu dữ liệu chấm công ngày " + dateLabel + "."
                        : String.format("Có %d ĐƠN VỊ còn thiếu dữ liệu chấm công ngày %s.", count, dateLabel);
                widgets.add(Map.of("type", "pending_dept_table", "payload", result));
            }
            default -> {
                message = "Đã xử lý yêu cầu.";
            }
        }
        return AiToolResultDto.builder().message(message).widgets(widgets).build();
    }

    private void streamText(SseEmitter emitter, String text) throws IOException, InterruptedException {
        if (text == null || text.isBlank()) {
            return;
        }
        String[] chunks = text.split("(?<=\\s)");
        for (String chunk : chunks) {
            sendEvent(emitter, "token", Map.of("text", chunk));
            Thread.sleep(20);
        }
    }

    private void sendPing(SseEmitter emitter) throws IOException {
        sendEvent(emitter, "ping", Map.of("ts", System.currentTimeMillis()));
    }

    private void sendEvent(SseEmitter emitter, String eventName, Object payload) throws IOException {
        emitter.send(SseEmitter.event()
                .name(eventName)
                .data(objectMapper.writeValueAsString(payload)));
    }

    private void assertAdmin(AuthUser authUser) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới sử dụng Trợ lý AI");
        }
    }
}
