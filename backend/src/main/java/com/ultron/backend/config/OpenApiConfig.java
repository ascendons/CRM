package com.ultron.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger configuration for API documentation
 * Accessible at: http://localhost:8080/api/v1/swagger-ui.html
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CRM Backend API")
                        .version("1.0.0")
                        .description("""
                                Comprehensive CRM API with:
                                - User Management & Authentication
                                - Leads, Contacts, Accounts Management
                                - Opportunities & Proposals
                                - Dynamic Product Catalog (Schema-less)
                                - User Activity Tracking
                                - Product Import/Export

                                ## Dynamic Product Catalog
                                Upload Excel/CSV with ANY headers - system automatically adapts!
                                No code changes needed for new product fields.
                                """)
                        .contact(new Contact()
                                .name("Ultron CRM Team")
                                .email("support@ultroncrm.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080/api/v1")
                                .description("Local Development Server"),
                        new Server()
                                .url("https://api.ultroncrm.com/api/v1")
                                .description("Production Server")
                ))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT token obtained from /auth/login endpoint")))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
    }
}
