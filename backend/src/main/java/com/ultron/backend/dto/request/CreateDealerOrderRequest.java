package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateDealerOrderRequest {

    @NotBlank
    private String dealerId;

    @NotEmpty
    private List<OrderItemDto> products;

    @Data
    public static class OrderItemDto {
        private String productId;
        private Integer qty;
        private BigDecimal unitPrice;
    }
}
