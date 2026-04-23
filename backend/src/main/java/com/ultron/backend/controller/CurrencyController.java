package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.CurrencyConfig;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.CurrencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/settings/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyService currencyService;

    @GetMapping
    @PreAuthorize("hasPermission('CURRENCY', 'VIEW')")
    public ResponseEntity<ApiResponse<CurrencyConfig>> getConfig() {
        return ResponseEntity.ok(ApiResponse.<CurrencyConfig>builder()
                .success(true).data(currencyService.getOrCreateConfig()).build());
    }

    @PutMapping
    @PreAuthorize("hasPermission('CURRENCY', 'EDIT')")
    public ResponseEntity<ApiResponse<CurrencyConfig>> updateConfig(
            @RequestParam String baseCurrency,
            @RequestBody List<String> supportedCurrencies) {
        return ResponseEntity.ok(ApiResponse.<CurrencyConfig>builder()
                .success(true).data(currencyService.updateConfig(baseCurrency, supportedCurrencies)).build());
    }

    @GetMapping("/rates")
    @PreAuthorize("hasPermission('CURRENCY', 'VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getRates() {
        return ResponseEntity.ok(ApiResponse.<Map<String, Double>>builder()
                .success(true).data(currencyService.getRates()).build());
    }

    @PostMapping("/refresh")
    @PreAuthorize("hasPermission('CURRENCY', 'EDIT')")
    public ResponseEntity<ApiResponse<String>> refresh() {
        currencyService.refreshRates();
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true).data("Rates refreshed").build());
    }
}
