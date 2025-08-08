// StompHandler.java

package com.example.arirangtrail.config.websocketHandler;

import com.example.arirangtrail.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompHandler implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    // UserDetailsService가 필요할 수 있습니다. (JwtFilter와 유사하게)
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // StompHeaderAccessor를 사용하여 STOMP 프레임의 헤더에 접근합니다.
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // STOMP CONNECT 명령일 때만 인증을 처리합니다.
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.info("STOMP CONNECT 요청 수신");

            // ✨✨✨ 가장 중요한 부분: 토큰 추출 방식 수정 ✨✨✨
            // stompConnectHeaders로 보낸 값은 nativeHeaders에 Map 형태로 들어옵니다.
            // "Authorization" 헤더의 첫 번째 값을 가져옵니다.
            String jwt = accessor.getFirstNativeHeader("Authorization");
            log.info("Authorization 헤더에서 추출한 값: {}", jwt);

            // 토큰 유효성 검사 (JwtFilter와 유사한 로직)
            if (jwt != null && jwt.startsWith("Bearer ")) {
                String token = jwt.substring(7); // "Bearer " 접두사 제거

                try {
                    if (!jwtUtil.isExpired(token)) {
                        // 토큰이 유효하면, Spring Security 컨텍스트에 인증 정보 설정
                        String username = jwtUtil.getUserName(token);
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());

                        // SecurityContext에 인증 정보 저장
                        SecurityContextHolder.getContext().setAuthentication(authentication);

                        log.info("STOMP 인증 성공, 사용자: {}", username);
                    } else {
                        log.warn("만료된 JWT 토큰입니다.");
                        // 만료된 토큰에 대한 처리를 여기에 추가할 수 있습니다.
                        // 예를 들어, AccessDeniedException을 던져 연결을 거부합니다.
                        throw new AccessDeniedException("Expired JWT token");
                    }
                } catch (Exception e) {
                    log.error("JWT 토큰 검증 중 오류 발생: {}", e.getMessage());
                    // 잘못된 토큰에 대한 처리를 여기에 추가합니다.
                    throw new AccessDeniedException("Invalid JWT token");
                }

            } else {
                log.warn("Authorization 헤더가 없거나 형식이 잘못되었습니다.");
                // 토큰이 없는 요청에 대한 처리를 여기에 추가합니다.
                throw new AccessDeniedException("Authorization header is missing or invalid");
            }
        }
        // CONNECT가 아닌 다른 명령(SUBSCRIBE, SEND 등)은 그냥 통과시킵니다.
        return message;
    }
}