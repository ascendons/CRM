package com.ultron.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class ActivityIdGeneratorService {

    private final AtomicInteger counter = new AtomicInteger(0);
    private String currentMonth = getCurrentMonth();

    public synchronized String generateActivityId() {
        String month = getCurrentMonth();

        // Reset counter if month changed
        if (!month.equals(currentMonth)) {
            currentMonth = month;
            counter.set(0);
        }

        int sequence = counter.incrementAndGet();
        return String.format("ACT-%s-%05d", month, sequence);
    }

    private String getCurrentMonth() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }
}
