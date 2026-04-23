package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.TaskComment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCommentRepository extends MongoRepository<TaskComment, String> {

    List<TaskComment> findByTenantIdAndTaskIdOrderByCreatedAtAsc(String tenantId, String taskId);
}
