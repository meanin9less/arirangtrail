package com.example.arirangtrail.jwt;

import com.example.arirangtrail.jwt.customuserdetails.CustomUserDetails;
import com.example.arirangtrail.jwt.customuserdetails.CustomUserDetailsService;
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
    // ★★★ 1. CustomUserDetailsService를 주입받습니다. ★★★
    private final CustomUserDetailsService customUserDetailsService;
    private final AntPathMatcher antPathMatcher = new AntPathMatcher();

//    // ★ 4. 토큰 검사를 건너뛸 경로 목록 정의
//    private static final String[] SHOULD_NOT_FILTER_URI_LIST = {
//            "/",
//            "/api/login",
//            "/api/join",
//            "/api/reissue",
//            "/api/chat/**",
//            "/api/chat/rooms/**",
//            "/ws-stomp/**",
//            "/api/files/upload",
//            "/uploads/**" // ★★★ 바로 이 경로가 핵심입니다! ★★★
//            // 추가적으로 인증 없이 접근해야 하는 모든 경로를 여기에 추가합니다.
//    };



    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {


        // ======================= ▼▼▼▼▼ 이 부분 추가 ▼▼▼▼▼ =======================
        // OAuth2 로그인 콜백 요청은 토큰 검사를 건너뜀
        String requestURI = request.getRequestURI();
        if (requestURI.startsWith("/login/oauth2/")) {
            filterChain.doFilter(request, response);
            return;
        }


//        // ★ 5. shouldNotFilter 로직 추가
//        if (Arrays.stream(SHOULD_NOT_FILTER_URI_LIST).anyMatch(uri -> antPathMatcher.match(uri, request.getRequestURI()))) {
//            filterChain.doFilter(request, response);
//            return; // 필터를 그냥 통과시킴
//        }

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
        // 기존 토큰 통과시 만드는 정보가 유저네임만 있고 userdetails의 세부정보를 반영못함,

        String username = jwtUtil.getUserName(token);

        // ★ 1. username으로 CustomUserDetails 객체를 DB에서 조회합니다.
        CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUsername(username);

        // ★ 2. CustomUserDetails를 사용하여 Authentication 객체를 생성합니다.
        Authentication authToken = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities());

        // ★ 3. SecurityContextHolder에 인증 정보를 저장합니다.
        SecurityContextHolder.getContext().setAuthentication(authToken);


        filterChain.doFilter(request, response);
    }
}
