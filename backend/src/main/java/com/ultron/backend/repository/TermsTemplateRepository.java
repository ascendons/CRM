package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.TermsTemplate;
import com.ultron.backend.domain.enums.TermsType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TermsTemplateRepository extends MongoRepository<TermsTemplate, String> {

    List<TermsTemplate> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<TermsTemplate> findByTenantIdAndTypeAndIsDeletedFalse(String tenantId, TermsType type);

    Optional<TermsTemplate> findByIdAndTenantId(String id, String tenantId);

    /**
     * Find templates by tenantId, type, and isDefault=true that are not deleted.
     * Used to clear existing default when a new default is set.
     */
    List<TermsTemplate> findByTenantIdAndTypeAndIsDefaultTrueAndIsDeletedFalse(String tenantId, TermsType type);
}
