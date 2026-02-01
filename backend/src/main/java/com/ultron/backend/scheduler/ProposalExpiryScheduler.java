package com.ultron.backend.scheduler;

import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.enums.ProposalStatus;
import com.ultron.backend.repository.ProposalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled job to mark expired proposals as EXPIRED
 * Runs daily at 1:00 AM to check for proposals past their validUntil date
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProposalExpiryScheduler {

    private final ProposalRepository proposalRepository;

    /**
     * Runs daily at 1:00 AM
     * Cron expression: "0 0 1 * * *" means:
     * - Second: 0
     * - Minute: 0
     * - Hour: 1 (1 AM)
     * - Day of month: * (every day)
     * - Month: * (every month)
     * - Day of week: * (every day of week)
     */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void markExpiredProposals() {
        log.info("Starting scheduled job to mark expired proposals");

        LocalDate today = LocalDate.now();
        List<Proposal> expiredProposals = proposalRepository.findExpiredProposals(today);

        if (expiredProposals.isEmpty()) {
            log.info("No expired proposals found");
            return;
        }

        log.info("Found {} expired proposal(s)", expiredProposals.size());

        int count = 0;
        for (Proposal proposal : expiredProposals) {
            proposal.setStatus(ProposalStatus.EXPIRED);
            proposal.setLastModifiedAt(LocalDateTime.now());
            proposal.setLastModifiedBy("SYSTEM");
            proposal.setLastModifiedByName("System Auto-Expiry");

            proposalRepository.save(proposal);

            log.debug("Marked proposal as EXPIRED: proposalId={}, validUntil={}",
                     proposal.getProposalId(), proposal.getValidUntil());
            count++;
        }

        log.info("Successfully marked {} proposal(s) as EXPIRED", count);
    }

    /**
     * Manual trigger for testing (can be called via REST endpoint if needed)
     * This method is not scheduled, can be used for manual testing
     */
    public int markExpiredProposalsManually() {
        log.info("Manually triggering proposal expiry check");
        markExpiredProposals();

        LocalDate today = LocalDate.now();
        List<Proposal> expiredProposals = proposalRepository.findExpiredProposals(today);
        return expiredProposals.size();
    }
}
