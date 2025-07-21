package com.example.arirangtrail.data.dto.Ouath2;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

@Getter
@RequiredArgsConstructor
public class CustomOAuth2User implements OAuth2User {

    // 우리 서비스에서 사용할 표준화된 사용자 정보
    private final String name;
    private final String email;
    private final String role;

    // OAuth2User 인터페이스의 메소드 구현
    @Override
    public Map<String, Object> getAttributes() {
        // 이 메소드는 소셜 로그인 제공자로부터 받은 원본 데이터를 반환합니다.
        // 현재 우리 로직에서는 직접 사용하지 않으므로 null을 반환해도 무방합니다.
        // 만약 원본 데이터가 필요하다면, 생성자에서 받아와 필드에 저장 후 반환하면 됩니다.
        return null;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 사용자의 권한을 반환하는 메소드
        Collection<GrantedAuthority> collection = new ArrayList<>();
        collection.add(new GrantedAuthority() {
            @Override
            public String getAuthority() {
                return role; // 생성자에서 받은 role(권한)을 반환
            }
        });
        return collection;
    }

    @Override
    public String getName() {
        // 이 사용자를 식별할 수 있는 고유한 값을 반환해야 합니다.
        // 여기서는 이메일을 고유 식별자로 사용하겠습니다.
        // JWT의 subject로 사용될 수 있습니다.
        return email;
    }
}