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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
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

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserRepository userRepository;
    private final RedisTemplate redisTemplate;
    private final AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository;


    // OAuth2SuccessHandler.java의 수정된 부분

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        // CustomOAuth2UserService에서 반환한 CustomOAuth2User 객체를 가져옴
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        long accessTokenValidityInSeconds = 600L;

        String name = oAuth2User.getUserName();
        String email = oAuth2User.getEmail();

        String code = UUID.randomUUID().toString();

        OAuth2AuthorizationRequest oAuth2AuthorizationRequest = authorizationRequestRepository.loadAuthorizationRequest(request);
        String state = oAuth2AuthorizationRequest.getState();
        boolean isApp = state != null && state.contains("client_type=app");
        log.info("OAuth2 Success: state={}, isApp={}", state, isApp);

        Optional<UserEntity> loginUserOptional = this.userRepository.findByEmail(email);
        //1. 신규 사용자
        if (loginUserOptional.isEmpty()) {
            String targetUrl;
            if (isApp) {
                // 앱의 경우 커스텀 스킴 사용
                targetUrl = UriComponentsBuilder.fromUriString("arirangtrail://simplejoin")
                        .queryParam("username", name)
                        .queryParam("email", email)
                        .encode(StandardCharsets.UTF_8)
                        .build().toUriString();
            } else {
                // 웹의 경우 기존 URL 사용
                targetUrl = UriComponentsBuilder.fromUriString("http://arirangtrail.duckdns.org/simplejoin")
                        .queryParam("username", name)
                        .queryParam("email", email)
                        .encode(StandardCharsets.UTF_8)
                        .build().toUriString();
            }
            response.sendRedirect(targetUrl);
            return;
        }

        //2. 기존 사용자
        UserEntity user = loginUserOptional.get();

        String access = jwtUtil.createToken("access", user.getUsername(), user.getRole(), accessTokenValidityInSeconds * 1000L);
        String refresh = jwtUtil.createToken("refresh", user.getUsername(), user.getRole(), 24 * 60 * 60 * 1000L);

        // redis에 모든 정보를 Map 형태로 저장
        Map<String, Object> tokenData = new HashMap<>();
        tokenData.put("accessToken", "Bearer " + access);
        tokenData.put("refreshToken", refresh);
        tokenData.put("expiresIn", accessTokenValidityInSeconds);

        // UserProfile 한번에 담기 위해 별도의 Map을 만듭니다.
        Map<String, Object> userProfileData = new HashMap<>();
        userProfileData.put("username", user.getUsername());
        userProfileData.put("nickname", user.getNickname());
        userProfileData.put("imageUrl", user.getImageurl());

        tokenData.put("userProfile", userProfileData);

        // 1분 유효
        redisTemplate.opsForValue().set("oauth-code:" + code, tokenData, Duration.ofMinutes(1));

        // 클라이언트(Web/App)에 따라 분기 처리
        if (isApp) {
            // 안드로이드 앱일 경우: 커스텀 스킴으로 리다이렉트
            // 중요: 쿼리 파라미터를 포함한 완전한 URL을 생성
            String targetUrl = UriComponentsBuilder.fromUriString("arirangtrail://oauth-callback")
                    .queryParam("code", code)
                    .encode(StandardCharsets.UTF_8)
                    .build().toUriString();

            log.info("App OAuth redirect URL: {}", targetUrl);
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
            String targetUrl = UriComponentsBuilder.fromUriString("http://arirangtrail.duckdns.org/userinfo")
                    .queryParam("token", "Bearer " + access)
                    .queryParam("expiresIn", accessTokenValidityInSeconds)
                    .queryParam("username", user.getUsername())
                    .queryParam("nickname", user.getNickname())
                    .encode(StandardCharsets.UTF_8).build().toUriString();

            response.sendRedirect(targetUrl);
        }
    }
}
