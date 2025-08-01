package com.example.arirangtrail.service.Oauth2;

import com.example.arirangtrail.data.dto.oauth2.CustomOAuth2User;
import com.example.arirangtrail.data.entity.UserEntity;
import com.example.arirangtrail.data.repository.UserRepository;
import com.example.arirangtrail.jwt.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserRepository userRepository;
    private final RedisTemplate redisTemplate;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        // CustomOAuth2UserService에서 반환한 CustomOAuth2User 객체를 가져옴
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();

        String name = oAuth2User.getUserName();
        String email = oAuth2User.getEmail();

        String code = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set("code:" + code, email, Duration.ofMinutes(3));

        String clientType = request.getParameter("client_type");
        boolean isApp = "app".equalsIgnoreCase(clientType);

//        String appHeader = request.getHeader("androidApp");
//        boolean isApp = appHeader != null && appHeader.equalsIgnoreCase("AndroidApp");

        Optional<UserEntity> loginUserOptional = this.userRepository.findByEmail(email);
        if (loginUserOptional.isEmpty()) {
            String targetUrl = UriComponentsBuilder.fromUriString(isApp ? "arirangtrail://simplejoin" : "http://arirangtrail.duckdns.org/simplejoin")
                    .queryParam("username", name)
                    .queryParam("email", email)
                    .queryParam("code", code)
                    .encode(StandardCharsets.UTF_8)
                    .build().toUriString();
            response.sendRedirect(targetUrl);
            return;
        }

        UserEntity user = loginUserOptional.get();

        String access = jwtUtil.createToken("access", user.getUsername(), user.getRole(), 60 * 10 * 1000L);
        String refresh = jwtUtil.createToken("refresh", user.getUsername(), user.getRole(), 24 * 60 * 60 * 1000L);

        // 클라이언트(Web/App)에 따라 분기 처리


        if (isApp) {
            // 안드로이드 앱일 경우: 토큰을 담아 커스텀 스킴으로 리다이렉트
            String targetUrl = UriComponentsBuilder.fromUriString("arirangtrail://oauth-callback")
                    .queryParam("code", code)
                    .encode(StandardCharsets.UTF_8)
                    .build().toUriString();
            response.sendRedirect(targetUrl);
        } else {
            // 웹 브라우저일 경우: 쿠키와 리다이렉트
            ResponseCookie cookie = ResponseCookie.from("refresh", refresh)
                    .httpOnly(true)
                    .secure(false) // 운영 시 true
                    .path("/")
                    .maxAge(24 * 60 * 60)
                    .sameSite("Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            response.addHeader("authorization", "Bearer " + access);
            response.sendRedirect("http://arirangtrail.duckdns.org/userinfo"); // 원하는 페이지로 리다이렉트
        }
    }
}
