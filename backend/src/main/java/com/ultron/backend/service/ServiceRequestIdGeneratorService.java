package com.ultron.backend.service;

import org.springframework.stereotype.Service;

@Service
public class ServiceRequestIdGeneratorService {

    public synchronized String generateServiceRequestId() {
        return String.format("SR-%d", System.currentTimeMillis());
    }
}
