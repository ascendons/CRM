package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Vendor;
import com.ultron.backend.domain.enums.VendorStatus;
import com.ultron.backend.dto.request.CreateVendorRequest;
import com.ultron.backend.dto.request.UpdateVendorRequest;
import com.ultron.backend.dto.response.VendorResponse;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorService extends BaseTenantService {

    private final VendorRepository vendorRepository;
    private final VendorIdGeneratorService idGeneratorService;

    public VendorResponse create(CreateVendorRequest request, String userId) {
        Vendor vendor = Vendor.builder()
                .vendorCode(idGeneratorService.generateVendorId())
                .tenantId(getCurrentTenantId())
                .companyName(request.getCompanyName())
                .contactPerson(request.getContactPerson())
                .email(request.getEmail())
                .phone(request.getPhone())
                .gstin(request.getGstin())
                .paymentTermsDays(request.getPaymentTermsDays())
                .creditLimit(request.getCreditLimit())
                .rating(3)
                .status(VendorStatus.ACTIVE)
                .categories(request.getCategories())
                .bankDetails(mapBankDetails(request.getBankDetails()))
                .address(mapAddress(request.getAddress()))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        vendor = vendorRepository.save(vendor);
        log.info("Vendor created: {} by {}", vendor.getVendorCode(), userId);
        return toResponse(vendor);
    }

    public List<VendorResponse> getAll() {
        return vendorRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<VendorResponse> getByStatus(VendorStatus status) {
        return vendorRepository.findByTenantIdAndStatusAndIsDeletedFalse(getCurrentTenantId(), status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<VendorResponse> getByCategory(String category) {
        return vendorRepository.findByTenantIdAndCategoriesContainingAndIsDeletedFalse(getCurrentTenantId(), category)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public VendorResponse getById(String id) {
        return toResponse(findById(id));
    }

    public VendorResponse update(String id, UpdateVendorRequest request, String userId) {
        Vendor vendor = findById(id);
        if (request.getCompanyName() != null) vendor.setCompanyName(request.getCompanyName());
        if (request.getContactPerson() != null) vendor.setContactPerson(request.getContactPerson());
        if (request.getEmail() != null) vendor.setEmail(request.getEmail());
        if (request.getPhone() != null) vendor.setPhone(request.getPhone());
        if (request.getGstin() != null) vendor.setGstin(request.getGstin());
        if (request.getPaymentTermsDays() != null) vendor.setPaymentTermsDays(request.getPaymentTermsDays());
        if (request.getCreditLimit() != null) vendor.setCreditLimit(request.getCreditLimit());
        if (request.getRating() != null) vendor.setRating(request.getRating());
        if (request.getStatus() != null) vendor.setStatus(request.getStatus());
        if (request.getCategories() != null) vendor.setCategories(request.getCategories());
        if (request.getBankDetails() != null) vendor.setBankDetails(mapBankDetails(request.getBankDetails()));
        if (request.getAddress() != null) vendor.setAddress(mapAddress(request.getAddress()));
        vendor.setUpdatedAt(LocalDateTime.now());
        vendor.setUpdatedBy(userId);
        return toResponse(vendorRepository.save(vendor));
    }

    public VendorResponse updateRating(String id, int rating, String userId) {
        if (rating < 1 || rating > 5) throw new BadRequestException("Rating must be between 1 and 5");
        Vendor vendor = findById(id);
        vendor.setRating(rating);
        vendor.setUpdatedAt(LocalDateTime.now());
        vendor.setUpdatedBy(userId);
        return toResponse(vendorRepository.save(vendor));
    }

    public void delete(String id, String userId) {
        Vendor vendor = findById(id);
        vendor.setDeleted(true);
        vendor.setUpdatedAt(LocalDateTime.now());
        vendor.setUpdatedBy(userId);
        vendorRepository.save(vendor);
    }

    private Vendor findById(String id) {
        return vendorRepository.findById(id)
                .filter(v -> v.getTenantId().equals(getCurrentTenantId()) && !v.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found: " + id));
    }

    private Vendor.BankDetails mapBankDetails(CreateVendorRequest.BankDetailsDto dto) {
        if (dto == null) return null;
        return Vendor.BankDetails.builder()
                .accountNo(dto.getAccountNo()).ifsc(dto.getIfsc()).bankName(dto.getBankName()).build();
    }

    private Vendor.Address mapAddress(CreateVendorRequest.AddressDto dto) {
        if (dto == null) return null;
        return Vendor.Address.builder()
                .line1(dto.getLine1()).line2(dto.getLine2())
                .city(dto.getCity()).state(dto.getState()).pincode(dto.getPincode()).build();
    }

    private VendorResponse toResponse(Vendor v) {
        VendorResponse.BankDetailsDto bank = null;
        if (v.getBankDetails() != null) {
            bank = VendorResponse.BankDetailsDto.builder()
                    .accountNo(v.getBankDetails().getAccountNo())
                    .ifsc(v.getBankDetails().getIfsc())
                    .bankName(v.getBankDetails().getBankName()).build();
        }
        VendorResponse.AddressDto addr = null;
        if (v.getAddress() != null) {
            addr = VendorResponse.AddressDto.builder()
                    .line1(v.getAddress().getLine1()).line2(v.getAddress().getLine2())
                    .city(v.getAddress().getCity()).state(v.getAddress().getState())
                    .pincode(v.getAddress().getPincode()).build();
        }
        return VendorResponse.builder()
                .id(v.getId()).vendorCode(v.getVendorCode()).companyName(v.getCompanyName())
                .contactPerson(v.getContactPerson()).email(v.getEmail()).phone(v.getPhone())
                .gstin(v.getGstin()).paymentTermsDays(v.getPaymentTermsDays())
                .creditLimit(v.getCreditLimit()).rating(v.getRating()).status(v.getStatus())
                .categories(v.getCategories()).bankDetails(bank).address(addr)
                .createdAt(v.getCreatedAt()).createdBy(v.getCreatedBy()).updatedAt(v.getUpdatedAt())
                .build();
    }
}
