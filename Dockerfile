# 1단계: 실행을 위한 JRE 기반의 작은 이미지 사용
FROM openjdk:17-jdk-slim
WORKDIR /app

# 2단계: GitHub Actions 워크플로우에서 빌드하고 생성한 JAR 파일을 이미지로 복사
# build/libs/ 디렉토리에 있는 JAR 파일을 app.jar 라는 이름으로 복사합니다.
COPY build/libs/*.jar app.jar

# 4단계: 애플리케이션 실행 포트 노출
EXPOSE 8080

# 5단계: 애플리케이션 실행
# Docker 컨테이너가 시작될 때 이 명령어가 실행됩니다.
ENTRYPOINT ["java", "-jar", "app.jar"]