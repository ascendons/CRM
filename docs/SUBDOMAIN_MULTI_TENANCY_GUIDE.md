# Multi-Tenant Subdomain Architecture Guide

## Overview

This guide shows how to implement subdomain-based multi-tenancy where each organization gets its own subdomain:
- Main domain: `ascendons.com`
- Tenant subdomains: `wattglow.ascendons.com`, `acme.ascendons.com`, etc.

---

## Architecture

```
User Flow:
ascendons.com (Register) → Choose subdomain "wattglow" → wattglow.ascendons.com

DNS Setup:
*.ascendons.com → CloudFront/ALB → Backend (tenant extracted from subdomain)

Database:
tenants collection: { subdomain: "wattglow", domain: "wattglow.ascendons.com", ... }
users collection: { tenantId: "...", email: "user@wattglow.com", ... }
```

---

## AWS Infrastructure Setup

### 1. DNS Configuration (Route 53)

#### Step 1: Create Hosted Zone

```bash
# Create hosted zone for your domain
aws route53 create-hosted-zone \
  --name ascendons.com \
  --caller-reference $(date +%s)

# Note the nameservers and update them at your domain registrar
```

#### Step 2: Create Wildcard DNS Record

```bash
# Get your hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name ascendons.com \
  --query "HostedZones[0].Id" \
  --output text)

# Create wildcard A record pointing to ALB/CloudFront
cat > wildcard-record.json << 'EOF'
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "*.ascendons.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "YOUR-CLOUDFRONT-DISTRIBUTION.cloudfront.net",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://wildcard-record.json
```

**Note**: For ALB, use ALB's hosted zone ID and DNS name instead.

---

### 2. SSL Certificate (Wildcard Certificate)

#### Option A: Using AWS Certificate Manager (ACM) - Recommended

```bash
# Request wildcard SSL certificate
aws acm request-certificate \
  --domain-name ascendons.com \
  --subject-alternative-names "*.ascendons.com" \
  --validation-method DNS \
  --region us-east-1

# Note the certificate ARN
CERTIFICATE_ARN=<copy-from-output>

# Get validation records
aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-1

# Add the CNAME validation records to Route 53
# AWS Console → Route 53 → Hosted Zones → ascendons.com → Create Record

# Wait for validation (usually 5-30 minutes)
aws acm wait certificate-validated \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-1
```

#### What This Certificate Covers:
- ✅ `ascendons.com`
- ✅ `*.ascendons.com` (all subdomains)
  - `wattglow.ascendons.com`
  - `acme.ascendons.com`
  - `client123.ascendons.com`
  - etc.

---

### 3. Load Balancer Configuration

#### Update ALB to Accept All Subdomains

```bash
# Get your ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names crm-backend-alb \
  --query "LoadBalancers[0].LoadBalancerArn" \
  --output text)

# Update HTTPS listener with wildcard certificate
aws elbv2 modify-listener \
  --listener-arn <LISTENER_ARN> \
  --certificates CertificateArn=$CERTIFICATE_ARN \
  --protocol HTTPS \
  --port 443
```

#### Add Listener Rule for Wildcard Domains

```bash
# Create rule to forward all *.ascendons.com to target group
cat > listener-rule.json << 'EOF'
{
  "Priority": 1,
  "Conditions": [
    {
      "Field": "host-header",
      "HostHeaderConfig": {
        "Values": ["*.ascendons.com", "ascendons.com"]
      }
    }
  ],
  "Actions": [
    {
      "Type": "forward",
      "TargetGroupArn": "<YOUR_TARGET_GROUP_ARN>"
    }
  ]
}
EOF

aws elbv2 create-rule \
  --listener-arn <LISTENER_ARN> \
  --cli-input-json file://listener-rule.json
```

---

### 4. CloudFront Distribution (Optional - for better performance)

```bash
# Create CloudFront distribution with custom domain
cat > cloudfront-config.json << 'EOF'
{
  "Comment": "CRM Multi-tenant Distribution",
  "Enabled": true,
  "Origins": [
    {
      "Id": "ALB-Origin",
      "DomainName": "crm-backend-alb-123456789.us-east-1.elb.amazonaws.com",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "https-only"
      }
    }
  ],
  "Aliases": ["ascendons.com", "*.ascendons.com"],
  "ViewerCertificate": {
    "ACMCertificateArn": "$CERTIFICATE_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "ALB-Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
    "CachedMethods": ["GET", "HEAD", "OPTIONS"],
    "ForwardedValues": {
      "QueryString": true,
      "Headers": ["Host", "Origin", "Authorization"]
    }
  }
}
EOF

aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

---

## Backend Implementation

### 1. Database Schema Updates

#### Add Tenant/Organization Model

Create: `backend/src/main/java/com/ultron/backend/model/Tenant.java`

```java
package com.ultron.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tenants")
public class Tenant {

    @Id
    private String id;

    @Indexed(unique = true)
    private String subdomain; // e.g., "wattglow"

    @Indexed(unique = true)
    private String domain; // e.g., "wattglow.ascendons.com"

    private String organizationName; // e.g., "Wattglow Inc."

    private String primaryEmail;
    private String primaryContactName;
    private String phone;

    private TenantStatus status; // ACTIVE, SUSPENDED, TRIAL, CANCELLED

    private TenantPlan plan; // FREE, BASIC, PREMIUM, ENTERPRISE

    private LocalDateTime trialEndsAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private TenantSettings settings;

    private Boolean isDeleted;

    public enum TenantStatus {
        TRIAL, ACTIVE, SUSPENDED, CANCELLED
    }

    public enum TenantPlan {
        FREE, BASIC, PREMIUM, ENTERPRISE
    }
}
```

#### Tenant Settings Model

```java
package com.ultron.backend.model;

import lombok.Data;

@Data
public class TenantSettings {
    private String logo;
    private String primaryColor;
    private String secondaryColor;
    private String timezone;
    private String language;
    private Integer maxUsers;
    private Integer maxLeads;
    private Boolean customBranding;
}
```

---

### 2. Tenant Context Filter (Extract Subdomain)

Create: `backend/src/main/java/com/ultron/backend/filter/TenantContextFilter.java`

```java
package com.ultron.backend.filter;

import com.ultron.backend.context.TenantContext;
import com.ultron.backend.model.Tenant;
import com.ultron.backend.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantContextFilter extends OncePerRequestFilter {

    private final TenantRepository tenantRepository;
    private static final String BASE_DOMAIN = "ascendons.com";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            String host = request.getHeader("Host");
            String subdomain = extractSubdomain(host);

            log.debug("Processing request for host: {}, subdomain: {}", host, subdomain);

            if (subdomain != null && !subdomain.isEmpty()) {
                // Find tenant by subdomain
                Optional<Tenant> tenant = tenantRepository.findBySubdomain(subdomain);

                if (tenant.isPresent()) {
                    if (tenant.get().getStatus() != Tenant.TenantStatus.ACTIVE
                        && tenant.get().getStatus() != Tenant.TenantStatus.TRIAL) {
                        response.sendError(HttpServletResponse.SC_FORBIDDEN,
                            "This organization account is suspended");
                        return;
                    }

                    // Set tenant context
                    TenantContext.setTenantId(tenant.get().getId());
                    log.debug("Set tenant context: {}", tenant.get().getId());
                } else {
                    // Subdomain exists but no tenant found
                    if (!isPublicPath(request.getRequestURI())) {
                        response.sendError(HttpServletResponse.SC_NOT_FOUND,
                            "Organization not found");
                        return;
                    }
                }
            } else {
                // Main domain (no subdomain) - used for registration
                log.debug("Main domain request - no tenant context");
            }

            filterChain.doFilter(request, response);

        } finally {
            // Clear tenant context after request
            TenantContext.clear();
        }
    }

    private String extractSubdomain(String host) {
        if (host == null) {
            return null;
        }

        // Remove port if present
        host = host.split(":")[0];

        // Remove base domain
        if (host.endsWith("." + BASE_DOMAIN)) {
            String subdomain = host.substring(0, host.length() - BASE_DOMAIN.length() - 1);
            // Ignore www
            return "www".equals(subdomain) ? null : subdomain;
        }

        // localhost or IP - no subdomain
        if (host.equals(BASE_DOMAIN) || host.equals("localhost") || host.matches("\\d+\\.\\d+\\.\\d+\\.\\d+")) {
            return null;
        }

        return null;
    }

    private boolean isPublicPath(String path) {
        return path.startsWith("/api/v1/auth/register")
            || path.startsWith("/api/v1/tenants/check-subdomain")
            || path.startsWith("/api/v1/health")
            || path.startsWith("/api/v1/actuator");
    }
}
```

---

### 3. Tenant Context Holder (Thread-Local Storage)

Create: `backend/src/main/java/com/ultron/backend/context/TenantContext.java`

```java
package com.ultron.backend.context;

public class TenantContext {

    private static final ThreadLocal<String> TENANT_ID = new ThreadLocal<>();

    public static void setTenantId(String tenantId) {
        TENANT_ID.set(tenantId);
    }

    public static String getTenantId() {
        return TENANT_ID.get();
    }

    public static void clear() {
        TENANT_ID.remove();
    }
}
```

---

### 4. Tenant Repository

Create: `backend/src/main/java/com/ultron/backend/repository/TenantRepository.java`

```java
package com.ultron.backend.repository;

import com.ultron.backend.model.Tenant;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantRepository extends MongoRepository<Tenant, String> {

    Optional<Tenant> findBySubdomain(String subdomain);

    Optional<Tenant> findByDomain(String domain);

    boolean existsBySubdomain(String subdomain);

    Optional<Tenant> findByIdAndIsDeletedFalse(String id);
}
```

---

### 5. Tenant Registration Controller

Create: `backend/src/main/java/com/ultron/backend/controller/TenantController.java`

```java
package com.ultron.backend.controller;

import com.ultron.backend.dto.TenantRegistrationRequest;
import com.ultron.backend.dto.TenantRegistrationResponse;
import com.ultron.backend.dto.SubdomainCheckResponse;
import com.ultron.backend.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping("/register")
    public ResponseEntity<TenantRegistrationResponse> registerTenant(
            @Valid @RequestBody TenantRegistrationRequest request) {
        TenantRegistrationResponse response = tenantService.registerTenant(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-subdomain/{subdomain}")
    public ResponseEntity<SubdomainCheckResponse> checkSubdomainAvailability(
            @PathVariable String subdomain) {
        boolean available = !tenantService.subdomainExists(subdomain);
        return ResponseEntity.ok(new SubdomainCheckResponse(available, subdomain));
    }
}
```

---

### 6. DTOs

Create: `backend/src/main/java/com/ultron/backend/dto/TenantRegistrationRequest.java`

```java
package com.ultron.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class TenantRegistrationRequest {

    @NotBlank(message = "Organization name is required")
    @Size(min = 2, max = 100)
    private String organizationName;

    @NotBlank(message = "Subdomain is required")
    @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
             message = "Subdomain can only contain lowercase letters, numbers, and hyphens")
    @Size(min = 3, max = 30)
    private String subdomain;

    @NotBlank(message = "Admin email is required")
    @Email
    private String adminEmail;

    @NotBlank(message = "Admin name is required")
    private String adminName;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private String phone;
}
```

```java
package com.ultron.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TenantRegistrationResponse {
    private String tenantId;
    private String subdomain;
    private String domain;
    private String redirectUrl;
    private String message;
}
```

```java
package com.ultron.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SubdomainCheckResponse {
    private boolean available;
    private String subdomain;
}
```

---

### 7. Tenant Service

Create: `backend/src/main/java/com/ultron/backend/service/TenantService.java`

```java
package com.ultron.backend.service;

import com.ultron.backend.dto.TenantRegistrationRequest;
import com.ultron.backend.dto.TenantRegistrationResponse;
import com.ultron.backend.model.Role;
import com.ultron.backend.model.Tenant;
import com.ultron.backend.model.User;
import com.ultron.backend.repository.RoleRepository;
import com.ultron.backend.repository.TenantRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String BASE_DOMAIN = "ascendons.com";

    @Transactional
    public TenantRegistrationResponse registerTenant(TenantRegistrationRequest request) {

        // Validate subdomain availability
        if (tenantRepository.existsBySubdomain(request.getSubdomain())) {
            throw new IllegalArgumentException("Subdomain already taken");
        }

        // Create tenant
        String domain = request.getSubdomain() + "." + BASE_DOMAIN;
        Tenant tenant = Tenant.builder()
                .subdomain(request.getSubdomain())
                .domain(domain)
                .organizationName(request.getOrganizationName())
                .primaryEmail(request.getAdminEmail())
                .primaryContactName(request.getAdminName())
                .phone(request.getPhone())
                .status(Tenant.TenantStatus.TRIAL)
                .plan(Tenant.TenantPlan.FREE)
                .trialEndsAt(LocalDateTime.now().plusDays(30))
                .createdAt(LocalDateTime.now())
                .isDeleted(false)
                .build();

        tenant = tenantRepository.save(tenant);
        log.info("Created tenant: {} with subdomain: {}", tenant.getId(), tenant.getSubdomain());

        // Create admin role for this tenant
        Role adminRole = Role.builder()
                .name("ADMIN")
                .description("Organization Administrator")
                .tenantId(tenant.getId())
                .permissions(java.util.Arrays.asList("ALL"))
                .isDeleted(false)
                .build();
        adminRole = roleRepository.save(adminRole);

        // Create admin user
        User adminUser = User.builder()
                .email(request.getAdminEmail())
                .name(request.getAdminName())
                .password(passwordEncoder.encode(request.getPassword()))
                .roleId(adminRole.getId())
                .tenantId(tenant.getId())
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(adminUser);

        log.info("Created admin user for tenant: {}", tenant.getId());

        String redirectUrl = "https://" + domain;

        return new TenantRegistrationResponse(
                tenant.getId(),
                tenant.getSubdomain(),
                tenant.getDomain(),
                redirectUrl,
                "Organization registered successfully. Redirecting to " + redirectUrl
        );
    }

    public boolean subdomainExists(String subdomain) {
        return tenantRepository.existsBySubdomain(subdomain);
    }
}
```

---

## Frontend Implementation

### 1. Registration Page with Subdomain Selection

Update: `frontend/src/app/register/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TenantRegistrationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    organizationName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    password: '',
    phone: ''
  });
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkSubdomain = async (subdomain: string) => {
    if (subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setChecking(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tenants/check-subdomain/${subdomain}`
      );
      const data = await response.json();
      setSubdomainAvailable(data.available);
    } catch (err) {
      console.error('Error checking subdomain:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, subdomain: value });

    // Debounce subdomain check
    const timeoutId = setTimeout(() => checkSubdomain(value), 500);
    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();

      // Redirect to tenant subdomain
      window.location.href = data.redirectUrl;

    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Your Organization</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Organization Name
            </label>
            <input
              type="text"
              required
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Wattglow Inc."
            />
          </div>

          {/* Subdomain */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Choose Your Subdomain
            </label>
            <div className="flex items-center">
              <input
                type="text"
                required
                value={formData.subdomain}
                onChange={handleSubdomainChange}
                className="w-full px-3 py-2 border rounded-l-md"
                placeholder="wattglow"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                minLength={3}
                maxLength={30}
              />
              <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-md text-gray-600">
                .ascendons.com
              </span>
            </div>
            {checking && <p className="text-sm text-gray-500 mt-1">Checking...</p>}
            {subdomainAvailable === true && (
              <p className="text-sm text-green-600 mt-1">✓ Available</p>
            )}
            {subdomainAvailable === false && (
              <p className="text-sm text-red-600 mt-1">✗ Already taken</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Your organization will be accessible at: {formData.subdomain}.ascendons.com
            </p>
          </div>

          {/* Admin Details */}
          <div>
            <label className="block text-sm font-medium mb-1">Admin Name</label>
            <input
              type="text"
              required
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Admin Email</label>
            <input
              type="email"
              required
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !subdomainAvailable}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### 2. Update CORS Configuration in Backend

Update: `backend/src/main/java/com/ultron/backend/config/WebConfig.java`

```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
            .allowedOriginPatterns("https://*.ascendons.com", "http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
}
```

---

## Testing

### 1. Local Testing with Subdomain

Add to `/etc/hosts` (macOS/Linux):
```bash
127.0.0.1 ascendons.local
127.0.0.1 wattglow.ascendons.local
127.0.0.1 acme.ascendons.local
```

### 2. Test Flow

```bash
# 1. Register new tenant
curl -X POST http://localhost:8080/api/v1/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Wattglow Inc.",
    "subdomain": "wattglow",
    "adminName": "John Doe",
    "adminEmail": "admin@wattglow.com",
    "password": "SecurePass123"
  }'

# 2. Check subdomain
curl http://localhost:8080/api/v1/tenants/check-subdomain/wattglow

# 3. Login to tenant subdomain
curl -X POST http://wattglow.ascendons.local:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@wattglow.com",
    "password": "SecurePass123"
  }'
```

---

## Production Deployment Checklist

- [ ] Domain purchased and configured in Route 53
- [ ] Wildcard SSL certificate requested and validated
- [ ] Wildcard DNS record created (*.ascendons.com)
- [ ] ALB/CloudFront configured with wildcard certificate
- [ ] Backend deployed with tenant filter
- [ ] Frontend deployed with subdomain support
- [ ] CORS configured for wildcard domains
- [ ] Database indexes created for tenant queries
- [ ] Monitoring set up for tenant isolation

---

## Security Considerations

1. **Tenant Isolation**: Ensure all database queries are filtered by tenantId
2. **Subdomain Validation**: Prevent reserved subdomains (www, api, admin, etc.)
3. **Rate Limiting**: Per-tenant rate limiting
4. **Data Isolation**: Each tenant's data is completely isolated
5. **SSL**: Always use HTTPS for all subdomains

---

## Cost Implications

- **Wildcard SSL**: FREE with AWS ACM
- **Route 53 Hosted Zone**: $0.50/month
- **CloudFront**: ~$0.085 per GB (optional)
- **No additional cost** for handling multiple subdomains

**Total Additional Cost**: ~$1-5/month

---

## Summary

✅ **Yes, AWS fully supports multi-tenant subdomains**
✅ **Wildcard SSL certificates are FREE via ACM**
✅ **Minimal additional cost**
✅ **Scalable to thousands of tenants**
✅ **Industry-standard architecture**

Each tenant gets:
- Their own subdomain (wattglow.ascendons.com)
- Isolated data in the database
- Custom branding (optional)
- Independent user management
