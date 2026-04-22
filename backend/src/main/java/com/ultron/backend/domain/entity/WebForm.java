package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.FormFieldType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "web_forms")
public class WebForm {

    @Id
    private String id;

    @Indexed(unique = true)
    private String formId;

    @Indexed
    private String tenantId;

    private String name;
    private List<FormField> fields;
    private SubmitAction submitAction;
    private String redirectUrl;
    private String thankYouMessage;
    private String themeColor;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FormField {
        private String fieldId;
        private String label;
        private FormFieldType type;
        private boolean required;
        private List<String> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitAction {
        private boolean createLead;
        private boolean createContact;
    }
}
