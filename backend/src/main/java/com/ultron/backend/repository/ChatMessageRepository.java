package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    // Find messages for a specific tenant and recipient (could be a user or 'ALL')
    Page<ChatMessage> findByTenantIdAndRecipientId(String tenantId, String recipientId, Pageable pageable);

    // Find messages for a custom group
    Page<ChatMessage> findByTenantIdAndRecipientIdAndRecipientTypeOrderByTimestampDesc(String tenantId, String recipientId, String recipientType, Pageable pageable);

    // Find messages between two specific users (direct messages) in a tenant
    Page<ChatMessage> findByTenantIdAndSenderIdAndRecipientIdOrTenantIdAndSenderIdAndRecipientIdOrderByTimestampDesc(
            String tenantId1, String senderId1, String recipientId1,
            String tenantId2, String senderId2, String recipientId2,
            Pageable pageable);
}
