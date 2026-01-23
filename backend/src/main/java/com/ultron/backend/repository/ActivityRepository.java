package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Activity;
import com.ultron.backend.domain.enums.ActivityType;
import com.ultron.backend.domain.enums.ActivityStatus;
import com.ultron.backend.domain.enums.ActivityPriority;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityRepository extends MongoRepository<Activity, String> {

    Optional<Activity> findByActivityId(String activityId);

    List<Activity> findByIsDeletedFalse();

    List<Activity> findByTypeAndIsDeletedFalse(ActivityType type);

    List<Activity> findByStatusAndIsDeletedFalse(ActivityStatus status);

    List<Activity> findByPriorityAndIsDeletedFalse(ActivityPriority priority);

    List<Activity> findByLeadIdAndIsDeletedFalse(String leadId);

    List<Activity> findByContactIdAndIsDeletedFalse(String contactId);

    List<Activity> findByAccountIdAndIsDeletedFalse(String accountId);

    List<Activity> findByOpportunityIdAndIsDeletedFalse(String opportunityId);

    List<Activity> findByAssignedToIdAndIsDeletedFalse(String assignedToId);

    @Query("{ 'isDeleted': false, 'status': { $in: ['PENDING', 'IN_PROGRESS'] } }")
    List<Activity> findActiveActivities();

    @Query("{ 'isDeleted': false, 'status': 'COMPLETED' }")
    List<Activity> findCompletedActivities();

    @Query("{ 'isDeleted': false, 'dueDate': { $lt: ?0 }, 'status': { $in: ['PENDING', 'IN_PROGRESS'] } }")
    List<Activity> findOverdueActivities(LocalDateTime now);

    @Query("{ 'isDeleted': false, 'scheduledDate': { $gte: ?0, $lte: ?1 } }")
    List<Activity> findActivitiesByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    @Query("{ 'isDeleted': false, '$or': [ " +
            "{ 'subject': { $regex: ?0, $options: 'i' } }, " +
            "{ 'description': { $regex: ?0, $options: 'i' } }, " +
            "{ 'leadName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'contactName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'accountName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'opportunityName': { $regex: ?0, $options: 'i' } } ] }")
    List<Activity> searchActivities(String searchTerm);

    long countByIsDeletedFalse();

    long countByTypeAndIsDeletedFalse(ActivityType type);

    long countByStatusAndIsDeletedFalse(ActivityStatus status);
}
