package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ReportChartType;
import com.ultron.backend.domain.enums.ReportDataSource;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "saved_reports")
public class SavedReport {

    @Id
    private String id;

    @Indexed(unique = true)
    private String reportId;

    @Indexed
    private String tenantId;

    private String name;
    private ReportDataSource dataSource;
    private List<ReportFilter> filters;
    private List<String> columns;
    private String groupBy;
    private ReportChartType chartType;
    private boolean isScheduled;
    private String scheduleFrequency;
    private List<String> recipientEmails;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportFilter {
        private String field;
        private String operator;
        private String value;
    }
}
