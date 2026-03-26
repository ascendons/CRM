package com.ultron.backend.dto.response.inventory;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for purchase order
 */
@Data
public class PurchaseOrderResponse {

    private String id;
    private String poNumber;
    private String status;

    private String supplierId;
    private String supplierName;
    private String supplierContact;
    private String supplierEmail;
    private String supplierPhone;

    private String warehouseId;
    private String warehouseName;

    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;
    private LocalDate receivedDate;

    private List<LineItemResponse> items;

    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal shippingCost;
    private BigDecimal totalAmount;

    private String paymentTerms;
    private String notes;
    private String termsAndConditions;

    private String approvedBy;
    private LocalDateTime approvedAt;
    private String rejectedBy;
    private LocalDateTime rejectedAt;
    private String rejectionReason;

    private LocalDateTime createdAt;
    private String createdBy;

    @Data
    public static class LineItemResponse {
        private String lineItemId;
        private String productId;
        private String productName;
        private Integer orderedQuantity;
        private Integer receivedQuantity;
        private Integer remainingQuantity;
        private BigDecimal unitPrice;
        private BigDecimal taxRate;
        private BigDecimal taxAmount;
        private BigDecimal totalAmount;
        private String notes;
    }
}
