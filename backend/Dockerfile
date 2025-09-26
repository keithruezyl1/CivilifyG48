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

# JVM options: enable container-aware settings and smaller footprint
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0"

# Run the application, binding to Render's provided PORT
CMD ["java", "-jar", "app.jar", "--server.port=${PORT}"]


