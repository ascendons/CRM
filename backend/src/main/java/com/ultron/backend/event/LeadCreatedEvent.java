package com.ultron.backend.event;

import com.ultron.backend.domain.entity.Lead;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Event published when a lead is created
 */
@Getter
public class LeadCreatedEvent extends ApplicationEvent {

    private final Lead lead;

    public LeadCreatedEvent(Object source, Lead lead) {
        super(source);
        this.lead = lead;
    }
}
