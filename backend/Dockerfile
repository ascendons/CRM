# Multi-stage build for optimized production image

# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Download dependencies (cached layer)
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src ./src

# Build application
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 spring && \
    adduser -D -u 1001 -G spring spring

# Copy JAR from build stage
COPY --from=build /app/target/backend-*.jar app.jar

# Create logs directory
RUN mkdir -p /var/log/crm && \
    chown -R spring:spring /var/log/crm

# Switch to non-root user
USER spring:spring

# Expose port (informational)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=180s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dspring.profiles.active=prod", \
    "-jar", \
    "/app/app.jar"]
