package com.ultron.backend.scheduler;

import com.ultron.backend.domain.entity.SavedReport;
import com.ultron.backend.repository.SavedReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReportSchedulerService {

    private final SavedReportRepository savedReportRepository;

    @Scheduled(cron = "0 0 8 * * *")
    public void sendScheduledReports() {
        List<SavedReport> reports = savedReportRepository.findByIsScheduledTrueAndIsDeletedFalse();
        for (SavedReport report : reports) {
            try {
                log.info("Processing scheduled report: {} for tenant {}", report.getReportId(), report.getTenantId());
            } catch (Exception e) {
                log.error("Failed to process scheduled report {}: {}", report.getReportId(), e.getMessage());
            }
        }
    }
}
