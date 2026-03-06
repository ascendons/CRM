package com.ultron.backend.dto.attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for attendance analytics and trends
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceAnalyticsResponse {

    private Integer year;
    private Integer month;

    // Overall trends
    private List<TrendDataPoint> attendanceTrend; // Daily attendance percentage
    private List<TrendDataPoint> punctualityTrend; // Daily on-time percentage
    private List<TrendDataPoint> overtimeTrend; // Daily overtime hours

    // Distribution charts
    private Map<String, Integer> statusDistribution; // Status -> Count
    private Map<String, Integer> checkInTimeDistribution; // Time slot -> Count
    private Map<String, Integer> workHoursDistribution; // Hours range -> Count

    // Top performers
    private List<EmployeePerformanceDto> topPerformers;
    private List<EmployeePerformanceDto> frequentLatecomers;
    private List<EmployeePerformanceDto> absenteesList;

    // Department comparison
    private List<DepartmentComparisonDto> departmentComparison;

    // Predictions and insights
    private List<String> insights;
    private Map<String, Object> predictions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendDataPoint {
        private String date;
        private Double value;
        private String label;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeePerformanceDto {
        private String userId;
        private String userName;
        private String department;
        private Double score;
        private String metric;
        private Integer count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentComparisonDto {
        private String department;
        private Double attendancePercentage;
        private Double punctualityPercentage;
        private Double averageWorkHours;
        private Integer totalEmployees;
    }
}
