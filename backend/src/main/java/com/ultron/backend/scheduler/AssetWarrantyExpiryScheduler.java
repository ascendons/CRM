package com.ultron.backend.scheduler;

import com.ultron.backend.domain.entity.Asset;
import com.ultron.backend.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class AssetWarrantyExpiryScheduler {

    private final AssetRepository assetRepository;

    // Runs daily at 8 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void checkWarrantyExpiry() {
        log.info("Running asset warranty expiry check");
        LocalDate today = LocalDate.now();

        int[] alertDays = {30, 60, 90};

        for (int days : alertDays) {
            LocalDate threshold = today.plusDays(days);
            // Find assets whose warranty expires on exactly that date (window: threshold - 1 to threshold)
            List<Asset> expiring = assetRepository.findAll().stream()
                    .filter(a -> !a.isDeleted()
                            && a.getWarrantyExpiry() != null
                            && !a.getWarrantyExpiry().isBefore(threshold.minusDays(1))
                            && !a.getWarrantyExpiry().isAfter(threshold))
                    .collect(Collectors.toList());

            for (Asset asset : expiring) {
                log.warn("WARRANTY EXPIRY ALERT ({}d): Asset {} [{} {}] tenant={} expires={}",
                        days, asset.getAssetCode(), asset.getBrand(), asset.getModel(),
                        asset.getTenantId(), asset.getWarrantyExpiry());
                // TODO: wire to NotificationService when notification templates for warranty are added
            }
        }

        log.info("Warranty expiry check complete");
    }
}
