package com.ultron.backend.controller;

import com.ultron.backend.dto.response.ChatMessageDTO;
import com.ultron.backend.service.ChatService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    /**
     * Handle incoming STOMP messages.
     * Maps to /app/chat.send.
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessagePayload payload, Authentication authentication) {
        String senderId = authentication.getName();
        log.debug("Received chat message from user {} to recipient {}", senderId, payload.getRecipientId());
        
        chatService.saveAndSendMessage(senderId, payload.getRecipientId(), payload.getRecipientType(), payload.getContent());
    }

    /**
     * REST endpoint to fetch chat history.
     */
    @GetMapping("/history/{recipientType}/{recipientId}")
    public ResponseEntity<Page<ChatMessageDTO>> getChatHistory(
            @PathVariable String recipientType,
            @PathVariable String recipientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication) {

        String senderId = authentication.getName();
        Pageable pageable = PageRequest.of(page, size);
        Page<ChatMessageDTO> history = chatService.getChatHistory(senderId, recipientId, recipientType, pageable);

        return ResponseEntity.ok(history);
    }

    /**
     * Handle typing indicator events via WebSocket.
     * Maps to /app/chat.typing
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingEvent payload, Authentication authentication) {
        String userId = authentication.getName();
        log.debug("User {} is typing to {}", userId, payload.getRecipientId());

        chatService.sendTypingIndicator(userId, payload.getRecipientId(), payload.getRecipientType(), payload.isTyping());
    }
}

/**
 * Typing event payload
 */
@Data
class TypingEvent {
    @NotBlank
    private String recipientId;

    @NotBlank
    private String recipientType;

    private boolean typing;
}

@Data
class ChatMessagePayload {
    @NotBlank(message = "Recipient ID is required")
    private String recipientId;

    @NotBlank(message = "Recipient type is required")
    private String recipientType;

    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 5000, message = "Message is too long (max 5000 characters)")
    private String content;
}
