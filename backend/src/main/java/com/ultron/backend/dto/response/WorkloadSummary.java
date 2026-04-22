package com.ultron.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WorkloadSummary {

    private String userId;
    private String userName;
    private long assignedTasks;
    private long completedTasks;
    private int totalHoursLogged;
    private double pendingHours;
}
