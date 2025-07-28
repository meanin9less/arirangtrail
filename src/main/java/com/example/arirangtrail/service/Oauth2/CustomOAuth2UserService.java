package com.example.arirangtrail.service.Oauth2;

import com.example.arirangtrail.data.dto.user.UserAuthDTO;
import com.example.arirangtrail.data.dto.oauth2.*;
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
        System.out.printf("loadUser !!!!!!!!!!!!!");
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 현재 로그인 진행 중인 서비스를 구분하는 ID (google, naver, kakao...)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // 각 소셜 로그인별로 제공되는 사용자 정보 attributes
        Map<String, Object> attributes = oAuth2User.getAttributes();

        OAuth2Response auth2Response=null;
        if(registrationId.equals("naver")){
            auth2Response=new NaverOAuth2Response(attributes);
        }else if(registrationId.equals("google")){
            auth2Response=new GoogleOAuth2Response(attributes);
        }else if(registrationId.equals("kakao")){
            auth2Response=new KakaoOAuth2Response(attributes);
        }
        else{
            return null;
        }

        String username=auth2Response.getProvider()+"@"+auth2Response.getProviderId();
        System.out.println("유저이름:"+username);

        UserAuthDTO userAuthDTO =new UserAuthDTO();
        userAuthDTO.setUsername(username);
        userAuthDTO.setName(auth2Response.getName());
        userAuthDTO.setEmail(auth2Response.getEmail());
        userAuthDTO.setRole("ROLE_USER");

        // DB 저장 로직 (생략) ...

        // 공통 DTO인 CustomOAuth2User에 파싱한 정보를 담아 반환
        return new CustomOAuth2User(userAuthDTO);
    }
}