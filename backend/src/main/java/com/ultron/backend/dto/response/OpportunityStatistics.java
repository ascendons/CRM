package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpportunityStatistics {

    // Total counts
    private long totalOpportunities;
    private long openOpportunities;
    private long closedOpportunities;

    // By stage
    private long prospectingCount;
    private long qualificationCount;
    private long needsAnalysisCount;
    private long proposalCount;
    private long negotiationCount;
    private long wonCount;
    private long lostCount;

    // Financial metrics
    private BigDecimal totalValue;
    private BigDecimal wonValue;
    private BigDecimal lostValue;
    private BigDecimal pipelineValue;  // Open opportunities
    private BigDecimal weightedValue;  // Pipeline value * average probability

    // Performance metrics
    private Double winRate;  // wonCount / (wonCount + lostCount)
    private Double averageDealSize;
    private Double averageCloseDays;
}
