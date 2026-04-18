package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.TechnicianSkill;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TechnicianSkillRepository extends MongoRepository<TechnicianSkill, String> {

    List<TechnicianSkill> findByTenantIdAndUserIdAndIsDeletedFalse(String tenantId, String userId);

    List<TechnicianSkill> findByTenantIdAndSkillNameAndIsDeletedFalse(String tenantId, String skillName);

    List<TechnicianSkill> findByTenantIdAndExpiryDateBeforeAndIsDeletedFalse(String tenantId, LocalDate date);
}
