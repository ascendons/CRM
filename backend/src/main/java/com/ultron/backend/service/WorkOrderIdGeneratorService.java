package com.ultron.backend.service;

import org.springframework.stereotype.Service;

@Service
public class WorkOrderIdGeneratorService {

    public synchronized String generateWorkOrderId() {
        return String.format("WO-%d", System.currentTimeMillis());
    }
}
