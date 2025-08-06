package com.example.arirangtrail.service.Oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

@Component
public class HttpSessionOAuth2AuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {
    public static final String AUTHORIZATION_REQUEST_ATTR_NAME = "oauth2_auth_request";

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return this.getFromSession(request);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest, HttpServletRequest request, HttpServletResponse response) {
        if (authorizationRequest == null) {
            this.removeFromSession(request);
            return;
        }
        this.saveToSession(request, authorizationRequest);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request, HttpServletResponse response) {
        return this.removeFromSession(request);
    }

    private OAuth2AuthorizationRequest getFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        return (OAuth2AuthorizationRequest) session.getAttribute(AUTHORIZATION_REQUEST_ATTR_NAME);
    }

    private void saveToSession(HttpServletRequest request, OAuth2AuthorizationRequest authorizationRequest) {
        HttpSession session = request.getSession();
        session.setAttribute(AUTHORIZATION_REQUEST_ATTR_NAME, authorizationRequest);
    }

    private OAuth2AuthorizationRequest removeFromSession(HttpServletRequest request) {
        OAuth2AuthorizationRequest savedRequest = this.getFromSession(request);
        if (savedRequest != null) {
            request.getSession().removeAttribute(AUTHORIZATION_REQUEST_ATTR_NAME);
        }
        return savedRequest;
    }
}