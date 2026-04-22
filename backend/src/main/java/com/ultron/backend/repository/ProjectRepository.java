package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Project;
import com.ultron.backend.domain.enums.ProjectStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {

    Optional<Project> findByProjectIdAndTenantId(String projectId, String tenantId);

    List<Project> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<Project> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, ProjectStatus status);

    List<Project> findByTenantIdAndOwnerIdAndIsDeletedFalse(String tenantId, String ownerId);

    List<Project> findByTenantIdAndMemberIdsContainingAndIsDeletedFalse(String tenantId, String memberId);

    Optional<Project> findFirstByOrderByCreatedAtDesc();
}
