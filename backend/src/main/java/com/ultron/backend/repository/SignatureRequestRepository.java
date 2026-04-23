package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.SignatureRequest;
import com.ultron.backend.domain.enums.SignatureStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SignatureRequestRepository extends MongoRepository<SignatureRequest, String> {
    Optional<SignatureRequest> findByToken(String token);
    Optional<SignatureRequest> findByRequestIdAndTenantId(String requestId, String tenantId);
    List<SignatureRequest> findByTenantIdAndDocumentId(String tenantId, String documentId);
    List<SignatureRequest> findByTenantIdAndIsDeletedFalse(String tenantId);
    List<SignatureRequest> findByStatus(SignatureStatus status);
}
