package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.OnboardingTemplate;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;
public interface OnboardingTemplateRepository extends MongoRepository<OnboardingTemplate, String> {
    List<OnboardingTemplate> findByTenantIdAndIsDeletedFalse(String tenantId);
    Optional<OnboardingTemplate> findByTemplateIdAndTenantIdAndIsDeletedFalse(String templateId, String tenantId);
}
