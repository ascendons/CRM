package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.UserActivity;
import com.ultron.backend.domain.entity.UserActivity.ActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserActivityRepository extends MongoRepository<UserActivity, String> {

    // Find by business ID
    Optional<UserActivity> findByActivityId(String activityId);

    // Find by user
    List<UserActivity> findByUserIdOrderByTimestampDesc(String userId);
    Page<UserActivity> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);

    // Find by action type
    List<UserActivity> findByActionTypeOrderByTimestampDesc(ActionType actionType);
    Page<UserActivity> findByActionTypeOrderByTimestampDesc(ActionType actionType, Pageable pageable);

    // Find by entity type
    List<UserActivity> findByEntityTypeOrderByTimestampDesc(String entityType);
    Page<UserActivity> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);

    // Find by entity
    List<UserActivity> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);
    Page<UserActivity> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId, Pageable pageable);

    // Find by time range
    List<UserActivity> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);
    Page<UserActivity> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);

    // Combined queries
    List<UserActivity> findByUserIdAndActionTypeOrderByTimestampDesc(String userId, ActionType actionType);
    Page<UserActivity> findByUserIdAndActionTypeOrderByTimestampDesc(String userId, ActionType actionType, Pageable pageable);

    List<UserActivity> findByUserIdAndEntityTypeOrderByTimestampDesc(String userId, String entityType);
    Page<UserActivity> findByUserIdAndEntityTypeOrderByTimestampDesc(String userId, String entityType, Pageable pageable);

    List<UserActivity> findByUserIdAndTimestampBetweenOrderByTimestampDesc(String userId, LocalDateTime start, LocalDateTime end);
    Page<UserActivity> findByUserIdAndTimestampBetweenOrderByTimestampDesc(String userId, LocalDateTime start, LocalDateTime end, Pageable pageable);

    List<UserActivity> findByActionTypeAndEntityTypeOrderByTimestampDesc(ActionType actionType, String entityType);
    Page<UserActivity> findByActionTypeAndEntityTypeOrderByTimestampDesc(ActionType actionType, String entityType, Pageable pageable);

    // All activities with pagination
    Page<UserActivity> findAllByOrderByTimestampDesc(Pageable pageable);

    // Count queries for statistics
    long countByUserId(String userId);
    long countByActionType(ActionType actionType);
    long countByEntityType(String entityType);
    long countByUserIdAndTimestampBetween(String userId, LocalDateTime start, LocalDateTime end);
    long countByTimestampBetween(LocalDateTime start, LocalDateTime end);
}
