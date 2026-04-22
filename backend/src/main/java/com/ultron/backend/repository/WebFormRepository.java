package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.WebForm;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WebFormRepository extends MongoRepository<WebForm, String> {

    List<WebForm> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<WebForm> findByFormIdAndTenantId(String formId, String tenantId);

    Optional<WebForm> findByFormId(String formId);
}
