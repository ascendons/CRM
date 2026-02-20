package com.ultron.backend.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import java.time.ZoneId;
import java.util.Arrays;

@Configuration
@EnableMongoRepositories(basePackages = "com.ultron.backend.repository")
public class MongoConfig {

    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Bean
    public MongoClient mongoClient() {
        ConnectionString connectionString = new ConnectionString(mongoUri);
        MongoClientSettings mongoClientSettings = MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .build();
        return MongoClients.create(mongoClientSettings);
    }

    @Bean
    public MongoDatabaseFactory mongoDatabaseFactory() {
        return new SimpleMongoClientDatabaseFactory(mongoClient(), "crm_db");
    }

    /**
     * Primary MongoTemplate with tenant-aware filtering
     * Automatically adds tenantId filter to all queries for data isolation
     */
    @Bean
    @Primary
    public MongoTemplate mongoTemplate() {
        return new TenantAwareMongoTemplate(mongoClient(), "crm_db");
    }

    /**
     * Configure MongoDB custom conversions for IST timezone
     * Ensures all date/time values stored and retrieved from MongoDB use IST
     */
    @Bean
    public MongoCustomConversions customConversions() {
        return new MongoCustomConversions(Arrays.asList(
                new LocalDateTimeToDateConverter(),
                new DateToLocalDateTimeConverter()
        ));
    }

    /**
     * Converter to store LocalDateTime as Date in MongoDB (in IST)
     */
    private static class LocalDateTimeToDateConverter implements org.springframework.core.convert.converter.Converter<java.time.LocalDateTime, java.util.Date> {
        @Override
        public java.util.Date convert(java.time.LocalDateTime source) {
            return java.util.Date.from(source.atZone(ZoneId.of("Asia/Kolkata")).toInstant());
        }
    }

    /**
     * Converter to read Date from MongoDB as LocalDateTime (in IST)
     */
    private static class DateToLocalDateTimeConverter implements org.springframework.core.convert.converter.Converter<java.util.Date, java.time.LocalDateTime> {
        @Override
        public java.time.LocalDateTime convert(java.util.Date source) {
            return java.time.LocalDateTime.ofInstant(source.toInstant(), ZoneId.of("Asia/Kolkata"));
        }
    }
}
