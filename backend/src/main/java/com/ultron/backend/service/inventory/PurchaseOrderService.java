package com.ultron.backend.service.inventory;

import com.ultron.backend.domain.entity.PurchaseOrder;
import com.ultron.backend.domain.entity.StockTransaction;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.PurchaseOrderRepository;
import com.ultron.backend.service.BaseTenantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for purchase order management
 */
@Slf4j
@Service
public class PurchaseOrderService extends BaseTenantService {

    private final PurchaseOrderRepository poRepository;
    private final StockService stockService;
    private final PONumberGeneratorService poNumberGenerator;

    public PurchaseOrderService(
        PurchaseOrderRepository poRepository,
        StockService stockService,
        PONumberGeneratorService poNumberGenerator
    ) {
        this.poRepository = poRepository;
        this.stockService = stockService;
        this.poNumberGenerator = poNumberGenerator;
    }

    /**
     * Create new purchase order
     */
    @Transactional
    public PurchaseOrder createPurchaseOrder(PurchaseOrder po) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        

        // Generate PO number
        po.setPoNumber(poNumberGenerator.generatePONumber());

        // Set tenant and audit fields
        po.setTenantId(tenantId);
        po.setCreatedAt(LocalDateTime.now());
        po.setCreatedBy(userId);

        // Set default status
        if (po.getStatus() == null) {
            po.setStatus(PurchaseOrder.POStatus.DRAFT);
        }

        // Set order date if not provided
        if (po.getOrderDate() == null) {
            po.setOrderDate(LocalDate.now());
        }

        // Initialize line items
        if (po.getItems() != null) {
            po.getItems().forEach(item -> {
                if (item.getLineItemId() == null) {
                    item.setLineItemId(UUID.randomUUID().toString());
                }
                if (item.getReceivedQuantity() == null) {
                    item.setReceivedQuantity(0);
                }
                item.setRemainingQuantity(item.getOrderedQuantity() - item.getReceivedQuantity());
            });
        }

        // Calculate totals
        calculateTotals(po);

        log.info("Creating purchase order: {} for tenant: {}", po.getPoNumber(), tenantId);
        return poRepository.save(po);
    }

    /**
     * Get purchase order by ID
     */
    public PurchaseOrder getPurchaseOrderById(String id) {
        String tenantId = getCurrentTenantId();
        return poRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));
    }

    /**
     * Get purchase order by PO number
     */
    public PurchaseOrder getPurchaseOrderByNumber(String poNumber) {
        String tenantId = getCurrentTenantId();
        return poRepository.findByTenantIdAndPoNumber(tenantId, poNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + poNumber));
    }

    /**
     * Get all purchase orders (paginated)
     */
    public Page<PurchaseOrder> getAllPurchaseOrders(Pageable pageable) {
        String tenantId = getCurrentTenantId();
        return poRepository.findByTenantId(tenantId, pageable);
    }

    /**
     * Get purchase orders by status
     */
    public List<PurchaseOrder> getPurchaseOrdersByStatus(PurchaseOrder.POStatus status) {
        String tenantId = getCurrentTenantId();
        return poRepository.findByTenantIdAndStatus(tenantId, status);
    }

    /**
     * Update purchase order
     */
    @Transactional
    public PurchaseOrder updatePurchaseOrder(String id, PurchaseOrder updates) {
        PurchaseOrder existing = getPurchaseOrderById(id);

        // Only allow updates for DRAFT status
        if (existing.getStatus() != PurchaseOrder.POStatus.DRAFT) {
            throw new BadRequestException("Can only update purchase orders in DRAFT status");
        }

        // Update fields
        if (updates.getSupplierId() != null) {
            existing.setSupplierId(updates.getSupplierId());
            existing.setSupplierName(updates.getSupplierName());
            existing.setSupplierContact(updates.getSupplierContact());
            existing.setSupplierEmail(updates.getSupplierEmail());
            existing.setSupplierPhone(updates.getSupplierPhone());
        }
        if (updates.getWarehouseId() != null) {
            existing.setWarehouseId(updates.getWarehouseId());
            existing.setWarehouseName(updates.getWarehouseName());
        }
        if (updates.getExpectedDeliveryDate() != null) {
            existing.setExpectedDeliveryDate(updates.getExpectedDeliveryDate());
        }
        if (updates.getItems() != null) {
            existing.setItems(updates.getItems());
            calculateTotals(existing);
        }
        if (updates.getNotes() != null) {
            existing.setNotes(updates.getNotes());
        }
        if (updates.getTermsAndConditions() != null) {
            existing.setTermsAndConditions(updates.getTermsAndConditions());
        }
        if (updates.getPaymentTerms() != null) {
            existing.setPaymentTerms(updates.getPaymentTerms());
        }

        existing.setLastModifiedAt(LocalDateTime.now());
        existing.setLastModifiedBy(getCurrentUserId());

        return poRepository.save(existing);
    }

    /**
     * Submit purchase order for approval
     */
    @Transactional
    public PurchaseOrder submitForApproval(String id) {
        PurchaseOrder po = getPurchaseOrderById(id);

        if (po.getStatus() != PurchaseOrder.POStatus.DRAFT) {
            throw new BadRequestException("Can only submit purchase orders in DRAFT status");
        }

        po.setStatus(PurchaseOrder.POStatus.SUBMITTED);
        po.setLastModifiedAt(LocalDateTime.now());
        po.setLastModifiedBy(getCurrentUserId());

        log.info("Submitted PO {} for approval", po.getPoNumber());
        return poRepository.save(po);
    }

    /**
     * Approve purchase order
     */
    @Transactional
    public PurchaseOrder approvePurchaseOrder(String id) {
        PurchaseOrder po = getPurchaseOrderById(id);

        if (po.getStatus() != PurchaseOrder.POStatus.SUBMITTED) {
            throw new BadRequestException("Can only approve purchase orders in SUBMITTED status");
        }

        po.setStatus(PurchaseOrder.POStatus.APPROVED);
        po.setApprovedBy(getCurrentUserId());
        po.setApprovedAt(LocalDateTime.now());

        log.info("Approved PO: {}", po.getPoNumber());
        return poRepository.save(po);
    }

    /**
     * Reject purchase order
     */
    @Transactional
    public PurchaseOrder rejectPurchaseOrder(String id, String reason) {
        PurchaseOrder po = getPurchaseOrderById(id);

        if (po.getStatus() != PurchaseOrder.POStatus.SUBMITTED) {
            throw new BadRequestException("Can only reject purchase orders in SUBMITTED status");
        }

        // Revert to DRAFT for re-submission
        po.setStatus(PurchaseOrder.POStatus.DRAFT);
        po.setRejectedBy(getCurrentUserId());
        po.setRejectedAt(LocalDateTime.now());
        po.setRejectionReason(reason);

        log.info("Rejected PO: {} - Reason: {}", po.getPoNumber(), reason);
        return poRepository.save(po);
    }

    /**
     * Receive goods from purchase order
     */
    @Transactional
    public PurchaseOrder receiveGoods(String id, List<ReceiveLineItem> receivedItems) {
        PurchaseOrder po = getPurchaseOrderById(id);

        if (po.getStatus() != PurchaseOrder.POStatus.APPROVED &&
            po.getStatus() != PurchaseOrder.POStatus.RECEIVING) {
            throw new BadRequestException("Can only receive goods for APPROVED or RECEIVING purchase orders");
        }

        // Update received quantities and add to stock
        for (ReceiveLineItem receivedItem : receivedItems) {
            PurchaseOrder.LineItem lineItem = findLineItem(po, receivedItem.getProductId());

            if (lineItem == null) {
                throw new ResourceNotFoundException("Line item not found for product: " + receivedItem.getProductId());
            }

            int newReceivedQty = lineItem.getReceivedQuantity() + receivedItem.getQuantity();

            if (newReceivedQty > lineItem.getOrderedQuantity()) {
                throw new BadRequestException(
                    "Cannot receive more than ordered quantity for product: " + receivedItem.getProductId()
                );
            }

            // Update line item
            lineItem.setReceivedQuantity(newReceivedQty);
            lineItem.setRemainingQuantity(lineItem.getOrderedQuantity() - newReceivedQty);

            // Add to stock
            stockService.adjustStock(
                receivedItem.getProductId(),
                po.getWarehouseId(),
                receivedItem.getQuantity(),
                StockTransaction.Direction.IN,
                "Received from PO: " + po.getPoNumber(),
                lineItem.getUnitPrice(),
                "PURCHASE_ORDER",
                po.getId()
            );

            log.info("Received {} units of product {} from PO {}",
                receivedItem.getQuantity(), receivedItem.getProductId(), po.getPoNumber());
        }

        // Update PO status
        if (isFullyReceived(po)) {
            po.setStatus(PurchaseOrder.POStatus.RECEIVED);
            po.setReceivedDate(LocalDate.now());
            log.info("PO {} fully received", po.getPoNumber());
        } else {
            po.setStatus(PurchaseOrder.POStatus.RECEIVING);
        }

        po.setLastModifiedAt(LocalDateTime.now());
        po.setLastModifiedBy(getCurrentUserId());

        return poRepository.save(po);
    }

    /**
     * Cancel purchase order
     */
    @Transactional
    public PurchaseOrder cancelPurchaseOrder(String id, String reason) {
        PurchaseOrder po = getPurchaseOrderById(id);

        if (po.getStatus() == PurchaseOrder.POStatus.RECEIVED ||
            po.getStatus() == PurchaseOrder.POStatus.CANCELLED) {
            throw new BadRequestException("Cannot cancel a received or already cancelled purchase order");
        }

        po.setStatus(PurchaseOrder.POStatus.CANCELLED);
        po.setNotes((po.getNotes() != null ? po.getNotes() + "\n" : "") +
                    "Cancelled: " + reason);
        po.setLastModifiedAt(LocalDateTime.now());
        po.setLastModifiedBy(getCurrentUserId());

        log.info("Cancelled PO: {} - Reason: {}", po.getPoNumber(), reason);
        return poRepository.save(po);
    }

    /**
     * Get overdue purchase orders
     */
    public List<PurchaseOrder> getOverduePurchaseOrders() {
        String tenantId = getCurrentTenantId();
        return poRepository.findOverduePurchaseOrders(tenantId, LocalDate.now());
    }

    /**
     * Calculate PO totals
     */
    private void calculateTotals(PurchaseOrder po) {
        if (po.getItems() == null || po.getItems().isEmpty()) {
            po.setSubtotal(BigDecimal.ZERO);
            po.setTaxAmount(BigDecimal.ZERO);
            po.setTotalAmount(BigDecimal.ZERO);
            return;
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;

        for (PurchaseOrder.LineItem item : po.getItems()) {
            BigDecimal itemTotal = item.getUnitPrice()
                .multiply(BigDecimal.valueOf(item.getOrderedQuantity()));

            BigDecimal itemTax = BigDecimal.ZERO;
            if (item.getTaxRate() != null && item.getTaxRate().compareTo(BigDecimal.ZERO) > 0) {
                itemTax = itemTotal.multiply(item.getTaxRate()).divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);
            }

            item.setTaxAmount(itemTax);
            item.setTotalAmount(itemTotal.add(itemTax));

            subtotal = subtotal.add(itemTotal);
            taxAmount = taxAmount.add(itemTax);
        }

        po.setSubtotal(subtotal);
        po.setTaxAmount(taxAmount);

        BigDecimal total = subtotal.add(taxAmount);
        if (po.getShippingCost() != null) {
            total = total.add(po.getShippingCost());
        }

        po.setTotalAmount(total);
    }

    /**
     * Find line item by product ID
     */
    private PurchaseOrder.LineItem findLineItem(PurchaseOrder po, String productId) {
        return po.getItems().stream()
            .filter(item -> item.getProductId().equals(productId))
            .findFirst()
            .orElse(null);
    }

    /**
     * Check if PO is fully received
     */
    private boolean isFullyReceived(PurchaseOrder po) {
        return po.getItems().stream()
            .allMatch(item -> item.getReceivedQuantity().equals(item.getOrderedQuantity()));
    }

    /**
     * DTO for receiving goods
     */
    public static class ReceiveLineItem {
        private String productId;
        private Integer quantity;

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
}
