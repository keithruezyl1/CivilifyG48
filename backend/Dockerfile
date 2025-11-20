# Multi-stage Docker build for Civilify Spring Boot backend

# ========== Build stage ==========
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Maven wrapper and project files first to leverage Docker layer cache
COPY .mvn/ .mvn/
COPY mvnw mvnw
COPY pom.xml pom.xml

# Ensure wrapper is executable
RUN chmod +x mvnw

# Download dependencies (go-offline) to cache deps layer
RUN ./mvnw -B -q -DskipTests dependency:go-offline

# Copy source and build the jar
COPY src ./src
RUN ./mvnw -B -DskipTests package

# ========== Runtime stage ==========
FROM eclipse-temurin:17-jre
WORKDIR /app

# App port (Spring Boot default overridden below via server.port)
ENV PORT=8081
EXPOSE 8081

# Copy built artifact
COPY --from=build /app/target/civilify-0.0.1-SNAPSHOT.jar app.jar

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "Starting Civilify backend..."' >> /app/start.sh && \
    echo 'echo "FIREBASE_SERVICE_ACCOUNT_JSON length: ${#FIREBASE_SERVICE_ACCOUNT_JSON}"' >> /app/start.sh && \
    echo 'if [ -n "$FIREBASE_SERVICE_ACCOUNT_JSON" ]; then' >> /app/start.sh && \
    echo '  echo "Writing Firebase service account JSON to /app/firebase.json"' >> /app/start.sh && \
    echo '  echo "$FIREBASE_SERVICE_ACCOUNT_JSON" > /app/firebase.json' >> /app/start.sh && \
    echo '  chmod 600 /app/firebase.json' >> /app/start.sh && \
    echo '  echo "Firebase JSON file created successfully"' >> /app/start.sh && \
    echo '  ls -la /app/firebase.json' >> /app/start.sh && \
    echo '  echo "Waiting 2 seconds to ensure file is fully written..."' >> /app/start.sh && \
    echo '  sleep 2' >> /app/start.sh && \
    echo '  echo "Verifying file exists and is readable..."' >> /app/start.sh && \
    echo '  if [ -f /app/firebase.json ] && [ -r /app/firebase.json ]; then' >> /app/start.sh && \
    echo '    echo "Firebase JSON file is ready!"' >> /app/start.sh && \
    echo '  else' >> /app/start.sh && \
    echo '    echo "ERROR: Firebase JSON file is not accessible!"' >> /app/start.sh && \
    echo '    exit 1' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '  echo "ERROR: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set!"' >> /app/start.sh && \
    echo '  exit 1' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'echo "Starting Spring Boot application..."' >> /app/start.sh && \
    echo 'exec java -jar app.jar --server.port=${PORT}' >> /app/start.sh && \
    chmod +x /app/start.sh

# JVM options: enable container-aware settings and smaller footprint
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0"

# Run the application, binding to Render's provided PORT
CMD ["/app/start.sh"]


