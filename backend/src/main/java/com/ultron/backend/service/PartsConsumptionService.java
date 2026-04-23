package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Product;
import com.ultron.backend.domain.entity.PurchaseOrder;
import com.ultron.backend.domain.entity.StockTransaction;
import com.ultron.backend.domain.entity.WorkOrder;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.ProductRepository;
import com.ultron.backend.repository.PurchaseOrderRepository;
import com.ultron.backend.repository.StockTransactionRepository;
import com.ultron.backend.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartsConsumptionService extends BaseTenantService {

    private final WorkOrderRepository workOrderRepository;
    private final ProductRepository productRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public void consumePartsOnClosure(String workOrderId, String userId) {
        String tenantId = getCurrentTenantId();

        WorkOrder wo = workOrderRepository.findById(workOrderId)
                .filter(w -> w.getTenantId().equals(tenantId) && !w.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Work order not found: " + workOrderId));

        if (wo.getPartsUsed() == null || wo.getPartsUsed().isEmpty()) {
            return;
        }

        for (WorkOrder.PartUsed part : wo.getPartsUsed()) {
            Product product = productRepository.findById(part.getPartId()).orElse(null);
            if (product == null) {
                log.warn("Part not found during WO closure: {}", part.getPartId());
                continue;
            }

            int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            if (currentStock < part.getQty()) {
                throw new BadRequestException("Insufficient stock for part: " + product.getProductName());
            }

            int newStock = currentStock - part.getQty();
            product.setStockQuantity(newStock);
            productRepository.save(product);

            StockTransaction txn = StockTransaction.builder()
                    .transactionId("TXN-" + System.currentTimeMillis())
                    .tenantId(tenantId)
                    .productId(part.getPartId())
                    .transactionType(StockTransaction.TransactionType.PRODUCTION_OUT)
                    .direction(StockTransaction.Direction.OUT)
                    .quantity(part.getQty())
                    .quantityBefore(currentStock)
                    .quantityAfter(newStock)
                    .reason("Consumed in Work Order: " + wo.getWoNumber())
                    .referenceType("WORK_ORDER")
                    .referenceId(workOrderId)
                    .timestamp(LocalDateTime.now())
                    .recordedBy(userId)
                    .build();
            stockTransactionRepository.save(txn);

            if (product.getReorderPoint() != null && newStock <= product.getReorderPoint()) {
                createDraftReorderPO(product, tenantId, userId);
            }
        }

        log.info("Parts consumption recorded for WO {} by {}", wo.getWoNumber(), userId);
    }

    private void createDraftReorderPO(Product product, String tenantId, String userId) {
        String poNumber = "PO-AUTO-" + System.currentTimeMillis();
        // Skip if a draft PO for this product already exists
        boolean draftExists = purchaseOrderRepository
                .findByTenantIdAndStatus(tenantId, PurchaseOrder.POStatus.DRAFT)
                .stream()
                .anyMatch(po -> po.getItems().stream()
                        .anyMatch(item -> product.getProductId().equals(item.getProductId())));
        if (draftExists) {
            log.info("Draft reorder PO already exists for part {}", product.getProductName());
            return;
        }

        int reorderQty = product.getReorderQty() != null ? product.getReorderQty()
                : (product.getReorderPoint() != null ? product.getReorderPoint() * 2 : 10);

        PurchaseOrder.LineItem lineItem = PurchaseOrder.LineItem.builder()
                .lineItemId("LI-" + System.currentTimeMillis())
                .productId(product.getProductId())
                .productName(product.getProductName())
                .sku(product.getSku())
                .orderedQuantity(reorderQty)
                .receivedQuantity(0)
                .unitPrice(BigDecimal.ZERO)
                .build();

        PurchaseOrder po = PurchaseOrder.builder()
                .tenantId(tenantId)
                .poNumber(poNumber)
                .supplierId(product.getVendorId())
                .status(PurchaseOrder.POStatus.DRAFT)
                .orderDate(LocalDate.now())
                .currency("INR")
                .notes("Auto-generated reorder: " + product.getProductName()
                        + " stock=" + product.getStockQuantity()
                        + " reorderPoint=" + product.getReorderPoint())
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        po.getItems().add(lineItem);

        purchaseOrderRepository.save(po);
        log.info("Auto-created draft reorder PO {} for part {} (stock={}, reorderPoint={})",
                poNumber, product.getProductName(), product.getStockQuantity(), product.getReorderPoint());
    }
}
