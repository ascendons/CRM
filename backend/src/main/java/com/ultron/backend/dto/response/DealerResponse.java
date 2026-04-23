package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.DealerStatus;
import com.ultron.backend.domain.enums.DealerTier;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class DealerResponse {
    private String id;
    private String dealerCode;
    private String companyName;
    private DealerTier tier;
    private String region;
    private String territory;
    private BigDecimal creditLimit;
    private BigDecimal currentCreditUsed;
    private BigDecimal availableCredit;
    private String contactPerson;
    private String email;
    private String phone;
    private String gstin;
    private DealerStatus status;
    private LocalDate onboardedDate;
    private String accountManagerId;
    private LocalDateTime createdAt;
    private String createdBy;
}
