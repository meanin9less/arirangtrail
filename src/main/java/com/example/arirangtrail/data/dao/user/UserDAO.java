package com.example.arirangtrail.data.dao.user;

import com.example.arirangtrail.data.entity.UserEntity;
import com.example.arirangtrail.data.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;

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
                .createdat(Instant.now())
                .updatedat(Instant.now())
                .build();
        try {
            this.userRepository.save(userEntity);
            return "joined";
        }catch (Exception e){
            return e.getMessage();
        }
    }

    public UserEntity findUserByUsername(String username) {
        return this.userRepository.findById(username).orElse(null);
    }
}
