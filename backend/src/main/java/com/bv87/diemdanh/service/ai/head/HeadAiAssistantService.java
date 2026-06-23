package com.bv87.diemdanh.service.ai.head;

import com.bv87.diemdanh.dto.ai.AiBatchAttendanceConfirmRequest;
import com.bv87.diemdanh.dto.ai.AiToolExecuteRequest;
import com.bv87.diemdanh.dto.ai.AiToolResultDto;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.security.AuthUser;
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
public class HeadAiAssistantService {

    private static final String GREETING =
            "Chào Trưởng đơn vị, tôi có thể giúp bạn Điểm danh hàng loạt cho nhân viên CHƯA CHẤM.";

    private final HeadAiIntentRouter intentRouter;
    private final HeadAiToolService toolService;
    private final ObjectMapper objectMapper;
    private final Executor executor;

    public HeadAiAssistantService(
            HeadAiIntentRouter intentRouter,
            HeadAiToolService toolService,
            ObjectMapper objectMapper,
            @Qualifier("aiAssistantExecutor") Executor executor) {
        this.intentRouter = intentRouter;
        this.toolService = toolService;
        this.objectMapper = objectMapper;
        this.executor = executor;
    }

    public SseEmitter streamChat(AuthUser authUser, String message, String quickAction) {
        assertHead(authUser);
        SseEmitter emitter = new SseEmitter(120_000L);
        emitter.onTimeout(emitter::complete);
        emitter.onError(ex -> emitter.complete());

        executor.execute(() -> {
            try {
                HeadAiIntent intent = intentRouter.route(quickAction, message);
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
                streamText(emitter, intent.getReplyHint());
                sendEvent(emitter, "widget", Map.of(
                        "type", "status_picker",
                        "payload", intent.getArgs()));
            }
            case BATCH_ATTENDANCE_EXECUTE -> emitBatchAttendancePreview(authUser, emitter, intent);
            case UNKNOWN -> streamText(emitter,
                    "Tôi chưa hiểu yêu cầu này. Bạn có thể dùng nút \"Điểm danh hàng loạt\" "
                            + "hoặc nhập: \"Điểm danh đi làm cho tất cả\".");
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
            streamText(emitter, "Không có nhân viên nào phù hợp để Điểm danh.");
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
                    ? "Không có nhân viên nào phù hợp để Điểm danh."
                    : String.format("Có %d nhân viên sẽ được cập nhật. Vui lòng xác nhận.", count);
            widgets.add(Map.of("type", "batch_attendance_confirm", "payload", result));
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
