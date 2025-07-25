package com.example.arirangtrail.controller.user;

import com.example.arirangtrail.data.dto.token.TokenDTO;
import com.example.arirangtrail.data.dto.user.JoinDTO;
import com.example.arirangtrail.data.dto.user.UserDTO;
import com.example.arirangtrail.jwt.JwtUtil;
import com.example.arirangtrail.service.user.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api")
public class UserController {
    private final JwtUtil jwtUtil;
    private final UserService userService;

    @PostMapping(value = "/join")
    public ResponseEntity<String> join(@RequestBody JoinDTO joinDTO) {
        String result = userService.join(joinDTO);
        if(result.equals("joined")){
            return ResponseEntity.ok("joined");
        }else {
            return ResponseEntity.badRequest().build();
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

//    @GetMapping(value = "/re-confirm-id")
//    public ResponseEntity<String> reConfirmId(@RequestParam String email, String code) {
//        return ResponseEntity.status(HttpStatus.OK).body(this.userService.findUserByEamil(email, code));
//    }
//
//    @GetMapping(value = "/re-confirm-pw")
//    public ResponseEntity<String> reConfirmPw(@RequestParam String username, String email, String code) {
//        if(this.userService.findByUsernameAndEmail(username, email, code)){
//            return ResponseEntity.status(HttpStatus.OK).body("authorizied user");
//        }
//        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("unauthorized");
//    }
//
    @PutMapping(value = "/reset-pw")
    public ResponseEntity<String> resetPw(@RequestParam String username, String password) {
        this.userService.resetPassword(username, password);
        return ResponseEntity.ok("reset password success");
    }

    @PutMapping(value = "/update-inform")
    public ResponseEntity<UserDTO> updateInform(@RequestBody UserDTO userDTO) {
        this.userService.updateInform(userDTO);
        return ResponseEntity.status(HttpStatus.OK).body(userDTO);
    }

    @PostMapping(value = "/comapre-password")// 비밀번호 재확인시 일치/불일치를 boolean으로 전달
    public ResponseEntity<Boolean> comaparePassword(@RequestParam String username, String password) {//username, password 필요
        return ResponseEntity.status(HttpStatus.OK).body(this.userService.comaparePassword(username,password));
    }

    @GetMapping(value = "/user-inform")
    public ResponseEntity<UserDTO> userInform(@RequestParam String username) {
        UserDTO userDTO = this.userService.userInform(username);
        return ResponseEntity.status(HttpStatus.OK).body(userDTO);
    }

    @DeleteMapping(value = "/delete-member")
    public ResponseEntity<String> deleteMember(@RequestParam String username) {
        return ResponseEntity.ok(this.userService.deleteMember(username));
    }

    @PostMapping(value = "/simplejoin") // oauth2 간편가입
    public ResponseEntity<UserDTO> simpleJoin(@RequestBody JoinDTO joinDTO) {
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

    @GetMapping(value = "/userinfo") // oauth2 로그인 한 유저 유저 인포 받는 컨트롤러
    public ResponseEntity<UserDTO> userInfo(HttpServletRequest request) {
        String token = request.getHeader("authorization");
        String access_token = token.substring(7);
        String username = this.jwtUtil.getUserName(access_token);
        UserDTO userDTO = this.userService.userInform(username);
        return ResponseEntity.status(HttpStatus.OK).body(userDTO);
    }
}
