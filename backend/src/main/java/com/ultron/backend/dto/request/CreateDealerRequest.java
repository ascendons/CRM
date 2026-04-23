package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.DealerTier;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateDealerRequest {

    @NotBlank
    private String companyName;

    private DealerTier tier;
    private String region;
    private String territory;
    private BigDecimal creditLimit;
    private String contactPerson;
    private String email;
    private String phone;
    private String gstin;
    private LocalDate onboardedDate;
    private String accountManagerId;
}
