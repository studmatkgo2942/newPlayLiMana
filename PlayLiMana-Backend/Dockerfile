### Stage 1: Builder ###
FROM gradle:8.7.0-jdk17-alpine AS build_stage
RUN mkdir /opt/app
WORKDIR /opt/app

# Copy Wrapper
COPY gradlew gradlew
COPY gradle gradle

# Download and Cache Gradle Wrapper
RUN apk add --no-cache dos2unix
RUN dos2unix gradlew
RUN chmod +x gradlew
RUN ./gradlew --version
 
# COPY Files
COPY gradle.properties gradle.properties
COPY build.gradle build.gradle
COPY settings.gradle settings.gradle
COPY src src

# Build
RUN ./gradlew quarkusBuild --no-daemon


### Stage 2: Runtime ###
FROM eclipse-temurin:17.0.6_10-jre

RUN mkdir /opt/app
WORKDIR /opt/app
COPY --from=build_stage /opt/app/build/quarkus-app /opt/app/

EXPOSE 9000
ENV MACHINE=dev
ENTRYPOINT ["java", "-jar", "-Dquarkus.container-image.build=true", "-Dquarkus.profile=dev", "/opt/app/quarkus-run.jar"]
