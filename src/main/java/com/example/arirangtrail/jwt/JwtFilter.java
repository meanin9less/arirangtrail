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

    private static final String[] WHITELIST = {
            "/ws-stomp/**",
            "/ws-flutter/**",
    };



    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {


        // ======================= ▼▼▼▼▼ 이 부분 추가 ▼▼▼▼▼ =======================
        // OAuth2 로그인 콜백 요청은 토큰 검사를 건너뜀
        String requestURI = request.getRequestURI();
        if (requestURI.startsWith("/login/oauth2/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // ✨ 3. 현재 요청 경로가 화이트리스트에 있는지 확인
        if (Arrays.stream(WHITELIST).anyMatch(pattern -> antPathMatcher.match(pattern, requestURI))) {
            // 화이트리스트에 있는 경로라면, 토큰 검사 로직을 모두 건너뛰고
            // 즉시 다음 필터로 제어권을 넘깁니다.
            filterChain.doFilter(request, response);
            return; // ✨ 여기서 함수를 종료하는 것이 핵심입니다.
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

        // 2. ★ (가장 중요) CustomUserDetailsService를 사용하여 DB에서 실제 사용자 정보를 조회합니다.
        //    이제 userDetails 객체 안에는 username, password(암호화된), role, nickname 등 모든 정보가 담겨 있습니다.
        CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUsername(username);

        // 3. ★ (중요) DB에서 가져온 "진짜" 사용자 정보(userDetails)를 통째로 사용하여 인증 객체를 만듭니다.
        Authentication authToken = new UsernamePasswordAuthenticationToken(
                username, // <--- 이 부분을 userDetails에서 username으로 변경!
                null,
                userDetails.getAuthorities());

        // 4. 이 "진짜" 정보가 담긴 인증 객체를 SecurityContext에 저장합니다.
        SecurityContextHolder.getContext().setAuthentication(authToken);
        filterChain.doFilter(request, response);
    }
}
