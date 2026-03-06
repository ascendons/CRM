package com.ultron.backend.util;

import com.ultron.backend.dto.request.CheckInRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Utility to detect GPS spoofing and fake locations
 */
@Component
@Slf4j
public class GpsSpoofingDetector {

    // Store last known locations for users (in-memory cache)
    private final Map<String, LocationHistory> userLocationHistory = new ConcurrentHashMap<>();

    private static final double SUSPICIOUS_SPEED_MPS = 100.0; // 100 m/s = 360 km/h
    private static final double PERFECT_ACCURACY_THRESHOLD = 5.0; // Too perfect to be real
    private static final int MIN_REALISTIC_ACCURACY = 3; // Meters

    /**
     * Detect if location might be spoofed
     */
    public SpoofingDetectionResult detectSpoofing(String userId, CheckInRequest request) {
        List<String> suspiciousIndicators = new ArrayList<>();
        int suspicionScore = 0;

        // 1. Check accuracy - Too perfect is suspicious
        if (request.getAccuracy() != null && request.getAccuracy() < PERFECT_ACCURACY_THRESHOLD) {
            suspiciousIndicators.add("Suspiciously high GPS accuracy (< 5m)");
            suspicionScore += 20;
        }

        // 2. Check for exact integer coordinates (common in spoofing)
        if (isExactInteger(request.getLatitude()) && isExactInteger(request.getLongitude())) {
            suspiciousIndicators.add("Coordinates are exact integers (typical of manual input)");
            suspicionScore += 30;
        }

        // 3. Check device info for mock location providers
        if (request.getDeviceInfo() != null) {
            String deviceInfo = request.getDeviceInfo().toLowerCase();
            if (deviceInfo.contains("mock") || deviceInfo.contains("fake") ||
                deviceInfo.contains("spoof") || deviceInfo.contains("emulator")) {
                suspiciousIndicators.add("Device info indicates mock location provider");
                suspicionScore += 50;
            }
        }

        // 4. Check for impossible movement (teleportation)
        LocationHistory history = userLocationHistory.get(userId);
        if (history != null && history.lastLatitude != null && history.lastLongitude != null) {
            long timeDiffSeconds = (System.currentTimeMillis() - history.lastTimestamp) / 1000;

            if (timeDiffSeconds > 0 && timeDiffSeconds < 3600) { // Within last hour
                double distance = calculateDistance(
                        history.lastLatitude, history.lastLongitude,
                        request.getLatitude(), request.getLongitude()
                );

                double speed = distance / timeDiffSeconds; // meters per second

                if (speed > SUSPICIOUS_SPEED_MPS) {
                    suspiciousIndicators.add(String.format(
                            "Impossible movement speed: %.2f m/s (%.2f km/h)",
                            speed, speed * 3.6));
                    suspicionScore += 40;
                }
            }
        }

        // 5. Check for commonly spoofed coordinates (0,0 or famous landmarks)
        if (Math.abs(request.getLatitude()) < 0.1 && Math.abs(request.getLongitude()) < 0.1) {
            suspiciousIndicators.add("Coordinates near (0,0) - Null Island");
            suspicionScore += 60;
        }

        // Update location history
        userLocationHistory.put(userId, new LocationHistory(
                request.getLatitude(),
                request.getLongitude(),
                System.currentTimeMillis()
        ));

        // Determine result
        SpoofingLikelihood likelihood;
        if (suspicionScore >= 70) {
            likelihood = SpoofingLikelihood.HIGH;
        } else if (suspicionScore >= 40) {
            likelihood = SpoofingLikelihood.MEDIUM;
        } else if (suspicionScore >= 20) {
            likelihood = SpoofingLikelihood.LOW;
        } else {
            likelihood = SpoofingLikelihood.NONE;
        }

        boolean isSuspicious = suspicionScore >= 40;

        if (isSuspicious) {
            log.warn("GPS spoofing detected for user: {} - Score: {} - Indicators: {}",
                    userId, suspicionScore, String.join("; ", suspiciousIndicators));
        }

        return new SpoofingDetectionResult(
                isSuspicious,
                likelihood,
                suspicionScore,
                suspiciousIndicators
        );
    }

    /**
     * Calculate distance between two GPS coordinates using Haversine formula
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // Earth radius in meters
        double φ1 = Math.toRadians(lat1);
        double φ2 = Math.toRadians(lat2);
        double Δφ = Math.toRadians(lat2 - lat1);
        double Δλ = Math.toRadians(lon2 - lon1);

        double a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                   Math.cos(φ1) * Math.cos(φ2) *
                   Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    private boolean isExactInteger(double value) {
        return value == Math.floor(value);
    }

    /**
     * Location history for a user
     */
    private static class LocationHistory {
        Double lastLatitude;
        Double lastLongitude;
        long lastTimestamp;

        LocationHistory(Double latitude, Double longitude, long timestamp) {
            this.lastLatitude = latitude;
            this.lastLongitude = longitude;
            this.lastTimestamp = timestamp;
        }
    }

    /**
     * Spoofing detection result
     */
    public static class SpoofingDetectionResult {
        private final boolean isSuspicious;
        private final SpoofingLikelihood likelihood;
        private final int suspicionScore;
        private final List<String> indicators;

        public SpoofingDetectionResult(boolean isSuspicious, SpoofingLikelihood likelihood,
                                        int suspicionScore, List<String> indicators) {
            this.isSuspicious = isSuspicious;
            this.likelihood = likelihood;
            this.suspicionScore = suspicionScore;
            this.indicators = indicators;
        }

        public boolean isSuspicious() {
            return isSuspicious;
        }

        public SpoofingLikelihood getLikelihood() {
            return likelihood;
        }

        public int getSuspicionScore() {
            return suspicionScore;
        }

        public List<String> getIndicators() {
            return indicators;
        }

        public String getSummary() {
            if (indicators.isEmpty()) {
                return "No suspicious activity detected";
            }
            return String.format("Spoofing likelihood: %s (%d%%) - %s",
                    likelihood, suspicionScore, String.join("; ", indicators));
        }
    }

    public enum SpoofingLikelihood {
        NONE, LOW, MEDIUM, HIGH
    }
}
