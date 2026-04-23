package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.VendorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "vendors")
public class Vendor {

    @Id
    private String id;

    @Indexed(unique = true)
    private String vendorCode;          // VEN-timestamp

    @Indexed
    private String tenantId;

    private String companyName;
    private String contactPerson;
    private String email;
    private String phone;
    private String gstin;
    private Integer paymentTermsDays;
    private BigDecimal creditLimit;
    private Integer rating;             // 1-5
    private VendorStatus status;
    private List<String> categories;
    private BankDetails bankDetails;
    private Address address;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BankDetails {
        private String accountNo;
        private String ifsc;
        private String bankName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Address {
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String pincode;
    }
}
