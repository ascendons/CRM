package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Tracks reference number counters per organisation per financial year per document type.
 * One document per (tenantId, financialYear, documentType) triple.
 * documentType: "P" = Proposal, "RFQ" = Request for Quotation, "PO" = Purchase Order
 * Counter increments atomically on each new document creation.
 */
@Document(collection = "proposal_counters")
@CompoundIndex(name = "tenant_fy_type_unique", def = "{'tenantId': 1, 'financialYear': 1, 'documentType': 1}", unique = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalCounter {

    @Id
    private String id;

    private String tenantId;
    private String proposalPrefix;  // e.g. "RKE" — locked at FY start, never overwritten
    private String financialYear;   // e.g. "26"
    private String documentType;    // "P", "RFQ", "PO"
    private long   counter;         // current highest serial issued
}
