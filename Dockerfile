FROM openjdk:17-jdk-slim
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
#RUN ./gradlew bootJar 빌드 캐시 리셋
RUN ./gradlew clean bootJar --no-build-cache
ENV JAR_PATH=/app/build/libs
RUN mv ${JAR_PATH}/*.jar /app/app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]