package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.RateContract;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RateContractRepository extends MongoRepository<RateContract, String> {

    List<RateContract> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<RateContract> findByTenantIdAndVendorIdAndIsDeletedFalse(String tenantId, String vendorId);

    List<RateContract> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, String status);

    List<RateContract> findByTenantIdAndValidToBeforeAndStatusAndIsDeletedFalse(
            String tenantId, LocalDate date, String status);
}
