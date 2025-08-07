package com.example.arirangtrail.config;

import com.example.arirangtrail.config.websocketHandler.StompHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final StompHandler stompHandler;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 클라이언트가 웹소켓 연결을 시작할 엔드포인트를 지정합니다.
        registry.addEndpoint("/ws-stomp").setAllowedOriginPatterns("*")
//                .setAllowedOriginPatterns("http://arirangtrail.com")
                .withSockJS();
        registry.addEndpoint("/ws-flutter") // 👈 플러터용 경로
                .setAllowedOriginPatterns("*");

    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 메시지 브로커가 /sub 프리픽스를 가진 목적지의 클라이언트에게 메시지를 전달하도록 설정합니다.
        registry.enableSimpleBroker("/sub"); // api 호출이 아니라 듣는 대상자 지정의 영향이라 api 안 붙임.
        // 클라이언트에서 서버로 메시지를 보낼 때 사용할 프리픽스를 지정합니다.
        registry.setApplicationDestinationPrefixes("/api/pub"); // 직접 api 호출하여 메세지 보내는 흐름이라 기본 url 추가.
    }

    //인터셉트 등록
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompHandler);
    }
}