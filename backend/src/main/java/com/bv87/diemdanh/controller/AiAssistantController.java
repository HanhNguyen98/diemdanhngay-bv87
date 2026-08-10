package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.SendReminderResultDto;
import com.bv87.diemdanh.dto.ai.AiChatRequest;
import com.bv87.diemdanh.dto.ai.AiReminderConfirmRequest;
import com.bv87.diemdanh.dto.ai.AiToolExecuteRequest;
import com.bv87.diemdanh.dto.ai.AiToolResultDto;
import com.bv87.diemdanh.service.AuthService;
import com.bv87.diemdanh.service.ai.AiAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/ai")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;
    private final AuthService authService;

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@Valid @RequestBody AiChatRequest request) {
        LocalDate preferredDate = null;
        if (request.getDate() != null && !request.getDate().isBlank()) {
            preferredDate = LocalDate.parse(request.getDate());
        }
        return aiAssistantService.streamChat(
                authService.getAuthUser(),
                request.getMessage(),
                request.getQuickAction(),
                preferredDate);
    }

    @PostMapping("/tools/execute")
    public ResponseEntity<AiToolResultDto> executeTool(@RequestBody AiToolExecuteRequest request) {
        return ResponseEntity.ok(aiAssistantService.executeTool(authService.getAuthUser(), request));
    }

    @PostMapping("/tools/confirm-reminders")
    public ResponseEntity<SendReminderResultDto> confirmReminders(
            @Valid @RequestBody AiReminderConfirmRequest request) {
        return ResponseEntity.ok(aiAssistantService.confirmReminders(authService.getAuthUser(), request));
    }
}

