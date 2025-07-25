package com.example.arirangtrail.data.dao.user;

import com.example.arirangtrail.data.entity.UserEntity;
import com.example.arirangtrail.data.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

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

    public void resetPassword(String username, String password) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        Optional<UserEntity> user = this.userRepository.findById(username);
        if (user.isPresent()) {
            UserEntity userEntity = user.get();
            userEntity.setPassword(passwordEncoder.encode(password));
            this.userRepository.save(userEntity);
            return;
        }
        throw new EntityNotFoundException("user not found");
    }

    public UserEntity updateInform(String username, String firstname, String lastname, String email, LocalDate birthdate, String nickname, String imageurl ) {
        Optional<UserEntity> user=this.userRepository.findById(username);
        if(user.isPresent()){
            UserEntity updateUser= user.get();
            updateUser.setUsername(username);
            updateUser.setFirstname(firstname);
            updateUser.setLastname(lastname);
            updateUser.setEmail(email);
            updateUser.setBirthdate(birthdate);
            updateUser.setNickname(nickname);
            updateUser.setImageurl(imageurl);
            this.userRepository.save(updateUser);
            return updateUser;
        }
        throw new EntityNotFoundException("user not found");
    }

    public boolean comaparePassword(String username,String password) {
        Optional<UserEntity> user= this.userRepository.findById(username);
        if(user.isPresent()){
            UserEntity updateUser= user.get();
            boolean match = passwordEncoder.matches(password, updateUser.getPassword());
            return match;
        }
        throw new EntityNotFoundException("user not found");
    }

    public UserEntity userInform(String username) {
        Optional<UserEntity> user = this.userRepository.findById(username);
        if(user.isPresent()){
            return user.get();
        }
        throw new EntityNotFoundException("user not found");
    }

    public void deleteMember(String username) {
        Optional<UserEntity> user = this.userRepository.findById(username);
        if(user.isPresent()){
            this.userRepository.delete(user.get());
        }else {
            throw new EntityNotFoundException("user not found");
        }
    }
}
