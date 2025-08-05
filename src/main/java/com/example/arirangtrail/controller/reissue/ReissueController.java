package com.example.arirangtrail.controller.reissue;

import com.example.arirangtrail.jwt.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api")
public class ReissueController {
    private final JwtUtil jwtUtil;

    @PostMapping(value = "/reissue")
    public ResponseEntity<?> reissue(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        Cookie[] cookies = request.getCookies();

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals("refresh")) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("토큰 null");
        }

        try {
            jwtUtil.isExpired(refreshToken);
        } catch (ExpiredJwtException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("만료된 토큰");
        }

        String category = this.jwtUtil.getCategory(refreshToken);

        if (!category.equals("refresh")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("유효하지 않는 토큰");
        }

        String username = jwtUtil.getUserName(refreshToken);
        String role = jwtUtil.getRole(refreshToken);

        // Access token validity in seconds (1 hour = 3600 seconds)
        long accessTokenValidityInSeconds = 3600L;
        String newAccessToken = this.jwtUtil.createToken("access", username, role, accessTokenValidityInSeconds * 1000L);

        // Add token to response header
        response.addHeader("authorization", "Bearer " + newAccessToken);

        // ✅ FIXED: Return expiresIn in response body as your frontend expects
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("message", "토큰 발급 성공");
        responseData.put("expiresIn", accessTokenValidityInSeconds);

        return ResponseEntity.status(HttpStatus.OK).body(responseData);
    }

    @PostMapping(value = "/oauth2reissue")
    public ResponseEntity<?> oauth2Reissue(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        Cookie[] cookies = request.getCookies();

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals("refresh")) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("토큰 null");
        }

        try {
            jwtUtil.isExpired(refreshToken);
        } catch (ExpiredJwtException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("만료된 토큰");
        }

        String category = this.jwtUtil.getCategory(refreshToken);

        if (!category.equals("refresh")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("유효하지 않는 토큰");
        }

        String username = jwtUtil.getUserName(refreshToken);
        String role = jwtUtil.getRole(refreshToken);

        // Access token validity in seconds (1 hour = 3600 seconds)
        long accessTokenValidityInSeconds = 3600L;
        String newAccessToken = this.jwtUtil.createToken("access", username, role, accessTokenValidityInSeconds * 1000L);

        // Add token to response header
        response.addHeader("Authorization", "Bearer " + newAccessToken);

        // ✅ FIXED: Return expiresIn in response body as your frontend expects
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("message", "토큰 발급 성공");
        responseData.put("expiresIn", accessTokenValidityInSeconds);

        return ResponseEntity.status(HttpStatus.OK).body(responseData);
    }
}