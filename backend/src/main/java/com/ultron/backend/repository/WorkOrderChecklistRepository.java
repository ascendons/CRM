package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.WorkOrderChecklist;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderChecklistRepository extends MongoRepository<WorkOrderChecklist, String> {

    List<WorkOrderChecklist> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<WorkOrderChecklist> findByTenantIdAndAssetCategoryIdAndIsDeletedFalse(
            String tenantId, String assetCategoryId);
}
