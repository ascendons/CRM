package com.ultron.backend.service;

import com.ultron.backend.repository.OfficeLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique Office Location IDs in format: LOC-YYYY-MM-XXXXX
 * Example: LOC-2026-03-00001
 * PERSISTENT: Queries database on startup/new month to ensure uniqueness.
 */
@Service
@RequiredArgsConstructor
public class OfficeLocationIdGeneratorService {

    private final OfficeLocationRepository repository;
    private final AtomicInteger counter = new AtomicInteger(-1);
    private String lastDate = "";

    public synchronized String generateLocationId() {
        LocalDateTime now = LocalDateTime.now();
        String currentDate = now.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        // Synchronize counter with database if it's a new month or first run
        if (!currentDate.equals(lastDate) || counter.get() == -1) {
            int latestSeq = findLatestSequence(currentDate);
            counter.set(latestSeq);
            lastDate = currentDate;
        }

        int sequence = counter.incrementAndGet();

        return String.format("LOC-%s-%05d", currentDate, sequence);
    }

    private int findLatestSequence(String monthYear) {
        return repository.findFirstByOrderByCreatedAtDesc()
                .map(loc -> {
                    String locId = loc.getLocationId();
                    if (locId != null && locId.startsWith("LOC-" + monthYear)) {
                        try {
                            String seqPart = locId.substring(locId.lastIndexOf("-") + 1);
                            return Integer.parseInt(seqPart);
                        } catch (Exception e) {
                            return 0;
                        }
                    }
                    return 0;
                })
                .orElse(0);
    }
}
