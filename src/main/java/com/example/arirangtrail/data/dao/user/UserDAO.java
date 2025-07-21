package com.example.arirangtrail.data.dao.user;

import com.example.arirangtrail.data.entity.UserEntity;
import com.example.arirangtrail.data.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class UserDAO {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public String join(String username, String password, String email, String firstName, String lastName, LocalDate birthdate, String nickname) {

        UserEntity userEntity = UserEntity.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .email(email)
                .firstname(firstName)
                .lastname(lastName)
                .birthdate(birthdate)
                .nickname(nickname)
                .role("ROLE_USER")
                .createdat(Instant.now())
                .updatedat(Instant.now())
                .build();
        try {
            this.userRepository.save(userEntity);
            return "joined";
        }catch (Exception e){
            e.printStackTrace(); // ✨ 추가: 회원가입 실패 시 자세한 예외 스택 트레이스를 콘솔에 출력
            return e.getMessage(); // ✨ 추가: 프론트엔드로 예외 메시지 전달 (디버깅용)
        }
    }

    public UserEntity findUserByUsername(String username) {
        return this.userRepository.findById(username).orElse(null);
    }
}
