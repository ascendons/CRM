package com.ultron.backend.service;

import com.ultron.backend.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service to generate unique Organization IDs
 * Format: ORG-YYYYMM-XXXXX (e.g., ORG-202602-00001)
 */
@Service
@RequiredArgsConstructor
public class OrganizationIdGeneratorService {

    private final OrganizationRepository organizationRepository;

    public String generateOrganizationId() {
        LocalDateTime now = LocalDateTime.now();
        String yearMonth = now.format(DateTimeFormatter.ofPattern("yyyyMM"));
        String prefix = "ORG-" + yearMonth + "-";

        // Find the last ID with this prefix
        String lastId = findLastIdWithPrefix(prefix);

        int nextNumber = 1;
        if (lastId != null) {
            String numberPart = lastId.substring(prefix.length());
            nextNumber = Integer.parseInt(numberPart) + 1;
        }

        return prefix + String.format("%05d", nextNumber);
    }

    private String findLastIdWithPrefix(String prefix) {
        // Query to find the last organization ID with this prefix
        // This is a simplified version - in production, you might want to optimize this
        return organizationRepository.findAll().stream()
                .map(org -> org.getOrganizationId())
                .filter(id -> id != null && id.startsWith(prefix))
                .max(String::compareTo)
                .orElse(null);
    }
}
