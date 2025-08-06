package com.example.arirangtrail.controller.user;

import com.example.arirangtrail.data.dto.token.TokenDTO;
import com.example.arirangtrail.data.dto.user.JoinDTO;
import com.example.arirangtrail.data.dto.user.UserDTO;
import com.example.arirangtrail.data.entity.UserEntity; // UserEntity 임포트 추가 (updateInform 때문)
import com.example.arirangtrail.jwt.JwtUtil;
import com.example.arirangtrail.service.user.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType; // MediaType 임포트 추가
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api")
public class UserController {
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final RedisTemplate<String, String> redisTemplate;

    @PostMapping(value = "/join")
    public ResponseEntity<String> join(@RequestBody JoinDTO joinDTO) {
        String result = userService.join(joinDTO);
        if(result.equals("joined")){
            return ResponseEntity.ok("joined");
        }else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping(value = "/refreshout")
    public ResponseEntity<String> refreshout(HttpServletRequest request, HttpServletResponse response) {
        Cookie cookie = new Cookie("refresh", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
        return ResponseEntity.status(HttpStatus.OK).body("refresh token deleted");
    }

    @PutMapping(value = "/reset-pw")
    public ResponseEntity<String> resetPw(@RequestParam String username, @RequestParam String password) {
        this.userService.resetPassword(username, password);
        return ResponseEntity.ok("reset password success");
    }

    @PutMapping(value = "/update-inform")
    public ResponseEntity<UserDTO> updateInform(@RequestBody UserDTO userDTO, HttpServletRequest request) {
        String token = request.getHeader("authorization");
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
        String accessToken = token.substring(7);
        String usernameFromToken = jwtUtil.getUserName(accessToken);

        if (!usernameFromToken.equals(userDTO.getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        try {
            // UserService.updateInform이 UserDTO를 반환하도록 되어 있으므로, 그대로 사용
            UserDTO updatedUserDTO = this.userService.updateInform(userDTO);
            return ResponseEntity.status(HttpStatus.OK).body(updatedUserDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping(value = "/compare-password")
    public ResponseEntity<Boolean> comaparePassword(@RequestParam String username, @RequestParam String password) {
        return ResponseEntity.status(HttpStatus.OK).body(this.userService.comaparePassword(username,password));
    }

    @GetMapping(value = "/user-inform")
    public ResponseEntity<UserDTO> userInform(HttpServletRequest request) {
        String token = request.getHeader("authorization");
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
        String accessToken = token.substring(7);
        String username = this.jwtUtil.getUserName(accessToken);
        UserDTO userDTO = this.userService.userInform(username);
        return ResponseEntity.status(HttpStatus.OK).body(userDTO);
    }

    @DeleteMapping(value = "/delete-member")
    public ResponseEntity<String> deleteMember(HttpServletRequest request) {
        String token = request.getHeader("authorization");
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        String accessToken = token.substring(7);
        String username = this.jwtUtil.getUserName(accessToken);
        return ResponseEntity.ok(this.userService.deleteMember(username));
    }

    @PostMapping(value = "/simplejoin")
    public ResponseEntity<UserDTO> simpleJoin(@RequestBody JoinDTO joinDTO) {
        // UserService.simpleJoin이 UserDTO를 반환하도록 되어 있으므로, 그대로 사용
        UserDTO userDTO = this.userService.simpleJoin(joinDTO);
        String refresh_Token = this.jwtUtil.createToken("refresh", userDTO.getUsername(), userDTO.getRole(), 300 * 1000L);
        String access_Token = this.jwtUtil.createToken("access", userDTO.getUsername(), userDTO.getRole(), 60 * 1000L);
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refresh", refresh_Token)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(24 * 60 * 60)
                .sameSite("Lax")
                .build();
        return ResponseEntity.status(HttpStatus.OK)
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .header("authorization", "Bearer " + access_Token)
                .body(userDTO);
    }

    @GetMapping(value = "/userinfo")
    public ResponseEntity<UserDTO> userInfo(HttpServletRequest request) {
        String token = request.getHeader("authorization");
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
        String access_token = token.substring(7);
        String username = this.jwtUtil.getUserName(access_token);
        UserDTO userDTO = this.userService.userInform(username);
        return ResponseEntity.status(HttpStatus.OK).body(userDTO);
    }

    // ✨ 프로필 이미지 업로드 엔드포인트 (최종 수정: consumes 추가, 중복 호출 제거)
    @PostMapping(value = "/upload-profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE) // ✨ consumes 추가
    public ResponseEntity<String> uploadProfileImage(
            @RequestParam("image") MultipartFile imageFile,
            HttpServletRequest request) {
        try {
            String accessToken = request.getHeader("authorization").substring(7);
            String username = this.jwtUtil.getUserName(accessToken);

            String imageUrl = this.userService.uploadProfileImage(username, imageFile); // 한 번만 호출
            return ResponseEntity.ok(imageUrl); // 업로드된 이미지 URL 반환
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("파일 업로드 중 오류가 발생했습니다: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("예상치 못한 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @PostMapping("/app/login")
    public ResponseEntity<?> oauth2Login(@RequestBody Map<String, String> payload) {
        String authorizationCode = payload.get("code");

        if (authorizationCode == null) {
            return ResponseEntity.badRequest().body("Authorization code is missing.");
        }

        String redisKey = "oauth-code:" + authorizationCode;
        String email = redisTemplate.opsForValue().get(redisKey);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired authorization code.");
        }
        redisTemplate.delete(redisKey);

        UserDTO user = this.userService.findByEmail(email);

        String access = jwtUtil.createToken("access", user.getUsername(), user.getRole(), 60 * 10 * 1000L);
        String refresh = jwtUtil.createToken("refresh", user.getUsername(), user.getRole(), 24 * 60 * 60 * 1000L);

        Map<String, String> result = new HashMap<>();
        result.put("access", "Bearer " + access);
        result.put("refresh", refresh);
        result.put("username", user.getUsername());
        result.put("email", user.getEmail());
        result.put("firstname",  user.getFirstname());
        result.put("lastname",  user.getLastname());
        result.put("nickname",  user.getNickname());
        result.put("birthdate", user.getBirthdate().toString());
        result.put("imageUrl", user.getImageurl());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/app/simplejoin")
    public ResponseEntity<UserDTO> appSimpleJoin(){

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
    }
}
