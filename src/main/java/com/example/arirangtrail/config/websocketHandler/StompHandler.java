package com.example.arirangtrail.config.websocketHandler;

import com.example.arirangtrail.jwt.JwtUtil;
import com.example.arirangtrail.jwt.customuserdetails.CustomUserDetails;
import com.example.arirangtrail.jwt.customuserdetails.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
// 이 클래스는 인터셉트를 통해 웹소켓의 헤더에 담긴 authorization 토큰을 검증하는 역할을 수행한다.
public class StompHandler implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // STOMP 클라이언트가 연결을 시도할 때(CONNECT) 토큰을 검증합니다.
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // 헤더에서 'Authorization' 토큰을 가져옵니다.
            String jwtToken = accessor.getFirstNativeHeader("Authorization");
            log.info("STOMP-CONNECT, token: {}", jwtToken);

            if (jwtToken != null && jwtToken.startsWith("Bearer ")) {
                String token = jwtToken.substring(7);

                // 토큰 유효성 검사 (JwtFilter 로직과 유사하게)
                if (!jwtUtil.isExpired(token) && "access".equals(jwtUtil.getCategory(token))) {
                    String username = jwtUtil.getUserName(token);

                    // 유저 정보로 CustomUserDetails 생성
                    CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUsername(username);

                    // 인증 객체 생성
                    Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                    // SecurityContext에 저장하지 않고, STOMP 세션에 직접 사용자를 설정합니다.
                    accessor.setUser(authentication);
                }
            }
        }
        return message;
    }
}