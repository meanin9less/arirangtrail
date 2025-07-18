package com.example.arirangtrail.service.Oauth2;

import com.example.arirangtrail.data.dto.Ouath2.CustomOAuth2User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 현재 로그인 진행 중인 서비스를 구분하는 ID (google, naver, kakao...)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // 각 소셜 로그인별로 제공되는 사용자 정보 attributes
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = "";
        String name = "";

        // 제공자(provider)에 따라 attributes 파싱 방식이 달라짐
        if ("naver".equals(registrationId)) {
            Map<String, Object> response = (Map<String, Object>) attributes.get("response");
            email = (String) response.get("email");
            name = (String) response.get("name");
        } else if ("google".equals(registrationId)) {
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
        } else if ("kakao".equals(registrationId)) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> kakaoProfile = (Map<String, Object>) kakaoAccount.get("profile");
            email = (String) kakaoAccount.get("email");
            name = (String) kakaoProfile.get("nickname");
        }

        String role = "ROLE_USER"; // 공통 권한 부여

        // DB 저장 로직 (생략) ...

        // 공통 DTO인 CustomOAuth2User에 파싱한 정보를 담아 반환
        return new CustomOAuth2User(name, email, role);
    }
}