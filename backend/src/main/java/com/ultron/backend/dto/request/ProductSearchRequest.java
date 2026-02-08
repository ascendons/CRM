package com.ultron.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchRequest {
    private String keyword;
    private String category;
    private Map<String, FilterRequest> filters;
    private Integer page = 0;
    private Integer size = 20;
    private String sortBy = "createdAt";
    private String sortDirection = "DESC";

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FilterRequest {
        private String type; // EXACT, RANGE, IN, CONTAINS
        private String value;
        private java.util.List<String> values;
        private Double min;
        private Double max;
    }
}
