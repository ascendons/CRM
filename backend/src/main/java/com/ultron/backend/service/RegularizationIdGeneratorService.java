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
 * Service to generate unique regularization IDs in format: REG-YYYY-MM-XXXXX
 * Example: REG-2026-03-00125
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RegularizationIdGeneratorService {

    private final MongoTemplate mongoTemplate;
    private static final String SEQUENCE_NAME_PREFIX = "regularization_id_";
    private static final String ID_PREFIX = "REG";

    /**
     * Generate next regularization ID for current month
     * Format: REG-YYYY-MM-XXXXX
     */
    public String generateRegularizationId() {
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

        // Format: REG-YYYY-MM-XXXXX
        String regularizationId = String.format("%s-%s-%05d",
                ID_PREFIX,
                yearMonth,
                sequenceNumber
        );

        log.debug("Generated regularization ID: {} for tenant: {}", regularizationId, tenantId);
        return regularizationId;
    }
}
