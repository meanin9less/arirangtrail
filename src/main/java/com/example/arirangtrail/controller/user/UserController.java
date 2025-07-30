package com.example.arirangtrail.controller.user;

import com.example.arirangtrail.data.dto.token.TokenDTO;
import com.example.arirangtrail.data.dto.user.JoinDTO;
import com.example.arirangtrail.data.dto.user.UserDTO;
import com.example.arirangtrail.jwt.JwtUtil;
import com.example.arirangtrail.service.user.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.persistence.EntityNotFoundException; // 임포트 추가
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // MultipartFile 임포트

import java.io.IOException; // IOException 임포트

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api")
public class UserController {
    private final JwtUtil jwtUtil;
    private final UserService userService;

    // --- 기존 컨트롤러 코드들은 변경 없이 그대로 유지합니다. ---
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
        // JWT 토큰에서 username 추출하여, 요청된 정보가 현재 로그인한 사용자의 것인지 검증
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
    public ResponseEntity<UserDTO> userInform(HttpServletRequest request) { // @RequestParam 대신 토큰에서 username 추출
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
    public ResponseEntity<String> deleteMember(HttpServletRequest request) { // @RequestParam 대신 토큰에서 username 추출
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
        UserDTO userDTO = this.userService.simpleJoin(joinDTO);
        String refresh_Token = this.jwtUtil.createToken("refresh", userDTO.getUsername(), userDTO.getRole(), 300 * 1000L);
        String access_Token = this.jwtUtil.createToken("access", userDTO.getUsername(), userDTO.getRole(), 60 * 1000L);
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refresh", refresh_Token)
                .httpOnly(true)
                .secure(false) // HTTPS 환경에서는 true로 변경
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

    @PostMapping(value = "/upload-profile-image")
    public ResponseEntity<String> uploadProfileImage(
            @RequestParam("image") MultipartFile imageFile,
            HttpServletRequest request) {
        try {
            // JWT 토큰에서 username 추출 (로그인된 사용자의 프로필에만 업로드)
            String token = request.getHeader("authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized: No token provided or invalid format.");
            }
            String accessToken = token.substring(7); // "Bearer " 제거
            String username = jwtUtil.getUserName(accessToken); // JWT에서 username 추출

            if (imageFile.isEmpty()) {
                return ResponseEntity.badRequest().body("No image file provided.");
            }

            // UserService의 이미지 업로드 로직 호출
            String imageUrl = userService.uploadProfileImage(username, imageFile);
            return ResponseEntity.ok("Profile image uploaded successfully. URL: " + imageUrl);

        } catch (EntityNotFoundException e) {
            // 사용자 ID를 찾을 수 없을 때
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IOException e) {
            // 파일 저장 중 I/O 오류 발생 시
            e.printStackTrace(); // 서버 로그에 스택 트레이스 출력
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload image due to server error: " + e.getMessage());
        } catch (Exception e) {
            // 그 외 예상치 못한 오류 발생 시
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred during image upload: " + e.getMessage());
        }
    }

    @DeleteMapping(value = "/remove-profile-image")
    public ResponseEntity<String> removeProfileImage(HttpServletRequest request) {
        try {
            // JWT 토큰에서 username 추출
            String token = request.getHeader("authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized: No token provided or invalid format.");
            }
            String accessToken = token.substring(7);
            String username = jwtUtil.getUserName(accessToken);

            // UserService의 이미지 제거 로직 호출
            userService.removeProfileImage(username);
            return ResponseEntity.ok("Profile image removed successfully.");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to remove image due to server error: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred during image removal: " + e.getMessage());
        }
    }
}