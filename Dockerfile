FROM openjdk:17-jdk-slim
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew bootJar
ENV JAR_PATH=/app/build/libs
RUN mv ${JAR_PATH}/*.jar /app/app.jar
# prod 프로필 활성화
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]