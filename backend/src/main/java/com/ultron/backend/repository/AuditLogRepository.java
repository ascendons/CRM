package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    // Find by entity
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);
    Page<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId, Pageable pageable);

    // Find by user
    List<AuditLog> findByUserIdOrderByTimestampDesc(String userId);
    Page<AuditLog> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);

    // Find by entity type
    List<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType);
    Page<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);

    // Find by action
    List<AuditLog> findByActionOrderByTimestampDesc(String action);
    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    // Find by time range
    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);
    Page<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);

    // Combined queries
    List<AuditLog> findByEntityTypeAndActionOrderByTimestampDesc(String entityType, String action);
    List<AuditLog> findByUserIdAndEntityTypeOrderByTimestampDesc(String userId, String entityType);
}
