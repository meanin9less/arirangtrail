package com.example.arirangtrail.data.dto.oauth2;

import com.example.arirangtrail.data.dto.user.UserAuthDTO;
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

    private final UserAuthDTO userAuthDTO;

    @Override
    public Map<String, Object> getAttributes() {
        return null;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new GrantedAuthority() {
            @Override
            public String getAuthority() {
                return userAuthDTO.getRole();
            }
        });
        return authorities;
    }

    @Override
    public String getName() {
        return this.userAuthDTO.getName();
    }

    public String getUserName(){
        return this.userAuthDTO.getUsername();
    }

    public String getRole() {
        return this.userAuthDTO.getRole();
    }

    public String getEmail() {
        return this.userAuthDTO.getEmail();
    }
}