package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "contract_billing_cycles")
public class ContractBillingCycle {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed
    private String contractId;

    private Integer cycleNumber;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String invoiceId;
    private BigDecimal amount;
    private String status;   // Pending / Invoiced / Paid / Overdue

    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
