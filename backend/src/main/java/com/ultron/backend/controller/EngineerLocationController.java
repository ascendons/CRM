package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.WorkOrderGeoEvent;
import com.ultron.backend.dto.request.LocationUpdateRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.EngineerLocationResponse;
import com.ultron.backend.service.GeoTrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/geo")
@RequiredArgsConstructor
@Slf4j
public class EngineerLocationController {

    private final GeoTrackingService geoTrackingService;

    @PostMapping("/location/{engineerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EngineerLocationResponse>> updateLocation(
            @PathVariable String engineerId,
            @Valid @RequestBody LocationUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Location updated",
                geoTrackingService.updateLocation(engineerId, request)));
    }

    @GetMapping("/location/{engineerId}")
    @PreAuthorize("hasPermission('DISPATCH', 'VIEW')")
    public ResponseEntity<ApiResponse<EngineerLocationResponse>> getLatestLocation(
            @PathVariable String engineerId) {
        return ResponseEntity.ok(ApiResponse.success("Location retrieved",
                geoTrackingService.getLatestLocation(engineerId)));
    }

    @PostMapping("/events/{workOrderId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> recordEvent(
            @PathVariable String workOrderId,
            @RequestBody Map<String, Object> body) {
        String engineerId = (String) body.get("engineerId");
        String eventType = (String) body.get("eventType");
        Double lat = body.get("lat") != null ? ((Number) body.get("lat")).doubleValue() : null;
        Double lng = body.get("lng") != null ? ((Number) body.get("lng")).doubleValue() : null;
        geoTrackingService.recordGeoEvent(workOrderId, engineerId, eventType, lat, lng, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Geo event recorded", null));
    }

    @GetMapping("/events/{workOrderId}")
    @PreAuthorize("hasPermission('WORK_ORDERS', 'READ')")
    public ResponseEntity<ApiResponse<List<WorkOrderGeoEvent>>> getGeoEvents(
            @PathVariable String workOrderId) {
        return ResponseEntity.ok(ApiResponse.success("Geo events retrieved",
                geoTrackingService.getGeoEvents(workOrderId)));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
