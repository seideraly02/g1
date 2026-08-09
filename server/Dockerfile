FROM gradle:8.14.3-jdk21 AS build
WORKDIR /workspace

COPY build.gradle.kts settings.gradle.kts ./
RUN gradle --no-daemon dependencies

COPY src ./src
RUN gradle --no-daemon clean bootJar

FROM eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --system --uid 10001 --create-home qadam
COPY --from=build /workspace/build/libs/*.jar /app/app.jar

USER qadam
EXPOSE 3000

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-XX:+ExitOnOutOfMemoryError", "-jar", "/app/app.jar"]
