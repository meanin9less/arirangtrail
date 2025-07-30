package com.example.arirangtrail.data.dao.user;

import com.example.arirangtrail.data.dto.user.JoinDTO;
import com.example.arirangtrail.data.entity.UserEntity;
import com.example.arirangtrail.data.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

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
            e.printStackTrace();
            return e.getMessage();
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

    @Transactional
    public UserEntity updateInform(String username, String firstname, String lastname, String email, LocalDate birthdate, String nickname, String imageurl ) {
        Optional<UserEntity> userOptional = this.userRepository.findById(username);
        if(userOptional.isPresent()){
            UserEntity updateUser = userOptional.get();

            updateUser.setFirstname(firstname);
            updateUser.setLastname(lastname);

            if (!updateUser.getEmail().equals(email)) {
                updateUser.setEmail(email);
            }

            updateUser.setBirthdate(birthdate);

            if (!updateUser.getNickname().equals(nickname)) {
                updateUser.setNickname(nickname);
            }

            // ✨ imageurl 업데이트: null이 넘어오면 null로 저장
            updateUser.setImageurl(imageurl);

            try {
                return this.userRepository.save(updateUser);
            } catch (DataIntegrityViolationException e) {
                e.printStackTrace();
                throw new IllegalArgumentException("데이터 업데이트 중 문제가 발생했습니다 (예: 닉네임/이메일 중복).", e);
            } catch (Exception e) {
                e.printStackTrace();
                throw new RuntimeException("사용자 정보 업데이트 중 알 수 없는 오류가 발생했습니다.", e);
            }
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

    public UserEntity simpleJoin(String username, String email, String firstName, String lastName, LocalDate birthdate, String nickname) {
        UserEntity userEntity = UserEntity.builder()
                .username(username)
                .password(passwordEncoder.encode(UUID.randomUUID().toString().replace("-", "")))
                .email(email)
                .firstname(firstName)
                .lastname(lastName)
                .birthdate(birthdate)
                .nickname(nickname)
                .role("ROLE_USER")
                .createdat(Instant.now())
                .updatedat(Instant.now())
                .build();
        return this.userRepository.save(userEntity);
    }
}