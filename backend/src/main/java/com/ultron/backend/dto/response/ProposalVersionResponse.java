package com.ultron.backend.dto.response;

import com.ultron.backend.domain.entity.Proposal;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProposalVersionResponse {
    private String id;
    private String proposalId;
    private Integer version;
    private String action;
    private String comment;
    private Proposal snapshot;
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
}
