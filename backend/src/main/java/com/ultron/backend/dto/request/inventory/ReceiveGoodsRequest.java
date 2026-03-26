package com.ultron.backend.dto.request.inventory;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

/**
 * Request DTO for receiving goods from a purchase order
 */
@Data
public class ReceiveGoodsRequest {

    @NotEmpty(message = "At least one item to receive is required")
    private List<ReceiveItemRequest> items;

    @Data
    public static class ReceiveItemRequest {

        @NotBlank(message = "Product ID is required")
        private String productId;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        private Integer quantity;
    }
}
