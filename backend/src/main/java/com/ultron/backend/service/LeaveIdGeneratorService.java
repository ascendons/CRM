package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Sequence;
import com.ultron.backend.multitenancy.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Service to generate unique leave IDs in format: LVE-YYYY-MM-XXXXX
 * Example: LVE-2026-03-00125
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveIdGeneratorService {

    private final MongoTemplate mongoTemplate;
    private static final String SEQUENCE_NAME_PREFIX = "leave_id_";
    private static final String ID_PREFIX = "LVE";

    /**
     * Generate next leave ID for current month
     * Format: LVE-YYYY-MM-XXXXX
     */
    public String generateLeaveId() {
        String tenantId = TenantContext.getTenantId();
        LocalDate now = LocalDate.now();
        String yearMonth = now.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        String sequenceName = SEQUENCE_NAME_PREFIX + tenantId + "_" + yearMonth;

        // Get next sequence number
        Query query = new Query(Criteria.where("_id").is(sequenceName));
        Update update = new Update().inc("sequence", 1);
        FindAndModifyOptions options = FindAndModifyOptions.options()
                .returnNew(true)
                .upsert(true);

        Sequence sequence = mongoTemplate.findAndModify(
                query,
                update,
                options,
                Sequence.class
        );

        long sequenceNumber = (sequence != null) ? sequence.getSequence() : 1L;

        // Format: LVE-YYYY-MM-XXXXX
        String leaveId = String.format("%s-%s-%05d",
                ID_PREFIX,
                yearMonth,
                sequenceNumber
        );

        log.debug("Generated leave ID: {} for tenant: {}", leaveId, tenantId);
        return leaveId;
    }

    /**
     * Reset sequence for a specific month (admin operation)
     */
    public void resetMonthlySequence(int year, int month) {
        String tenantId = TenantContext.getTenantId();
        String yearMonth = String.format("%04d-%02d", year, month);
        String sequenceName = SEQUENCE_NAME_PREFIX + tenantId + "_" + yearMonth;

        Query query = new Query(Criteria.where("_id").is(sequenceName));
        mongoTemplate.remove(query, Sequence.class);

        log.info("Reset leave ID sequence for tenant: {}, year-month: {}", tenantId, yearMonth);
    }
}
