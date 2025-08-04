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
        StompCommand command = accessor.getCommand();

        // 💡 3. 어떤 명령이 들어오는지 로그로 확인
        log.info("STOMP Command: {}", command);

        // 💡 4. 모든 헤더 정보를 로그로 확인 (어떤 헤더가 들어오는지 정확히 보기 위함)
        log.info("STOMP Headers: {}", accessor.getMessageHeaders());

        if (command == StompCommand.CONNECT) {
            try {
                String jwtToken = accessor.getFirstNativeHeader("Authorization");
                log.info("Authorization 헤더에서 추출된 값: {}", jwtToken);

                // 'Bearer ' 접두사를 제거해야 할 수도 있습니다.
                // 아래 removeBearerPrefix 함수를 참고하세요.
                String pureToken = removeBearerPrefix(jwtToken);
                log.info("순수 토큰: {}", pureToken);

                // ✨ validateToken이 false를 반환하면 (유효하지 않으면) 예외를 던집니다.
                if (!jwtUtil.validateToken(pureToken)) {
                    throw new SecurityException("유효하지 않은 토큰입니다.");
                }

                log.info("토큰 검증 성공!");

            } catch (Exception e) {
                log.error("STOMP 연결 중 토큰 검증 실패: {}", e.getMessage());
                throw new SecurityException("토큰 검증에 실패했습니다.");
            }
        }
        return message;
    }

    private String removeBearerPrefix(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return token.substring(7); // "Bearer " 다음부터의 문자열을 반환
        }
        return token;
    }
}