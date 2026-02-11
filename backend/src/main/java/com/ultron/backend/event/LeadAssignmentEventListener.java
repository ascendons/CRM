package com.ultron.backend.event;

import com.ultron.backend.service.LeadAssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listens for lead created events and triggers auto-assignment
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LeadAssignmentEventListener {

    private final LeadAssignmentService leadAssignmentService;

    @Async
    @EventListener
    public void handleLeadCreated(LeadCreatedEvent event) {
        log.info("LeadCreatedEvent received for lead: {}", event.getLead().getId());

        try {
            leadAssignmentService.autoAssignLead(event.getLead());
        } catch (Exception e) {
            log.error("Error during auto-assignment for lead: {}", event.getLead().getId(), e);
            // Don't throw exception - auto-assignment failure shouldn't block lead creation
        }
    }
}
