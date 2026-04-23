package com.ultron.backend.service;

import com.ultron.backend.domain.entity.SavedReport;
import com.ultron.backend.domain.enums.ReportDataSource;
import com.ultron.backend.repository.SavedReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportBuilderService extends BaseTenantService {

    private final SavedReportRepository savedReportRepository;
    private final MongoTemplate mongoTemplate;

    public SavedReport createReport(SavedReport report) {
        String tenantId = getCurrentTenantId();
        report.setReportId("RPT-" + System.currentTimeMillis());
        report.setTenantId(tenantId);
        report.setCreatedBy(getCurrentUserId());
        report.setCreatedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());
        report.setUpdatedBy(getCurrentUserId());
        report.setDeleted(false);
        return savedReportRepository.save(report);
    }

    public List<SavedReport> getAll() {
        return savedReportRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId());
    }

    public SavedReport getById(String reportId) {
        return savedReportRepository.findByReportIdAndTenantId(reportId, getCurrentTenantId())
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));
    }

    public SavedReport updateReport(String reportId, SavedReport updated) {
        SavedReport existing = getById(reportId);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getDataSource() != null) existing.setDataSource(updated.getDataSource());
        if (updated.getFilters() != null) existing.setFilters(updated.getFilters());
        if (updated.getColumns() != null) existing.setColumns(updated.getColumns());
        if (updated.getGroupBy() != null) existing.setGroupBy(updated.getGroupBy());
        if (updated.getChartType() != null) existing.setChartType(updated.getChartType());
        existing.setScheduled(updated.isScheduled());
        existing.setScheduleFrequency(updated.getScheduleFrequency());
        existing.setRecipientEmails(updated.getRecipientEmails());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(getCurrentUserId());
        return savedReportRepository.save(existing);
    }

    public void deleteReport(String reportId) {
        SavedReport report = getById(reportId);
        report.setDeleted(true);
        report.setUpdatedAt(LocalDateTime.now());
        savedReportRepository.save(report);
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> runReport(String reportId) {
        SavedReport report = getById(reportId);
        String tenantId = getCurrentTenantId();
        String collectionName = getCollectionName(report.getDataSource());

        List<AggregationOperation> pipeline = new ArrayList<>();
        pipeline.add(Aggregation.match(Criteria.where("tenantId").is(tenantId).and("isDeleted").is(false)));

        if (report.getFilters() != null) {
            for (SavedReport.ReportFilter filter : report.getFilters()) {
                Criteria c = applyFilter(filter);
                if (c != null) pipeline.add(Aggregation.match(c));
            }
        }

        if (report.getGroupBy() != null && !report.getGroupBy().isBlank()) {
            pipeline.add(Aggregation.group(report.getGroupBy()).count().as("count"));
        }

        Aggregation agg = Aggregation.newAggregation(pipeline);
        return mongoTemplate.aggregate(agg, collectionName, Map.class)
                .getMappedResults()
                .stream()
                .map(m -> (Map<String, Object>) m)
                .toList();
    }

    private String getCollectionName(ReportDataSource source) {
        if (source == null) return "leads";
        return switch (source) {
            case LEADS -> "leads";
            case OPPORTUNITIES -> "opportunities";
            case WORK_ORDERS -> "work_orders";
            case ATTENDANCE -> "attendances";
            case INVOICES -> "proposals";
            case ACTIVITIES -> "activities";
        };
    }

    private Criteria applyFilter(SavedReport.ReportFilter filter) {
        if (filter.getField() == null || filter.getValue() == null) return null;
        return switch (filter.getOperator() != null ? filter.getOperator() : "eq") {
            case "eq" -> Criteria.where(filter.getField()).is(filter.getValue());
            case "ne" -> Criteria.where(filter.getField()).ne(filter.getValue());
            case "contains" -> Criteria.where(filter.getField()).regex(filter.getValue(), "i");
            default -> Criteria.where(filter.getField()).is(filter.getValue());
        };
    }
}
