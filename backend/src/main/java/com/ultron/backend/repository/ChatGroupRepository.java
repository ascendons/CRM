package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.ChatGroup;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatGroupRepository extends MongoRepository<ChatGroup, String> {
    List<ChatGroup> findByTenantIdAndMemberIdsContaining(String tenantId, String memberId);
}
