package com.ultron.backend.service;

import org.springframework.stereotype.Service;

@Service
public class AssetIdGeneratorService {

    public synchronized String generateAssetId() {
        return String.format("ASSET-%d", System.currentTimeMillis());
    }
}
