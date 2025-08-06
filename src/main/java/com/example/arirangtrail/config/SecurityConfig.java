package com.example.arirangtrail.config;

import com.example.arirangtrail.config.oauth2.CustomAuthorizationRequestResolver;
import com.example.arirangtrail.jwt.JwtFilter;
import com.example.arirangtrail.jwt.JwtLoginFilter;
import com.example.arirangtrail.jwt.JwtUtil;
import com.example.arirangtrail.jwt.customuserdetails.CustomUserDetailsService;
import com.example.arirangtrail.service.Oauth2.CustomOAuth2UserService;
import com.example.arirangtrail.service.Oauth2.HttpSessionOAuth2AuthorizationRequestRepository;
import com.example.arirangtrail.service.Oauth2.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.RequestEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.filter.ForwardedHeaderFilter;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;


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
private final HttpSessionOAuth2AuthorizationRequestRepository httpSessionOAuth2AuthorizationRequestRepository;
private final AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository;

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
public AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository() {
    return new HttpSessionOAuth2AuthorizationRequestRepository();
}

@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

    JwtLoginFilter jwtLoginFilter = new JwtLoginFilter(authenticationManager(authenticationConfiguration), jwtUtil);
    jwtLoginFilter.setFilterProcessesUrl("/api/login");

    http.csrf(csrf->csrf.disable())
            .formLogin(formLogin->formLogin.disable())
            .httpBasic(httpBasic->httpBasic.disable())

                .authorizeHttpRequests(authorizeHttpRequests->{
                    authorizeHttpRequests.anyRequest().permitAll();
                })
//            // 추후 웹소켓 인증 통과를 위한 절차
//            .authorizeHttpRequests(authorizeHttpRequests -> {
//                authorizeHttpRequests
//                        // ★★★ 웹소켓 연결 경로는 인증 없이 허용해야 합니다. ★★★
//                        .requestMatchers("/ws-stomp/**").permitAll()
//                        .requestMatchers("/api/login", "/api/join", "/api/reissue", "/login/oauth2/**").permitAll()
//                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
//                        .anyRequest().authenticated();
//            })


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

            .oauth2Login(oauth2 -> oauth2
                    // A. 인증 요청을 가로채서 커스터마이징하는 부분
                    .authorizationEndpoint(authorizationEndpointConfig ->
                            authorizationEndpointConfig
                                    .authorizationRequestRepository(httpSessionOAuth2AuthorizationRequestRepository))
                    // B. 인증 성공 후 사용자 정보를 가져오는 부분
                    .userInfoEndpoint(userInfo -> userInfo
                            .userService(customOAuth2UserService)
                    )
                    // C. 모든 과정 성공 후 리디렉션을 처리하는 부분
                    .successHandler(oAuth2SuccessHandler)
            )

            // --- 권한 설정 (일단 모든 요청 허용으로 유지) ---
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

    return http.build();
    }
}
