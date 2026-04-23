package com.ultron.backend.domain.entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "currency_configs")
public class CurrencyConfig {
    @Id private String id;
    @Indexed private String tenantId;
    private String baseCurrency;
    private List<String> supportedCurrencies;
    private Map<String, Double> exchangeRates;
    private LocalDateTime lastUpdatedAt;
}
