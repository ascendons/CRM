package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.DealerStatus;
import com.ultron.backend.domain.enums.DealerTier;
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
@Document(collection = "dealers")
public class Dealer {

    @Id
    private String id;

    @Indexed(unique = true)
    private String dealerCode;          // DLR-timestamp

    @Indexed
    private String tenantId;

    private String companyName;
    private DealerTier tier;
    private String region;
    private String territory;
    private BigDecimal creditLimit;
    private BigDecimal currentCreditUsed;
    private String contactPerson;
    private String email;
    private String phone;
    private String gstin;
    private DealerStatus status;
    private LocalDate onboardedDate;
    private String accountManagerId;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
