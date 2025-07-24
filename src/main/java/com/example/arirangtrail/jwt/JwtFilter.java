package com.example.arirangtrail.jwt;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final AntPathMatcher antPathMatcher = new AntPathMatcher();

    // ★ 4. 토큰 검사를 건너뛸 경로 목록 정의
    private static final String[] SHOULD_NOT_FILTER_URI_LIST = {
            "/",
            "/api/login",
            "/api/join",
            "/api/reissue",
            "/api/chat/**",
            "/api/chat/rooms/**",
            "/ws-stomp/**",
            "/api/files/upload",
            "/uploads/**" // ★★★ 바로 이 경로가 핵심입니다! ★★★
            // 추가적으로 인증 없이 접근해야 하는 모든 경로를 여기에 추가합니다.
    };



    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        // ======================= ▼▼▼▼▼ 이 부분 추가 ▼▼▼▼▼ =======================
        // OAuth2 로그인 콜백 요청은 토큰 검사를 건너뜀
        String requestURI = request.getRequestURI();
        if (requestURI.startsWith("/api/login/oauth2/") || requestURI.startsWith("/login/oauth2/")) {
            filterChain.doFilter(request, response);
            return;
        }


        // ★ 5. shouldNotFilter 로직 추가
        if (Arrays.stream(SHOULD_NOT_FILTER_URI_LIST).anyMatch(uri -> antPathMatcher.match(uri, request.getRequestURI()))) {
            filterChain.doFilter(request, response);
            return; // 필터를 그냥 통과시킴
        }

        String token = request.getHeader("Authorization");
        if (token == null || !token.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        token = token.split(" ")[1];

        try{
            this.jwtUtil.isExpired(token);
        }catch(ExpiredJwtException e){
            response.getWriter().write("access token expired");
            response.setStatus(456); // 커스텀 상태 코드
            response.setCharacterEncoding("UTF-8");
            return;
        }

        String category = this.jwtUtil.getCategory(token);
        if(!category.equals("access")){
            response.getWriter().write("invalid access token");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setCharacterEncoding("UTF-8");
            return;
        }

        String username = this.jwtUtil.getUserName(token);
        String role = this.jwtUtil.getRole(token);

        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(role));

        User user = new User(username, "", authorities);
        Authentication auth = new UsernamePasswordAuthenticationToken(user, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);
        filterChain.doFilter(request, response);
    }
}
