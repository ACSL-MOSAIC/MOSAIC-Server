# Build stage
FROM azul/zulu-openjdk:21 AS builder

WORKDIR /build

# Copy Gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# Download dependencies (cached layer)
RUN ./gradlew dependencies --no-daemon || true

# Copy source code
COPY src src

# Build application
RUN ./gradlew bootJar --no-daemon

# Runtime stage
FROM azul/zulu-openjdk:21-jre

WORKDIR /mosaic-server

# Create directories for storage and logs
RUN mkdir -p storage logs

# Copy JAR from build stage
COPY --from=builder /build/build/libs/*.jar app.jar

# Expose application port
EXPOSE 9001

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]