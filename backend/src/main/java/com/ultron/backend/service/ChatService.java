package com.ultron.backend.service;

import com.ultron.backend.domain.entity.ChatMessage;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.dto.response.ChatMessageDTO;
import com.ultron.backend.exception.UnauthorizedException;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.ChatMessageRepository;
import com.ultron.backend.repository.UserRepository;
import com.ultron.backend.repository.ChatGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatGroupRepository chatGroupRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatAuthorizationService authorizationService;

    public ChatMessageDTO saveAndSendMessage(String senderId, String recipientId, String recipientType, String content) {
        String tenantId = TenantContext.getTenantId();

        // Security check: Verify sender has permission to send to this recipient
        if (!authorizationService.canSendMessage(senderId, recipientId, recipientType)) {
            log.warn("User {} not authorized to send message to {} (type: {})", senderId, recipientId, recipientType);
            throw new UnauthorizedException("Not authorized to send message to this recipient");
        }

        ChatMessage message = ChatMessage.builder()
                .tenantId(tenantId)
                .senderId(senderId)
                .recipientId(recipientId)
                .recipientType(recipientType)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();

        message = chatMessageRepository.save(message);
        
        User sender = userRepository.findById(senderId).orElse(null);
        String senderName = sender != null ? sender.getFullName() : "Unknown User";
        
        ChatMessageDTO messageDTO = ChatMessageDTO.builder()
                .id(message.getId())
                .senderId(senderId)
                .senderName(senderName)
                .recipientId(recipientId)
                .recipientType(recipientType)
                .content(content)
                .timestamp(message.getTimestamp())
                .build();

        // Send to WebSocket
        if ("ALL".equalsIgnoreCase(recipientId)) {
            // Broadcast to the whole tenant
            messagingTemplate.convertAndSend("/topic/tenant." + tenantId + ".chat", messageDTO);
        } else if ("GROUP".equalsIgnoreCase(recipientType)) {
            // Broadcast to all members of the group
            chatGroupRepository.findById(recipientId).ifPresent(group -> {
                group.getMemberIds().forEach(memberId -> {
                    messagingTemplate.convertAndSendToUser(memberId, "/queue/chat", messageDTO);
                });
            });
        } else {
            // Send to exact recipient
            messagingTemplate.convertAndSendToUser(recipientId, "/queue/chat", messageDTO);
            // Don't send back to sender if they are identical (though mostly sender != recipient)
            if (!senderId.equals(recipientId)) {
                messagingTemplate.convertAndSendToUser(senderId, "/queue/chat", messageDTO);
            }
        }
        
        return messageDTO;
    }
    
    public Page<ChatMessageDTO> getChatHistory(String senderId, String recipientId, String recipientType, Pageable pageable) {
        String tenantId = TenantContext.getTenantId();

        // Security check: Verify user has permission to read this chat
        if (!authorizationService.canReadChat(senderId, recipientId, recipientType)) {
            log.warn("User {} not authorized to read chat with {} (type: {})", senderId, recipientId, recipientType);
            throw new UnauthorizedException("Not authorized to read this chat");
        }

        Page<ChatMessage> messages;
        if ("ALL".equalsIgnoreCase(recipientId)) {
            messages = chatMessageRepository.findByTenantIdAndRecipientId(tenantId, "ALL", pageable);
        } else if ("GROUP".equalsIgnoreCase(recipientType)) {
            messages = chatMessageRepository.findByTenantIdAndRecipientIdAndRecipientTypeOrderByTimestampDesc(tenantId, recipientId, "GROUP", pageable);
        } else {
            // Get messages between sender and recipient
            messages = chatMessageRepository.findByTenantIdAndSenderIdAndRecipientIdOrTenantIdAndSenderIdAndRecipientIdOrderByTimestampDesc(
                    tenantId, senderId, recipientId,
                    tenantId, recipientId, senderId,
                    pageable);
        }
        
        // Fix N+1 query: Batch load all unique senders
        List<ChatMessage> messageList = messages.getContent();
        Set<String> senderIds = messageList.stream()
                .map(ChatMessage::getSenderId)
                .collect(Collectors.toSet());

        // Batch load all users in one query
        Map<String, User> usersMap = userRepository.findAllById(senderIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        // Map messages to DTOs using the cached user map
        return messages.map(msg -> {
            User sender = usersMap.get(msg.getSenderId());
            return ChatMessageDTO.builder()
                    .id(msg.getId())
                    .senderId(msg.getSenderId())
                    .senderName(sender != null ? sender.getFullName() : "Unknown User")
                    .recipientId(msg.getRecipientId())
                    .recipientType(msg.getRecipientType())
                    .content(msg.getContent())
                    .timestamp(msg.getTimestamp())
                    .build();
        });
    }

    /**
     * Send typing indicator to recipient via WebSocket.
     * No persistence - ephemeral real-time event only.
     */
    public void sendTypingIndicator(String userId, String recipientId, String recipientType, boolean isTyping) {
        String tenantId = TenantContext.getTenantId();

        // Get user info for the typing indicator
        User user = userRepository.findById(userId).orElse(null);
        String userName = user != null ? user.getFullName() : "Unknown User";

        // Create typing event DTO
        Map<String, Object> typingEvent = new HashMap<>();
        typingEvent.put("userId", userId);
        typingEvent.put("userName", userName);
        typingEvent.put("recipientId", recipientId);
        typingEvent.put("recipientType", recipientType);
        typingEvent.put("isTyping", isTyping);
        typingEvent.put("timestamp", LocalDateTime.now());

        // Send to appropriate channel
        if ("GROUP".equalsIgnoreCase(recipientType)) {
            // Send to group members
            chatGroupRepository.findById(recipientId).ifPresent(group -> {
                group.getMemberIds().forEach(memberId -> {
                    if (!memberId.equals(userId)) { // Don't send back to typer
                        messagingTemplate.convertAndSendToUser(memberId, "/queue/typing", typingEvent);
                    }
                });
            });
        } else {
            // Send to direct recipient
            messagingTemplate.convertAndSendToUser(recipientId, "/queue/typing", typingEvent);
        }

        log.debug("Typing indicator sent from {} to {} (typing: {})", userId, recipientId, isTyping);
    }
}
