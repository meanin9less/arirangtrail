package com.example.arirangtrail.config;

import com.example.arirangtrail.config.oauth2.CustomAuthorizationRequestResolver;
import com.example.arirangtrail.jwt.JwtFilter;
import com.example.arirangtrail.jwt.JwtLoginFilter;
import com.example.arirangtrail.jwt.JwtUtil;
import com.example.arirangtrail.jwt.customuserdetails.CustomUserDetailsService;
import com.example.arirangtrail.service.Oauth2.CustomOAuth2UserService;
import com.example.arirangtrail.service.Oauth2.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.filter.ForwardedHeaderFilter;

import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final AuthenticationConfiguration authenticationConfiguration;
    private final JwtUtil jwtUtil;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final CustomUserDetailsService customUserDetailsService;
    private final ClientRegistrationRepository clientRegistrationRepository;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception{
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public ForwardedHeaderFilter forwardedHeaderFilter() {
        return new ForwardedHeaderFilter();
    }

    @Bean
    public OAuth2AuthorizationRequestResolver customAuthorizationRequestResolver() {
        return new CustomAuthorizationRequestResolver(clientRegistrationRepository, "/oauth2/authorization");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, OAuth2AuthorizationRequestResolver customAuthorizationRequestResolver) throws Exception {

        JwtLoginFilter jwtLoginFilter = new JwtLoginFilter(authenticationManager(authenticationConfiguration), jwtUtil);
        jwtLoginFilter.setFilterProcessesUrl("/api/login");

        http.csrf(csrf->csrf.disable())
                .formLogin(formLogin->formLogin.disable())
                .httpBasic(httpBasic->httpBasic.disable())

//                .authorizeHttpRequests(authorizeHttpRequests->{
//                    authorizeHttpRequests.anyRequest().permitAll();
//                })
            // 추후 웹소켓 인증 통과를 위한 절차
            .authorizeHttpRequests(authorizeHttpRequests -> {
                authorizeHttpRequests
                        // 모두 접속 및 접근 가능한 페이지
                        .requestMatchers(
                                "/",
                                "/login", "/logout", "/join", "/api/app/login", "/api/app/simplejoin",
                                "/api/reissue",
                                "/favicon.ico"
                        ).permitAll()
                        .requestMatchers("/api/simplejoin").permitAll() // 소셜 로그인 후 간편가입 경로

                        //축제 상태, 리뷰보기
                        .requestMatchers(HttpMethod.GET,
                                "/api/festivals/{contentid}/status",
                                "/api/reviews",
                                "/api/reviews/{reviewId}",
                                "/api/reviews/{reviewId}/comments",
                                "/api/rating/**"

                        ).permitAll()

                        //  인증이 필요한 API (authenticated)
                        .requestMatchers(
                                "/api/festivals/{contentid}/like",
                                "/api/likes/my-list",
                                "/api/files/upload",

                                "/api/reviews/**", // 리뷰 작성(POST), 수정(PUT), 삭제(DELETE)
                                "/api/reviews/{reviewId}/comments/**", // 댓글 작성, 수정, 삭제

                                // --- 마이페이지 관련 ---
                                "/api/userinfo",                  // 내 정보 조회 (GET)
                                "/api/update-inform",             // 내 정보 수정 (PUT)
                                "/api/upload-profile-image",      // 프로필 이미지 업로드 (POST)
                                "/api/compare-password",          // 비밀번호 비교 (POST)
                                "/api/reset-pw",                  // 비밀번호 재설정 (PUT)
                                "/api/delete-member",             // 회원 탈퇴 (DELETE)
                                "/api/reviews/my",                // 내가 쓴 리뷰 목록 (GET)

                                // --- 채팅 관련 ---
                                "/api/chat/**"
                        ).authenticated()

                        // 소셜 로그인 관련 경로
                        .requestMatchers("/oauth2/**").permitAll()

                        // WebSocket 연결 경로
                        .requestMatchers("/ws-stomp/**").permitAll()

                        // 나머지 모든 요청은 인증된 사용자만 접근 가능
                        .anyRequest().authenticated();
            })


                .cors(cors->cors.configurationSource(request -> {
                    CorsConfiguration corsConfiguration = new CorsConfiguration();
                    corsConfiguration.setAllowCredentials(true);
                    corsConfiguration.addAllowedHeader("*"); //클라이언트가 요청을 보낼때 보낼수 있는 헤더
                    corsConfiguration.setExposedHeaders(List.of("Authorization")); //서버가 응답을 보낼때 브라우저가 접근할수 있는 헤더
                    corsConfiguration.addAllowedMethod("*");
                    corsConfiguration.addAllowedOrigin("http://localhost:3000");
                    corsConfiguration.addAllowedOrigin("http://arirangtrail.duckdns.org");
                    corsConfiguration.setAllowCredentials(true);
                    return corsConfiguration;
                }))

                .sessionManagement(session->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .addFilterBefore(new JwtFilter(jwtUtil,customUserDetailsService), JwtLoginFilter.class)

                .addFilterAt(jwtLoginFilter, UsernamePasswordAuthenticationFilter.class)

                .oauth2Login(oauth2->
                        oauth2
                                .authorizationEndpoint(authorization ->
                                        authorization
                                                .authorizationRequestResolver(customAuthorizationRequestResolver())
                                )
                                .userInfoEndpoint(userInfo->{
                                    userInfo.userService(customOAuth2UserService);
                                })
                                .successHandler(oAuth2SuccessHandler)
                )
                .exceptionHandling(exception->{
                    // exception 우선 비워둠
                });
        return http.build();
    }
}