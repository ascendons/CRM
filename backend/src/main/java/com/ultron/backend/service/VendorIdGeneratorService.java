package com.ultron.backend.service;

import org.springframework.stereotype.Service;

@Service
public class VendorIdGeneratorService {

    public synchronized String generateVendorId() {
        return String.format("VEN-%d", System.currentTimeMillis());
    }
}
