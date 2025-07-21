# 1단계: React 앱 빌드
# Node.js 이미지를 기반으로 빌드 환경을 설정합니다.
FROM node:alpine AS build

# 작업 디렉토리를 /app/frontend로 설정합니다.
WORKDIR /app

# package.json과 package-lock.json을 복사합니다.
# 이를 통해 불필요한 npm install을 방지하고 캐시를 활용할 수 있습니다.
COPY package.json package-lock.json ./

# 의존성을 설치합니다.
RUN npm install --silent

# 소스 코드를 복사합니다.
COPY . .

# React 앱을 빌드합니다.
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
ENTRYPOINT [ "nginx","-g","daemon off;" ]
