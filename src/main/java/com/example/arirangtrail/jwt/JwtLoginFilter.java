package com.example.arirangtrail.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class JwtLoginFilter extends UsernamePasswordAuthenticationFilter {
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public JwtLoginFilter(AuthenticationManager authenticationManager, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.setFilterProcessesUrl("/api/login"); // 원하는 경로로 설정
    }


    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
//        setFilterProcessesUrl("/admin-login");
        String username = obtainUsername(request);
        String password = obtainPassword(request);
        //클라이언트 요청에서 username, password 추출

        UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(username, password, null);
        //스프링 시큐리티에서 username과 password를 검증하기 위해서는 token에 담아야 함
        return authenticationManager.authenticate(authRequest);
    }

    @Override
    public void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authResult) throws IOException, ServletException {
        UserDetails userDetails = (UserDetails) authResult.getPrincipal();

        String username = userDetails.getUsername();
        Collection<? extends GrantedAuthority> grantedAuthorities = userDetails.getAuthorities();
        Iterator<? extends GrantedAuthority> iterator = grantedAuthorities.iterator();
        GrantedAuthority grantedAuthority = iterator.next();
        String role = grantedAuthority.getAuthority();

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("role", role);

        ObjectMapper mapper = new ObjectMapper();
        String jsonMessage = mapper.writeValueAsString(responseData);

        String access_token = this.jwtUtil.createToken("access", username, role, 5 * 1000L);
        String refresh_token = this.jwtUtil.createToken("refresh", username, role, 60 * 60 * 24 * 1000L);
        response.addHeader("Authorization", "Bearer " + access_token);
        response.addCookie(this.createCookie("refresh", refresh_token));
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(jsonMessage);
    }

    @Override
    public void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response, AuthenticationException failed) throws IOException {
        Map<String, Object> responseData = new HashMap<>();
        // ✨ 변경된 부분: failed.getMessage()를 사용하여 구체적인 오류 메시지 전달
        responseData.put("error", "로그인 실패: " + failed.getMessage());

        ObjectMapper objectMapper = new ObjectMapper();
        String jsonmessage = objectMapper.writeValueAsString(responseData);

        response.setStatus(401); // HTTP 401 Unauthorized
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(jsonmessage);
    }

    private Cookie createCookie(String key, String value) {
        Cookie cookie = new Cookie(key, value);
        cookie.setPath("/"); //// 루트 경로부터 시작되는 모든 요청에 대해 쿠키가 포함되도록 설정
        cookie.setHttpOnly(true);
        cookie.setMaxAge(60 * 60 * 24);
        return cookie;
    }
}
