package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.EscalationRule;
import com.ultron.backend.domain.enums.EscalationTrigger;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EscalationRuleRepository extends MongoRepository<EscalationRule, String> {

    List<EscalationRule> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<EscalationRule> findByTenantIdAndActiveTrueAndIsDeletedFalse(String tenantId);

    List<EscalationRule> findByTenantIdAndTriggerAndActiveTrueAndIsDeletedFalse(
            String tenantId, EscalationTrigger trigger);
}
