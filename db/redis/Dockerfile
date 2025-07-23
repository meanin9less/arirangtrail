# 1. 베이스 이미지 선택
# 공식 Redis 이미지 중에서도 용량이 작고 보안에 유리한 Alpine 버전을 사용합니다.
# 'latest' 태그보다는 특정 버전을 명시하는 것이 안정적입니다.
FROM redis:7-alpine

# 2. 설정 파일 복사
# 로컬에 있는 redis.conf 파일을 이미지 내부의 Redis 공식 설정 파일 경로로 복사합니다.
# 이 한 줄을 통해 우리가 정의한 설정으로 Redis 서버가 실행됩니다.
COPY redis.conf /usr/local/etc/redis/redis.conf

# 4. 포트 노출
# Redis의 기본 포트인 6379를 외부에 노출하도록 명시합니다.
EXPOSE 6379

# 5. 컨테이너 실행 명령어
# 컨테이너가 시작될 때, 우리가 복사한 설정 파일을 사용하여 Redis 서버를 실행합니다.
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]