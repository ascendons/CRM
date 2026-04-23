package com.ultron.backend.service;

import org.springframework.stereotype.Service;

@Service
public class ContractIdGeneratorService {

    public synchronized String generateContractId() {
        return String.format("CON-%d", System.currentTimeMillis());
    }
}
