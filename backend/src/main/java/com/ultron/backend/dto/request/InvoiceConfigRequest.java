package com.ultron.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceConfigRequest {
    private String logoUrl;
    private String companyName;
    private String companyAddress;
    private String gstNumber;
    private String cinNumber;
    
    // Bank Details
    private String bankName;
    private String accountName;
    private String accountNumber;
    private String ifscCode;
    private String branchName;
    private String micrCode;
    
    // PDF Options
    private String authorizedSignatoryLabel;
    private String authorizedSignatorySealUrl;
    private String termsAndConditions;
    private String footerText;
}
