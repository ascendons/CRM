package com.ultron.backend.scheduler;

import com.ultron.backend.service.CurrencyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CurrencyScheduler {

    private final CurrencyService currencyService;

    @Scheduled(cron = "0 0 9 * * *")
    public void refreshExchangeRates() {
        log.info("Running daily exchange rate refresh");
        currencyService.refreshRates();
    }
}
