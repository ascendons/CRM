package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ContractVisitStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "contract_visits")
public class ContractVisit {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed
    private String contractId;

    private Integer visitNumber;
    private LocalDate scheduledDate;
    private LocalDate actualDate;
    private String workOrderId;
    private String engineerId;
    private ContractVisitStatus status;
    private String notes;

    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
