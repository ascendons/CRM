package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "web_form_submissions")
public class WebFormSubmission {

    @Id
    private String id;

    @Indexed(unique = true)
    private String submissionId;

    @Indexed
    private String tenantId;

    @Indexed
    private String formId;

    private LocalDateTime submittedAt;
    private String ipAddress;
    private Map<String, String> responses;
    private String createdLeadId;
}
