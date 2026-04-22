package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.CurrencyConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
public interface CurrencyConfigRepository extends MongoRepository<CurrencyConfig, String> {
    Optional<CurrencyConfig> findByTenantId(String tenantId);
}
