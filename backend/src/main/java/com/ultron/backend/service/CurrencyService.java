package com.ultron.backend.service;

import com.ultron.backend.domain.entity.CurrencyConfig;
import com.ultron.backend.repository.CurrencyConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CurrencyService extends BaseTenantService {

    private final CurrencyConfigRepository currencyConfigRepository;
    private final RestTemplate restTemplate;

    private static final String FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=INR";

    public CurrencyConfig getOrCreateConfig() {
        String tenantId = getCurrentTenantId();
        return currencyConfigRepository.findByTenantId(tenantId).orElseGet(() -> {
            CurrencyConfig config = CurrencyConfig.builder()
                    .tenantId(tenantId)
                    .baseCurrency("INR")
                    .supportedCurrencies(Arrays.asList("INR", "USD", "EUR", "GBP", "AED"))
                    .exchangeRates(new HashMap<>())
                    .lastUpdatedAt(LocalDateTime.now())
                    .build();
            return currencyConfigRepository.save(config);
        });
    }

    public CurrencyConfig updateConfig(String baseCurrency, List<String> supportedCurrencies) {
        CurrencyConfig config = getOrCreateConfig();
        config.setBaseCurrency(baseCurrency);
        config.setSupportedCurrencies(supportedCurrencies);
        config.setLastUpdatedAt(LocalDateTime.now());
        return currencyConfigRepository.save(config);
    }

    public Map<String, Double> getRates() {
        CurrencyConfig config = getOrCreateConfig();
        return config.getExchangeRates() != null ? config.getExchangeRates() : new HashMap<>();
    }

    @SuppressWarnings("unchecked")
    public void refreshRates() {
        log.info("Refreshing exchange rates from Frankfurter API");
        try {
            Map<String, Object> response = restTemplate.getForObject(FRANKFURTER_URL, Map.class);
            if (response != null && response.containsKey("rates")) {
                Map<String, Double> rates = (Map<String, Double>) response.get("rates");
                List<CurrencyConfig> all = currencyConfigRepository.findAll();
                for (CurrencyConfig config : all) {
                    config.setExchangeRates(rates);
                    config.setLastUpdatedAt(LocalDateTime.now());
                    currencyConfigRepository.save(config);
                }
                log.info("Updated exchange rates for {} tenants", all.size());
            }
        } catch (Exception e) {
            log.error("Failed to refresh exchange rates: {}", e.getMessage());
        }
    }
}
