package com.ultron.backend.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service @Slf4j
public class LocalStorageServiceImpl implements StorageService {
    private static final String UPLOAD_DIR = "./uploads/drive/";

    public LocalStorageServiceImpl() {
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
        } catch (IOException e) {
            log.error("Failed to create upload directory", e);
        }
    }

    @Override
    public void uploadFile(String key, InputStream inputStream, long size) {
        try {
            Path target = Paths.get(UPLOAD_DIR + key.replace("/", "_"));
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + key, e);
        }
    }

    @Override
    public String getFileUrl(String key) {
        return "/api/v1/drive/files-local/" + key;
    }

    @Override
    public void deleteFile(String key) {
        try {
            Files.deleteIfExists(Paths.get(UPLOAD_DIR + key.replace("/", "_")));
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", key);
        }
    }
}
