package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.SavedReport;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedReportRepository extends MongoRepository<SavedReport, String> {
    Optional<SavedReport> findByReportIdAndTenantId(String reportId, String tenantId);
    List<SavedReport> findByTenantIdAndIsDeletedFalse(String tenantId);
    List<SavedReport> findByIsScheduledTrueAndIsDeletedFalse();
}
