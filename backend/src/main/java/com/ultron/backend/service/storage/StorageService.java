package com.ultron.backend.service.storage;
import java.io.InputStream;
public interface StorageService {
    void uploadFile(String key, InputStream inputStream, long size);
    String getFileUrl(String key);
    void deleteFile(String key);
}
