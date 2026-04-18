package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "dealer_performance")
@CompoundIndex(name = "dealer_month_year_idx", def = "{'tenantId': 1, 'dealerId': 1, 'month': 1, 'year': 1}", unique = true)
public class DealerPerformance {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String dealerId;
    private Integer month;
    private Integer year;
    private BigDecimal target;
    private BigDecimal actualSales;
    private BigDecimal incentivesEarned;
    private Integer openOrders;
    private BigDecimal pendingPayments;

    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
