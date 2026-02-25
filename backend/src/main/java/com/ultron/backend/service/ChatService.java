package com.ultron.backend.service;

import com.ultron.backend.domain.entity.ChatMessage;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.dto.response.ChatMessageDTO;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatGroupRepository chatGroupRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatMessageDTO saveAndSendMessage(String senderId, String recipientId, String recipientType, String content) {
        String tenantId = TenantContext.getTenantId();
        
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
        
        return messages.map(msg -> {
            User sender = userRepository.findById(msg.getSenderId()).orElse(null);
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
}
