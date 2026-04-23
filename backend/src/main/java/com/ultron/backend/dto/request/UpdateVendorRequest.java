package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.VendorStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class UpdateVendorRequest {
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
    private CreateVendorRequest.BankDetailsDto bankDetails;
    private CreateVendorRequest.AddressDto address;
}
