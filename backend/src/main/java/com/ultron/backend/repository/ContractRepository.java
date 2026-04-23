package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Contract;
import com.ultron.backend.domain.enums.ContractStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends MongoRepository<Contract, String> {

    Optional<Contract> findByContractNumberAndTenantId(String contractNumber, String tenantId);

    List<Contract> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<Contract> findByTenantIdAndAccountIdAndIsDeletedFalse(String tenantId, String accountId);

    List<Contract> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, ContractStatus status);

    List<Contract> findByTenantIdAndEndDateBeforeAndIsDeletedFalse(String tenantId, LocalDate date);

    List<Contract> findByTenantIdAndEndDateBetweenAndIsDeletedFalse(String tenantId, LocalDate from, LocalDate to);
}
