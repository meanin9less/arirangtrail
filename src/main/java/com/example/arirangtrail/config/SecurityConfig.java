// SecurityConfig.java (최종 수정 완료)

package com.example.arirangtrail.config;

import com.example.arirangtrail.jwt.JwtFilter;
import com.example.arirangtrail.jwt.JwtLoginFilter;
import com.example.arirangtrail.jwt.JwtUtil;
import com.example.arirangtrail.jwt.customuserdetails.CustomUserDetailsService;
import com.example.arirangtrail.service.Oauth2.CustomOAuth2UserService;
import com.example.arirangtrail.service.Oauth2.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

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

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        JwtLoginFilter jwtLoginFilter = new JwtLoginFilter(authenticationManager(authenticationConfiguration), jwtUtil);
        jwtLoginFilter.setFilterProcessesUrl("/api/login");

        http
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(authorizeHttpRequests -> {
                authorizeHttpRequests
                        // 모두 접속 및 접근 가능한 페이지
                        .requestMatchers(
                                "/",
                                "/login", "/logout", "/join", "/api/app/login", "/api/app/simplejoin", "/api/join",
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
                                "/api/reviews/rating/**");})

                // 2. CORS 설정 (별도 Bean 사용)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 3. 세션 관리 (STATELESS)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. 경로별 인가 설정
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/", "/login", "/join", "/api/reissue", "/api/app/**", "/oauth2/**",
                                "/ws-stomp/**", "/ws-flutter/**", "/favicon.ico", "/error"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/festivals/**",
                                "/api/reviews/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )

                // 5. OAuth2 로그인 설정
                .oauth2Login(oauth2 ->
                        oauth2
                                // CustomAuthorizationRequestResolver는 현재 코드에 없으므로 일단 제거, 필요 시 추가
                                // .authorizationEndpoint(authorization ->
                                //         authorization.authorizationRequestResolver(...)
                                // )
                                .userInfoEndpoint(userInfo ->
                                        userInfo.userService(customOAuth2UserService)
                                )
                                .successHandler(oAuth2SuccessHandler)
                )

                // 6. ✨ JwtFilter를 UsernamePasswordAuthenticationFilter 앞에 한 번만 추가
                .addFilterBefore(new JwtFilter(jwtUtil, customUserDetailsService), UsernamePasswordAuthenticationFilter.class)

                // 7. JwtLoginFilter를 UsernamePasswordAuthenticationFilter 위치에 추가
                .addFilterAt(jwtLoginFilter, UsernamePasswordAuthenticationFilter.class);

        // ✨ 중복되므로 이 부분은 삭제되었습니다.

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ✨ 개발 중에는 모든 출처를 허용하는 것이 가장 간단하고 확실합니다.
        configuration.setAllowedOriginPatterns(List.of("*"));

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}