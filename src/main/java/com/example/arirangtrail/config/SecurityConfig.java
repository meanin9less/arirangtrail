package com.example.arirangtrail.config;

import com.example.arirangtrail.jwt.JwtFilter;
import com.example.arirangtrail.jwt.JwtLoginFilter;
import com.example.arirangtrail.jwt.JwtUtil;
import com.example.arirangtrail.service.Oauth2.CustomOAuth2UserService;
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
import org.springframework.security.oauth2.client.endpoint.DefaultAuthorizationCodeTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AccessTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequestEntityConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
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
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // --- ✨✨✨ 핵심 수정 부분 시작 ✨✨✨ ---

        // 1. JwtLoginFilter 인스턴스를 먼저 생성합니다.
        JwtLoginFilter jwtLoginFilter = new JwtLoginFilter(authenticationManager(authenticationConfiguration), jwtUtil);

        // 2. 이 필터가 어떤 URL을 처리할지 명시적으로 지정해줍니다.
        //    이렇게 해야 기본값인 '/login' 대신 '/api/login'을 감시합니다.
        jwtLoginFilter.setFilterProcessesUrl("/api/login");

        // --- ✨✨✨ 핵심 수정 부분 끝 ✨✨✨ ---


        http.csrf(csrf->csrf.disable())
                .formLogin(formLogin->formLogin.disable())
                .httpBasic(httpBasic->httpBasic.disable())

                .authorizeHttpRequests(auth -> auth
                        // ★ 2. 정적 리소스에 대한 요청은 모두 허용합니다.
                        //    CSS, JS, 이미지 파일 등에 대한 보안 검사를 아예 수행하지 않습니다.
                        .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()

                        // ★ 3. 우리가 직접 업로드한 이미지 파일 경로도 명시적으로 모두 허용합니다.
                        .requestMatchers("/**").permitAll()
                )

                .cors(cors->cors.configurationSource(request -> {
                    CorsConfiguration corsConfiguration = new CorsConfiguration();
                    corsConfiguration.setAllowCredentials(true);
                    corsConfiguration.addAllowedHeader("*"); //클라이언트가 요청을 보낼때 보낼수 있는 헤더
                    corsConfiguration.setExposedHeaders(List.of("Authorization")); //서버가 응답을 보낼때 브라우저가 접근할수 있는 헤더
                    corsConfiguration.addAllowedMethod("*");
                    corsConfiguration.addAllowedOrigin("http://localhost:3000");
                    corsConfiguration.addAllowedOrigin("http://arirangtrail.duckdns.org");
                    return corsConfiguration;
                }))

                .sessionManagement(session->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .addFilterBefore(new JwtFilter(jwtUtil), JwtLoginFilter.class)

//                .addFilterAt(new JwtLoginFilter(authenticationManager(authenticationConfiguration), jwtUtil), UsernamePasswordAuthenticationFilter.class)
                // ✨✨✨ 여기가 핵심 수정 포인트! ✨✨✨
                // 새로 만들지 말고, 위에서 설정한 'jwtLoginFilter' 변수를 사용합니다.
                .addFilterAt(jwtLoginFilter, UsernamePasswordAuthenticationFilter.class)

                .oauth2Login(oauth2->
                        oauth2
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
