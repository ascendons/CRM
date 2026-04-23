package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateVendorRequest {

    @NotBlank
    private String companyName;

    private String contactPerson;
    private String email;
    private String phone;
    private String gstin;
    private Integer paymentTermsDays;
    private BigDecimal creditLimit;
    private List<String> categories;

    private BankDetailsDto bankDetails;
    private AddressDto address;

    @Data
    public static class BankDetailsDto {
        private String accountNo;
        private String ifsc;
        private String bankName;
    }

    @Data
    public static class AddressDto {
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String pincode;
    }
}
