package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.WebFormSubmission;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebFormSubmissionRepository extends MongoRepository<WebFormSubmission, String> {

    List<WebFormSubmission> findByTenantIdAndFormId(String tenantId, String formId);
}
