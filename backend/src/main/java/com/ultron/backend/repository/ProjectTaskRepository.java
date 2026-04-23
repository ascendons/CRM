package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.ProjectTask;
import com.ultron.backend.domain.enums.TaskStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectTaskRepository extends MongoRepository<ProjectTask, String> {

    Optional<ProjectTask> findByTaskIdAndTenantId(String taskId, String tenantId);

    List<ProjectTask> findByTenantIdAndProjectIdAndIsDeletedFalse(String tenantId, String projectId);

    List<ProjectTask> findByTenantIdAndAssigneeIdsContainingAndIsDeletedFalse(String tenantId, String assigneeId);

    List<ProjectTask> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, TaskStatus status);

    List<ProjectTask> findByTenantIdAndParentTaskIdAndIsDeletedFalse(String tenantId, String parentTaskId);

    List<ProjectTask> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<ProjectTask> findFirstByOrderByCreatedAtDesc();
}
