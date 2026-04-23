package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.PortalSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PortalSessionRepository extends MongoRepository<PortalSession, String> {
    Optional<PortalSession> findByMagicToken(String magicToken);
    Optional<PortalSession> findByCustomerEmailAndTenantId(String email, String tenantId);
}
