package com.example.arirangtrail.data.dto.token;

import com.example.arirangtrail.jwt.JwtUtil;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
public class TokenDTO {
    private JwtUtil jwtUtil;

    private String refreshToken;
    private String jwtToken;


    public TokenDTO(String username, String role) {
        this.jwtToken = this.jwtUtil.createToken("access", username, role, 300 * 1000L);
        this.refreshToken = this.jwtUtil.createToken("refresh", username, role, 60 * 60 * 24 * 1000L);
    }
}
