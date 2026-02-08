package com.ultron.backend.dto.response;

import com.ultron.backend.domain.entity.DynamicProduct.AttributeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DynamicProductResponse {
    private String id;
    private String productId;
    private String displayName;
    private String category;
    private List<AttributeResponse> attributes;
    private Map<String, String> sourceHeaders;
    private LocalDateTime createdAt;
    private String createdBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttributeResponse {
        private String key;
        private String displayKey;
        private String value;
        private AttributeType type;
        private Double numericValue;
        private String unit;
    }
}
