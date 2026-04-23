package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.VendorStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class VendorResponse {
    private String id;
    private String vendorCode;
    private String companyName;
    private String contactPerson;
    private String email;
    private String phone;
    private String gstin;
    private Integer paymentTermsDays;
    private BigDecimal creditLimit;
    private Integer rating;
    private VendorStatus status;
    private List<String> categories;
    private BankDetailsDto bankDetails;
    private AddressDto address;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class BankDetailsDto {
        private String accountNo;
        private String ifsc;
        private String bankName;
    }

    @Data
    @Builder
    public static class AddressDto {
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String pincode;
    }
}
