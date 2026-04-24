package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Tracks the proposal reference number counter per organisation per financial year.
 * One document per (tenantId, financialYear) pair.
 * Counter increments atomically on each new proposal.
 */
@Document(collection = "proposal_counters")
@CompoundIndex(name = "tenant_fy_unique", def = "{'tenantId': 1, 'financialYear': 1}", unique = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalCounter {

    @Id
    private String id;

    private String tenantId;
    private String proposalPrefix;   // e.g. "RKE"
    private String financialYear;    // e.g. "26"
    private long   counter;          // current highest serial issued
}
