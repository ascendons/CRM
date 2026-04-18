package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.WorkOrder;
import com.ultron.backend.domain.enums.WorkOrderPriority;
import com.ultron.backend.domain.enums.WorkOrderStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderRepository extends MongoRepository<WorkOrder, String> {

    Optional<WorkOrder> findByWoNumberAndTenantId(String woNumber, String tenantId);

    List<WorkOrder> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<WorkOrder> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, WorkOrderStatus status);

    List<WorkOrder> findByTenantIdAndAccountIdAndIsDeletedFalse(String tenantId, String accountId);

    List<WorkOrder> findByTenantIdAndAssetIdAndIsDeletedFalse(String tenantId, String assetId);

    List<WorkOrder> findByTenantIdAndAssignedEngineerIdsContainingAndIsDeletedFalse(
            String tenantId, String engineerId);

    List<WorkOrder> findByTenantIdAndSlaBreachedTrueAndIsDeletedFalse(String tenantId);

    List<WorkOrder> findByTenantIdAndSlaDeadlineBeforeAndStatusNotAndIsDeletedFalse(
            String tenantId, LocalDateTime deadline, WorkOrderStatus excludeStatus);

    List<WorkOrder> findByTenantIdAndPriorityAndIsDeletedFalse(String tenantId, WorkOrderPriority priority);
}
