package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Organization;
import com.ultron.backend.domain.entity.ProposalCounter;
import com.ultron.backend.repository.OrganizationRepository;
import com.ultron.backend.repository.ProposalCounterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Generates proposal IDs and user-facing reference numbers.
 *
 * Internal ID : PROP-{timestamp}         — unchanged, primary key
 * Display ref : {PREFIX}/{FY}/P{SERIAL}  — e.g. RKE/26/P001
 *
 * State lives in proposal_counters (one row per org per FY).
 * The prefix is locked into the counter row on the first proposal of each FY,
 * so a mid-year prefix change in settings only takes effect from the next FY.
 */
@Service
@RequiredArgsConstructor
public class ProposalIdGeneratorService {

    private final MongoTemplate mongoTemplate;
    private final OrganizationRepository organizationRepository;
    private final ProposalCounterRepository proposalCounterRepository;

    /** Internal timestamp-based ID — unchanged. */
    public synchronized String generateProposalId() {
        return String.format("PROP-%d", System.currentTimeMillis());
    }

    /**
     * Generate the display reference number for a new proposal.
     * Atomically increments the counter row for this org + financial year.
     * The prefix used is locked to whatever was set when the FY counter was first created.
     */
    public String generateReferenceNumber(String tenantId) {
        String fy = financialYearSuffix();
        // Prefix from org settings — only used on first proposal of the FY (setOnInsert)
        String currentPrefix = resolvePrefix(tenantId);
        ProposalCounter counter = incrementCounter(tenantId, currentPrefix, fy);
        // Always use the prefix stored in the counter row (locked at FY start)
        return String.format("%s/%s/P%03d", counter.getProposalPrefix(), fy, counter.getCounter());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String resolvePrefix(String tenantId) {
        return organizationRepository.findById(tenantId)
                .map(Organization::getSettings)
                .map(Organization.OrganizationSettings::getProposalPrefix)
                .filter(p -> p != null && !p.isBlank())
                .map(String::toUpperCase)
                .orElse("PROP");
    }

    /** Last 2 digits of the financial year end (Apr–Mar cycle). */
    private String financialYearSuffix() {
        LocalDate today = LocalDate.now();
        int year = today.getMonthValue() >= 4 ? today.getYear() + 1 : today.getYear();
        return String.valueOf(year).substring(2); // 2026 → "26"
    }

    /**
     * Atomically increment the counter for this org + FY.
     * On first use (upsert), the prefix is locked in via setOnInsert.
     * Throws if MongoDB returns an unexpected null (should never happen with upsert).
     */
    private ProposalCounter incrementCounter(String tenantId, String prefix, String fy) {
        Query query = Query.query(
                Criteria.where("tenantId").is(tenantId)
                        .and("financialYear").is(fy)
        );
        Update update = new Update()
                .inc("counter", 1)
                .setOnInsert("tenantId", tenantId)
                .setOnInsert("proposalPrefix", prefix)  // locked at FY start, never overwritten
                .setOnInsert("financialYear", fy);
        FindAndModifyOptions options = FindAndModifyOptions.options().returnNew(true).upsert(true);

        ProposalCounter result = mongoTemplate.findAndModify(
                query, update, options, ProposalCounter.class, "proposal_counters"
        );
        if (result == null) {
            throw new IllegalStateException(
                "Failed to increment proposal counter for tenant=" + tenantId + " FY=" + fy);
        }
        return result;
    }
}
