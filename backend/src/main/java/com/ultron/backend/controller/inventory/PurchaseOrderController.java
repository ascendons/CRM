package com.ultron.backend.controller.inventory;

import com.ultron.backend.domain.entity.PurchaseOrder;
import com.ultron.backend.dto.request.inventory.CreatePurchaseOrderRequest;
import com.ultron.backend.dto.request.inventory.ReceiveGoodsRequest;
import com.ultron.backend.dto.response.inventory.PurchaseOrderResponse;
import com.ultron.backend.mapper.InventoryMapper;
import com.ultron.backend.service.inventory.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for purchase order management
 */
@Slf4j
@RestController
@RequestMapping("/inventory/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final InventoryMapper mapper;

    /**
     * Create a new purchase order
     */
    @PostMapping
    public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(
        @Valid @RequestBody CreatePurchaseOrderRequest request
    ) {
        log.info("Creating purchase order for supplier: {}", request.getSupplierId());
        PurchaseOrder po = mapper.toPurchaseOrderEntity(request);
        PurchaseOrder created = purchaseOrderService.createPurchaseOrder(po);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toPurchaseOrderResponse(created));
    }

    /**
     * Get purchase order by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrderResponse> getPurchaseOrderById(@PathVariable String id) {
        PurchaseOrder po = purchaseOrderService.getPurchaseOrderById(id);
        return ResponseEntity.ok(mapper.toPurchaseOrderResponse(po));
    }

    /**
     * Get purchase order by PO number
     */
    @GetMapping("/number/{poNumber}")
    public ResponseEntity<PurchaseOrderResponse> getPurchaseOrderByNumber(@PathVariable String poNumber) {
        PurchaseOrder po = purchaseOrderService.getPurchaseOrderByNumber(poNumber);
        return ResponseEntity.ok(mapper.toPurchaseOrderResponse(po));
    }

    /**
     * Get all purchase orders (paginated)
     */
    @GetMapping
    public ResponseEntity<Page<PurchaseOrderResponse>> getAllPurchaseOrders(Pageable pageable) {
        Page<PurchaseOrder> pos = purchaseOrderService.getAllPurchaseOrders(pageable);
        return ResponseEntity.ok(pos.map(mapper::toPurchaseOrderResponse));
    }

    /**
     * Get purchase orders by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<PurchaseOrderResponse>> getPurchaseOrdersByStatus(
        @PathVariable String status
    ) {
        PurchaseOrder.POStatus poStatus = PurchaseOrder.POStatus.valueOf(status);
        List<PurchaseOrder> pos = purchaseOrderService.getPurchaseOrdersByStatus(poStatus);
        return ResponseEntity.ok(
            pos.stream()
                .map(mapper::toPurchaseOrderResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Update purchase order
     */
    @PutMapping("/{id}")
    public ResponseEntity<PurchaseOrderResponse> updatePurchaseOrder(
        @PathVariable String id,
        @Valid @RequestBody CreatePurchaseOrderRequest request
    ) {
        log.info("Updating purchase order: {}", id);
        PurchaseOrder updates = mapper.toPurchaseOrderEntity(request);
        PurchaseOrder updated = purchaseOrderService.updatePurchaseOrder(id, updates);
        return ResponseEntity.ok(mapper.toPurchaseOrderResponse(updated));
    }

    /**
     * Submit purchase order for approval
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<PurchaseOrderResponse> submitForApproval(@PathVariable String id) {
        log.info("Submitting purchase order for approval: {}", id);
        PurchaseOrder po = purchaseOrderService.submitForApproval(id);
        return ResponseEntity.ok(mapper.toPurchaseOrderResponse(po));
    }

    /**
     * Approve purchase order
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<PurchaseOrderResponse> approvePurchaseOrder(@PathVariable String id) {
        log.info("Approving purchase order: {}", id);
        PurchaseOrder po = purchaseOrderService.approvePurchaseOrder(id);
        return ResponseEntity.ok(mapper.toPurchaseOrderResponse(po));
    }

    /**
     * Reject purchase order
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<PurchaseOrderResponse> rejectPurchaseOrder(
        @PathVariable String id,
        @RequestParam String reason
    ) {
        log.info("Rejecting purchase order: {} - Reason: {}", id, reason);
        PurchaseOrder po = purchaseOrderService.rejectPurchaseOrder(id, reason);
        return ResponseEntity.ok(mapper.toPurchaseOrderResponse(po));
    }

    /**
     * Receive goods from purchase order
     */
    @PostMapping("/{id}/receive")
    public ResponseEntity<PurchaseOrderResponse> receiveGoods(
        @PathVariable String id,
        @Valid @RequestBody ReceiveGoodsRequest request
    ) {
        log.info("Receiving goods for purchase order: {}", id);

        List<PurchaseOrderService.ReceiveLineItem> receivedItems = request.getItems().stream()
            .map(item -> {
                PurchaseOrderService.ReceiveLineItem receiveItem = new PurchaseOrderService.ReceiveLineItem();
                receiveItem.setProductId(item.getProductId());
                receiveItem.setQuantity(item.getQuantity());
                return receiveItem;
            })
            .collect(Collectors.toList());

        PurchaseOrder po = purchaseOrderService.receiveGoods(id, receivedItems);
        return ResponseEntity.ok(mapper.toPurchaseOrderResponse(po));
    }

    /**
     * Cancel purchase order
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<PurchaseOrderResponse> cancelPurchaseOrder(
        @PathVariable String id,
        @RequestParam String reason
    ) {
        log.info("Cancelling purchase order: {} - Reason: {}", id, reason);
        PurchaseOrder po = purchaseOrderService.cancelPurchaseOrder(id, reason);
        return ResponseEntity.ok(mapper.toPurchaseOrderResponse(po));
    }

    /**
     * Get overdue purchase orders
     */
    @GetMapping("/overdue")
    public ResponseEntity<List<PurchaseOrderResponse>> getOverduePurchaseOrders() {
        List<PurchaseOrder> pos = purchaseOrderService.getOverduePurchaseOrders();
        return ResponseEntity.ok(
            pos.stream()
                .map(mapper::toPurchaseOrderResponse)
                .collect(Collectors.toList())
        );
    }
}
