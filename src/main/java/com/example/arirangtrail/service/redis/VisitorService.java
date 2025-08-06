package com.example.arirangtrail.service.redis;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class VisitorService {
    // 기존 RedisConfig에 정의된 <String, Object> 타입의 RedisTemplate을 주입받습니다.
    private final RedisTemplate<String, Object> redisTemplate;
    // 쿠키 삽입으로 방문자 구분할 예정임. 우리는 비지터 쿠키 네임 해서만 적용하면 브라우저에서 사이트의 이름 꼬리표는 붙은채로 저장됨.
    private static final String VISITOR_COOKIE_NAME = "_visitor_id";

    public void recordVisitor(HttpServletRequest request, HttpServletResponse response) {
        // 1. 오늘 날짜로 Redis Key 생성 (예: "visitors:2025-07-30")
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String dailyVisitorKey = "visitors:" + today;

        // 2. 쿠키에서 방문자 ID 가져오기
        String visitorId = getVisitorIdFromCookie(request);

        // 3. 쿠키가 없는 신규 방문자일 경우
        if (visitorId == null) {
            visitorId = UUID.randomUUID().toString();
            //여기가 바로 쿠키를 생성해서 응답에 추가하는 부분입니다.
            addVisitorCookie(response, visitorId);
        }

        // 4. Redis Set에 방문자 ID 추가
        //opsForSet().add는 자바식 레디스의 SADD 명령어로, 결과는 추가된 멤버의 수입니다. (새 멤버면 1, 이미 있으면 0을 반환시키므로 처음인지 연계)
        // 지금 구조는 다 (키,(중복안되는키들,더미값)) 형태의 set 구조임
        Long newVisitors = redisTemplate.opsForSet().add(dailyVisitorKey, visitorId);

        // 5. Redis Key에 만료 시간 1일 설정 (오늘 처음 생성된 경우에만)
        if (newVisitors != null && newVisitors == 1L) {// L은 롱 타입일치위해 굳이 씀
            redisTemplate.expire(dailyVisitorKey, 1, TimeUnit.DAYS);
        }
    }

    // 오늘 하루만의 방문객 수 반환함
    public Long getDailyVisitorCount() {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String dailyVisitorKey = "visitors:" + today;
        // SCARD 명령어로 Set의 크기를 가져옵니다. 키에 쌓인 총 원소수를 가져옴
        return redisTemplate.opsForSet().size(dailyVisitorKey);
    }

    // 방문자에게 쿠키 받기
    private String getVisitorIdFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        return Arrays.stream(cookies)
                .filter(cookie -> VISITOR_COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    // 방문자에게 쿠키 더하기
    private void addVisitorCookie(HttpServletResponse response, String visitorId) {
        Cookie cookie = new Cookie(VISITOR_COOKIE_NAME, visitorId);
        cookie.setPath("/"); // 모든 경로에서 쿠키 사용
        cookie.setMaxAge(60 * 60 * 24 * 365); // 쿠키 유효기간 1년
        // cookie.setHttpOnly(true); // JavaScript에서 접근 불가 설정 (보안 강화)
        response.addCookie(cookie);
    }
}