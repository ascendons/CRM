package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Dealer;
import com.ultron.backend.domain.entity.DealerOrder;
import com.ultron.backend.domain.enums.DealerStatus;
import com.ultron.backend.domain.enums.DealerTier;
import com.ultron.backend.dto.request.CreateDealerOrderRequest;
import com.ultron.backend.dto.request.CreateDealerRequest;
import com.ultron.backend.dto.response.DealerResponse;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.DealerOrderRepository;
import com.ultron.backend.repository.DealerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DealerService extends BaseTenantService {

    private final DealerRepository dealerRepository;
    private final DealerOrderRepository dealerOrderRepository;
    private final DealerIdGeneratorService idGeneratorService;

    public DealerResponse create(CreateDealerRequest request, String userId) {
        Dealer dealer = Dealer.builder()
                .dealerCode(idGeneratorService.generateDealerId())
                .tenantId(getCurrentTenantId())
                .companyName(request.getCompanyName())
                .tier(request.getTier() != null ? request.getTier() : DealerTier.BRONZE)
                .region(request.getRegion())
                .territory(request.getTerritory())
                .creditLimit(request.getCreditLimit())
                .currentCreditUsed(BigDecimal.ZERO)
                .contactPerson(request.getContactPerson())
                .email(request.getEmail())
                .phone(request.getPhone())
                .gstin(request.getGstin())
                .status(DealerStatus.ACTIVE)
                .onboardedDate(request.getOnboardedDate() != null ? request.getOnboardedDate() : LocalDate.now())
                .accountManagerId(request.getAccountManagerId())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        dealer = dealerRepository.save(dealer);
        log.info("Dealer created: {} by {}", dealer.getDealerCode(), userId);
        return toResponse(dealer);
    }

    public List<DealerResponse> getAll() {
        return dealerRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DealerResponse> getByStatus(DealerStatus status) {
        return dealerRepository.findByTenantIdAndStatusAndIsDeletedFalse(getCurrentTenantId(), status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DealerResponse> getByTier(DealerTier tier) {
        return dealerRepository.findByTenantIdAndTierAndIsDeletedFalse(getCurrentTenantId(), tier)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DealerResponse> getByTerritory(String territory) {
        return dealerRepository.findByTenantIdAndTerritoryAndIsDeletedFalse(getCurrentTenantId(), territory)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public DealerResponse getById(String id) {
        return toResponse(findById(id));
    }

    public DealerResponse update(String id, CreateDealerRequest request, String userId) {
        Dealer dealer = findById(id);
        if (request.getCompanyName() != null) dealer.setCompanyName(request.getCompanyName());
        if (request.getTier() != null) dealer.setTier(request.getTier());
        if (request.getRegion() != null) dealer.setRegion(request.getRegion());
        if (request.getTerritory() != null) dealer.setTerritory(request.getTerritory());
        if (request.getCreditLimit() != null) dealer.setCreditLimit(request.getCreditLimit());
        if (request.getContactPerson() != null) dealer.setContactPerson(request.getContactPerson());
        if (request.getEmail() != null) dealer.setEmail(request.getEmail());
        if (request.getPhone() != null) dealer.setPhone(request.getPhone());
        if (request.getAccountManagerId() != null) dealer.setAccountManagerId(request.getAccountManagerId());
        dealer.setUpdatedAt(LocalDateTime.now());
        dealer.setUpdatedBy(userId);
        return toResponse(dealerRepository.save(dealer));
    }

    public DealerResponse updateStatus(String id, DealerStatus status, String userId) {
        Dealer dealer = findById(id);
        dealer.setStatus(status);
        dealer.setUpdatedAt(LocalDateTime.now());
        dealer.setUpdatedBy(userId);
        return toResponse(dealerRepository.save(dealer));
    }

    public DealerOrder createOrder(CreateDealerOrderRequest request, String userId) {
        Dealer dealer = findById(request.getDealerId());

        BigDecimal total = request.getProducts().stream()
                .map(p -> p.getUnitPrice().multiply(BigDecimal.valueOf(p.getQty())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal available = dealer.getCreditLimit() != null
                ? dealer.getCreditLimit().subtract(dealer.getCurrentCreditUsed() != null
                        ? dealer.getCurrentCreditUsed() : BigDecimal.ZERO)
                : BigDecimal.valueOf(Long.MAX_VALUE);

        if (total.compareTo(available) > 0) {
            throw new BadRequestException("Order value ₹" + total + " exceeds available credit limit ₹" + available);
        }

        List<DealerOrder.OrderItem> items = request.getProducts().stream()
                .map(p -> DealerOrder.OrderItem.builder()
                        .productId(p.getProductId()).qty(p.getQty()).unitPrice(p.getUnitPrice()).build())
                .collect(Collectors.toList());

        DealerOrder order = DealerOrder.builder()
                .orderNumber("DO-" + System.currentTimeMillis())
                .tenantId(getCurrentTenantId())
                .dealerId(request.getDealerId())
                .products(items)
                .totalValue(total)
                .creditUsed(total)
                .status("Pending")
                .placedAt(LocalDateTime.now())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        order = dealerOrderRepository.save(order);

        dealer.setCurrentCreditUsed((dealer.getCurrentCreditUsed() != null
                ? dealer.getCurrentCreditUsed() : BigDecimal.ZERO).add(total));
        dealerRepository.save(dealer);

        log.info("Dealer order {} created for dealer {} by {}", order.getOrderNumber(), dealer.getDealerCode(), userId);
        return order;
    }

    public List<DealerOrder> getOrdersByDealer(String dealerId) {
        return dealerOrderRepository.findByTenantIdAndDealerIdAndIsDeletedFalse(getCurrentTenantId(), dealerId);
    }

    public void delete(String id, String userId) {
        Dealer dealer = findById(id);
        dealer.setDeleted(true);
        dealer.setUpdatedAt(LocalDateTime.now());
        dealer.setUpdatedBy(userId);
        dealerRepository.save(dealer);
    }

    private Dealer findById(String id) {
        return dealerRepository.findById(id)
                .filter(d -> d.getTenantId().equals(getCurrentTenantId()) && !d.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found: " + id));
    }

    private DealerResponse toResponse(Dealer d) {
        BigDecimal available = null;
        if (d.getCreditLimit() != null) {
            available = d.getCreditLimit().subtract(
                    d.getCurrentCreditUsed() != null ? d.getCurrentCreditUsed() : BigDecimal.ZERO);
        }
        return DealerResponse.builder()
                .id(d.getId()).dealerCode(d.getDealerCode()).companyName(d.getCompanyName())
                .tier(d.getTier()).region(d.getRegion()).territory(d.getTerritory())
                .creditLimit(d.getCreditLimit()).currentCreditUsed(d.getCurrentCreditUsed())
                .availableCredit(available).contactPerson(d.getContactPerson())
                .email(d.getEmail()).phone(d.getPhone()).gstin(d.getGstin())
                .status(d.getStatus()).onboardedDate(d.getOnboardedDate())
                .accountManagerId(d.getAccountManagerId())
                .createdAt(d.getCreatedAt()).createdBy(d.getCreatedBy())
                .build();
    }
}
