package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.ai.AiBatchAttendanceConfirmRequest;
import com.bv87.diemdanh.dto.ai.AiChatRequest;
import com.bv87.diemdanh.dto.ai.AiToolExecuteRequest;
import com.bv87.diemdanh.dto.ai.AiToolResultDto;
import com.bv87.diemdanh.service.AuthService;
import com.bv87.diemdanh.service.ai.head.HeadAiAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/head/ai")
@RequiredArgsConstructor
public class HeadAiAssistantController {

    private final HeadAiAssistantService headAiAssistantService;
    private final AuthService authService;

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@Valid @RequestBody AiChatRequest request) {
        return headAiAssistantService.streamChat(
                authService.getAuthUser(),
                request.getMessage(),
                request.getQuickAction());
    }

    @PostMapping("/tools/execute")
    public ResponseEntity<AiToolResultDto> executeTool(@RequestBody AiToolExecuteRequest request) {
        return ResponseEntity.ok(headAiAssistantService.executeTool(authService.getAuthUser(), request));
    }

    @PostMapping("/tools/confirm-batch-attendance")
    public ResponseEntity<Map<String, Object>> confirmBatchAttendance(
            @Valid @RequestBody AiBatchAttendanceConfirmRequest request) {
        return ResponseEntity.ok(headAiAssistantService.confirmBatchAttendance(
                authService.getAuthUser(), request));
    }
}
