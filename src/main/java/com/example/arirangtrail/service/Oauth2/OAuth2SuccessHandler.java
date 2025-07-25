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
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        // CustomOAuth2UserService에서 반환한 CustomOAuth2User 객체를 가져옴
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();

        String name = oAuth2User.getUserName();
        String email = oAuth2User.getEmail();

        Optional<UserEntity> loginUserOptional = this.userRepository.findByEmail(email);
        if (loginUserOptional.isEmpty()) {
            String targetUrl = UriComponentsBuilder.fromUriString("http://arirangtrail.duckdns.org/simplejoin")
                    .queryParam("username", name)
                    .queryParam("email", email)
                    .encode(StandardCharsets.UTF_8)
                    .build().toUriString();
            response.sendRedirect(targetUrl);
            return;
        }

        UserEntity user = loginUserOptional.get();

        String access = jwtUtil.createToken("access", user.getUsername(), user.getRole(), 60 * 10 * 1000L);
        String refresh = jwtUtil.createToken("refresh", user.getUsername(), user.getRole(), 24 * 60 * 60 * 1000L);

        // 클라이언트(Web/App)에 따라 분기 처리
        String appHeader = request.getHeader("andriodApp");
        boolean isApp = appHeader != null && appHeader.equalsIgnoreCase("AndroidApp");

        if (isApp) {
            // 안드로이드 앱일 경우: JSON으로 토큰 응답
            Map<String, String> tokenMap = new HashMap<>();
            tokenMap.put("access_token", "Bearer " + access);
            tokenMap.put("refresh_token", refresh);

            response.setStatus(HttpStatus.OK.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(tokenMap));
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
            response.addHeader("Authorization", "Bearer " + access);
            response.sendRedirect("http://arirangtrail.duckdns.org/userinfo"); // 원하는 페이지로 리다이렉트
        }
    }
}
