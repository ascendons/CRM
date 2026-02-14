package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "proposal_versions")
@CompoundIndexes({
    @CompoundIndex(name = "proposal_id_version_idx", def = "{'proposalId': 1, 'version': -1}"),
    @CompoundIndex(name = "tenant_proposal_idx", def = "{'tenantId': 1, 'proposalId': 1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalVersion {
    @Id
    private String id;

    @Indexed
    private String proposalId; // The ID of the original proposal

    @Indexed
    private String tenantId;

    private Integer version; // Version number (1, 2, 3...)

    // Snapshot of the entire proposal at this point in time
    private Proposal snapshot;

    // Information about the change
    private String action; // CREATED, UPDATED, SENT, ACCEPTED, REJECTED
    private String comment; // Brief description of the change

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
}
