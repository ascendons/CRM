package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.OnboardingInstance;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;
public interface OnboardingInstanceRepository extends MongoRepository<OnboardingInstance, String> {
    List<OnboardingInstance> findByTenantIdAndIsDeletedFalse(String tenantId);
    List<OnboardingInstance> findByEmployeeIdAndTenantIdAndIsDeletedFalse(String employeeId, String tenantId);
    Optional<OnboardingInstance> findByInstanceIdAndTenantIdAndIsDeletedFalse(String instanceId, String tenantId);
}
