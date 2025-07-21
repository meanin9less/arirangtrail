# 베이스 이미지
FROM mongo:7.0

# 초기화 스크립트(.sh)와 데이터 파일(.json)들을
# 컨테이너의 초기화 디렉토리로 복사합니다.
# 이 디렉토리 안의 파일들은 알파벳 순서대로 실행됩니다.
COPY init-mongo.sh /docker-entrypoint-initdb.d/init-mongo.sh
COPY posts.json /docker-entrypoint-initdb.d/posts.json
COPY users.json /docker-entrypoint-initdb.d/users.json

# (선택) mongod.conf 설정 파일 복사
# COPY mongod.conf /etc/mongod.conf
# CMD ["mongod", "--config", "/etc/mongod.conf"]```

