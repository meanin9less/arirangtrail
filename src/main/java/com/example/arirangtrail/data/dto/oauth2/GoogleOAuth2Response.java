package com.example.arirangtrail.data.dto.oauth2;

import java.util.Map;

public class GoogleOAuth2Response implements OAuth2Response {
    private final Map<String, Object> attributes;

    public GoogleOAuth2Response(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getProvider() {
        return "google";
    }

    @Override
    public String getProviderId() {
        return attributes.get("sub").toString();
    }

    @Override
    public String getEmail() {
        return attributes.get("email").toString();
    }

    @Override
    public String getName() {
        return attributes.get("name").toString();
    }
}
