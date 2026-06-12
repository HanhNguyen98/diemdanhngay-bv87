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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;

@Service
@Slf4j
public class AiAssistantService {

    private static final String GREETING =
            "Chào Admin, tôi có thể giúp gì cho bạn trong việc thống kê và quản lý chấm công hôm nay?";

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

    public SseEmitter streamChat(AuthUser authUser, String message, String quickAction) {
        assertAdmin(authUser);
        SseEmitter emitter = new SseEmitter(120_000L);
        emitter.onTimeout(emitter::complete);
        emitter.onError(ex -> emitter.complete());

        executor.execute(() -> {
            try {
                AiIntent intent = intentRouter.route(quickAction, message);
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
                streamText(emitter, "Vui lòng chọn ngày bạn muốn xuất báo cáo chấm công:");
                sendEvent(emitter, "widget", Map.of("type", "date_picker", "payload", intent.getArgs()));
            }
            case ATTENDANCE_STATUS_EXECUTE -> {
                streamText(emitter, intent.getReplyHint());
                sendPing(emitter);
                Map<String, Object> result = toolService.buildAttendanceStatusReport(authUser, intent.getArgs());
                sendEvent(emitter, "widget", Map.of("type", "attendance_report_table", "payload", result));
                sendEvent(emitter, "widget", Map.of("type", "download_card", "payload", result));
                streamText(emitter, String.format(
                        "Báo cáo chấm công ngày %s đã sẵn sàng.", result.get("dateFormatted")));
            }
            case PENDING_DEPARTMENTS -> {
                streamText(emitter, intent.getReplyHint());
                sendPing(emitter);
                Map<String, Object> result = toolService.listPendingDepartments(authUser);
                sendEvent(emitter, "widget", Map.of("type", "pending_dept_table", "payload", result));
                int count = ((List<?>) result.get("departments")).size();
                if (count == 0) {
                    streamText(emitter, "Tất cả ĐƠN VỊ đã hoàn thành chấm công hôm nay.");
                } else {
                    streamText(emitter, String.format(
                            "Có %d ĐƠN VỊ đang ở trạng thái CHƯA XONG (chưa báo cáo).", count));
                }
            }
            case BATCH_REMINDERS -> emitBatchReminders(authUser, emitter, intent.getReplyHint());
            case UNKNOWN -> streamText(emitter,
                    "Tôi chưa hiểu yêu cầu này. Bạn có thể dùng các nút gợi ý hoặc hỏi: "
                            + "\"Báo cáo trạng thái làm việc hôm nay\", "
                            + "\"Xuất báo cáo chấm công ngày hôm nay\", "
                            + "\"Khoa nào chưa báo cáo?\"");
        }
    }

    private void emitBatchReminders(AuthUser authUser, SseEmitter emitter, String hint)
            throws IOException, InterruptedException {
        streamText(emitter, hint);
        sendPing(emitter);
        Map<String, Object> preview = toolService.previewBatchReminders(authUser);
        sendEvent(emitter, "widget", Map.of("type", "reminder_confirm", "payload", preview));
        int count = ((List<?>) preview.get("departments")).size();
        if (count == 0) {
            streamText(emitter, "Tất cả ĐƠN VỊ đã hoàn thành điểm danh hôm nay.");
        } else {
            streamText(emitter, String.format(
                    "Tìm thấy %d ĐƠN VỊ CHƯA XONG. Vui lòng xác nhận trước khi gửi.", count));
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
                message = String.format("Báo cáo chấm công ngày %s đã sẵn sàng.", result.get("dateFormatted"));
                widgets.add(Map.of("type", "attendance_report_table", "payload", result));
                widgets.add(Map.of("type", "download_card", "payload", result));
            }
            case "batch_reminders" -> {
                int count = ((List<?>) result.get("departments")).size();
                message = count == 0
                        ? "Không có ĐƠN VỊ nào cần nhắc nhở."
                        : String.format("Tìm thấy %d ĐƠN VỊ CHƯA XONG. Vui lòng xác nhận.", count);
                widgets.add(Map.of("type", "reminder_confirm", "payload", result));
            }
            default -> {
                message = "Đã xử lý yêu cầu.";
                widgets.add(Map.of("type", "pending_dept_table", "payload", result));
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
