package com.ultron.backend.service;

import org.springframework.stereotype.Service;

@Service
public class DealerIdGeneratorService {

    public synchronized String generateDealerId() {
        return String.format("DLR-%d", System.currentTimeMillis());
    }
}
