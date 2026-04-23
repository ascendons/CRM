package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.DealerOrder;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DealerOrderRepository extends MongoRepository<DealerOrder, String> {

    List<DealerOrder> findByTenantIdAndDealerIdAndIsDeletedFalse(String tenantId, String dealerId);

    List<DealerOrder> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, String status);

    List<DealerOrder> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<DealerOrder> findByIsDeletedFalse();
}
