package com.ultron.backend.domain.entity;

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
@Document(collection = "dealer_orders")
public class DealerOrder {

    @Id
    private String id;

    @Indexed(unique = true)
    private String orderNumber;

    @Indexed
    private String tenantId;

    private String dealerId;
    private List<OrderItem> products;
    private BigDecimal totalValue;
    private BigDecimal creditUsed;
    private String status;              // Pending / Confirmed / Shipped / Delivered / Cancelled
    private String fulfillmentStatus;
    private LocalDateTime placedAt;
    private LocalDateTime deliveredAt;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItem {
        private String productId;
        private Integer qty;
        private BigDecimal unitPrice;
    }
}
