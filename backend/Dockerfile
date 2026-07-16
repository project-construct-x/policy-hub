# syntax=docker/dockerfile:1

# --- Stage 1: build the executable jar -------------------------------------
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy the Gradle wrapper + build scripts first so dependency resolution is
# cached independently of source changes.
COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle.kts settings.gradle.kts ./
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies

# Now copy sources and build. bootJar (not build) => no Testcontainers tests,
# so the image build does not require Docker-in-Docker.
COPY src ./src
RUN ./gradlew --no-daemon clean bootJar

# --- Stage 2: minimal runtime ----------------------------------------------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Run as a non-root user.
RUN groupadd --system spring && useradd --system --gid spring spring
USER spring:spring

# Copy the Spring Boot executable jar. bootJar produces exactly one jar in
# build/libs, so the glob stays correct across version bumps.
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
