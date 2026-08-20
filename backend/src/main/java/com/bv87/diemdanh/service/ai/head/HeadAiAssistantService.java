package com.bv87.diemdanh.service.ai.head;

import com.bv87.diemdanh.dto.ai.AiBatchAttendanceConfirmRequest;
import com.bv87.diemdanh.dto.ai.AiToolExecuteRequest;
import com.bv87.diemdanh.dto.ai.AiToolResultDto;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.service.AttendanceLockService;
import com.bv87.diemdanh.util.VietnamTimeService;
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

/** HEAD AI chat / tool orchestration — SPEC_AI_ASSISTANT. */
@Service
@Slf4j
public class HeadAiAssistantService {

    private static final String GREETING =
            "Chào Trưởng đơn vị, tôi có thể liệt kê nhân viên thiếu giờ ra / chưa chấm, "
                    + "và Chấm công hàng loạt (nghỉ phép / đi học / công tác / thai sản). "
                    + "Đi làm / Đi trễ chỉ ghi nhận qua vân tay.";

    private final HeadAiIntentRouter intentRouter;
    private final HeadAiToolService toolService;
    private final AttendanceLockService lockService;
    private final VietnamTimeService timeService;
    private final ObjectMapper objectMapper;
    private final Executor executor;

    public HeadAiAssistantService(
            HeadAiIntentRouter intentRouter,
            HeadAiToolService toolService,
            AttendanceLockService lockService,
            VietnamTimeService timeService,
            ObjectMapper objectMapper,
            @Qualifier("aiAssistantExecutor") Executor executor) {
        this.intentRouter = intentRouter;
        this.toolService = toolService;
        this.lockService = lockService;
        this.timeService = timeService;
        this.objectMapper = objectMapper;
        this.executor = executor;
    }

    public SseEmitter streamChat(AuthUser authUser, String message, String quickAction, LocalDate date) {
        assertHead(authUser);
        SseEmitter emitter = new SseEmitter(120_000L);
        emitter.onTimeout(emitter::complete);
        emitter.onError(ex -> emitter.complete());

        executor.execute(() -> {
            try {
                HeadAiIntent intent = intentRouter.route(quickAction, message, date);
                handleIntentStream(authUser, emitter, intent);
                sendEvent(emitter, "done", Map.of());
                emitter.complete();
            } catch (Exception ex) {
                log.error("HEAD AI stream failed", ex);
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
        assertHead(authUser);
        Map<String, Object> result = toolService.executeTool(
                authUser, request.getTool(), request.getParams());
        return buildToolResult(request.getTool(), result);
    }

    public Map<String, Object> confirmBatchAttendance(AuthUser authUser, AiBatchAttendanceConfirmRequest request) {
        assertHead(authUser);
        return toolService.confirmBatchAttendance(authUser, request.getActionId());
    }

    private void handleIntentStream(AuthUser authUser, SseEmitter emitter, HeadAiIntent intent)
            throws IOException, InterruptedException {
        switch (intent.getType()) {
            case GREETING -> streamText(emitter, GREETING);
            case STATUS_PICKER -> {
                if (!assertWritableOrExplain(authUser, emitter, intent.getArgs())) {
                    return;
                }
                streamText(emitter, intent.getReplyHint());
                sendEvent(emitter, "widget", Map.of(
                        "type", "status_picker",
                        "payload", intent.getArgs()));
            }
            case BATCH_ATTENDANCE_EXECUTE -> {
                if (!assertWritableOrExplain(authUser, emitter, intent.getArgs())) {
                    return;
                }
                emitBatchAttendancePreview(authUser, emitter, intent);
            }
            case LIST_MISSING_PUNCHES -> emitMissingPunches(authUser, emitter, intent);
            case UNKNOWN -> streamText(emitter,
                    intent.getReplyHint() != null && !intent.getReplyHint().isBlank()
                            ? intent.getReplyHint()
                            : HeadAiIntentRouter.UNKNOWN_REPLY);
        }
    }

    /**
     * SPEC §3.2 — refuse write intents before emitting widgets when HEAD cannot write.
     *
     * @return false when write is blocked (message already streamed)
     */
    private boolean assertWritableOrExplain(
            AuthUser authUser, SseEmitter emitter, Map<String, Object> args)
            throws IOException, InterruptedException {
        LocalDate date = dateFromArgs(args);
        try {
            lockService.assertCanWrite(authUser, authUser.getDeptCode(), date);
            return true;
        } catch (BusinessException | AccessDeniedException ex) {
            streamText(emitter, ex.getMessage() != null
                    ? ex.getMessage()
                    : "Không thể Chấm công hàng loạt lúc này.");
            return false;
        }
    }

    private LocalDate dateFromArgs(Map<String, Object> args) {
        if (args != null && args.get("date") != null) {
            return LocalDate.parse(args.get("date").toString());
        }
        return timeService.today();
    }

    private void emitMissingPunches(AuthUser authUser, SseEmitter emitter, HeadAiIntent intent)
            throws IOException, InterruptedException {
        streamText(emitter, intent.getReplyHint());
        sendPing(emitter);
        Map<String, Object> result = toolService.listMissingPunches(authUser, intent.getArgs());
        sendEvent(emitter, "widget", Map.of("type", "missing_punch_list", "payload", result));
        int total = ((Number) result.getOrDefault("total", 0)).intValue();
        String dateLabel = String.valueOf(result.get("dateFormatted"));
        if (total == 0) {
            streamText(emitter, "Không có trường hợp thiếu dữ liệu chấm công ngày " + dateLabel + ".");
        } else {
            streamText(emitter, String.format(
                    "Có %d trường hợp thiếu giờ ra / chưa chấm ngày %s.", total, dateLabel));
        }
    }

    private void emitBatchAttendancePreview(AuthUser authUser, SseEmitter emitter, HeadAiIntent intent)
            throws IOException, InterruptedException {
        streamText(emitter, intent.getReplyHint());
        sendPing(emitter);
        Map<String, Object> preview = toolService.previewBatchAttendance(authUser, intent.getArgs());
        sendEvent(emitter, "widget", Map.of("type", "batch_attendance_confirm", "payload", preview));
        int count = ((Number) preview.getOrDefault("targetCount", 0)).intValue();
        if (count == 0) {
            streamText(emitter, "Không có nhân viên nào phù hợp để Chấm công.");
        } else {
            streamText(emitter, String.format(
                    "Có %d nhân viên sẽ được cập nhật. Vui lòng xác nhận trước khi thực hiện.", count));
        }
    }

    private AiToolResultDto buildToolResult(String tool, Map<String, Object> result) {
        List<Map<String, Object>> widgets = new ArrayList<>();
        String message;
        if ("batch_attendance".equals(tool)) {
            int count = ((Number) result.getOrDefault("targetCount", 0)).intValue();
            message = count == 0
                    ? "Không có nhân viên nào phù hợp để Chấm công."
                    : String.format("Có %d nhân viên sẽ được cập nhật. Vui lòng xác nhận.", count);
            widgets.add(Map.of("type", "batch_attendance_confirm", "payload", result));
        } else if ("list_missing_punches".equals(tool)) {
            int total = ((Number) result.getOrDefault("total", 0)).intValue();
            String dateLabel = String.valueOf(result.get("dateFormatted"));
            message = total == 0
                    ? "Không có trường hợp thiếu dữ liệu chấm công ngày " + dateLabel + "."
                    : String.format("Có %d trường hợp thiếu dữ liệu chấm công ngày %s.", total, dateLabel);
            widgets.add(Map.of("type", "missing_punch_list", "payload", result));
        } else {
            message = "Đã xử lý yêu cầu.";
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

    private void assertHead(AuthUser authUser) {
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Chỉ Trưởng đơn vị mới sử dụng Trợ lý AI");
        }
    }
}
