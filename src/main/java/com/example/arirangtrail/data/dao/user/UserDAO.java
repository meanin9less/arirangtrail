package com.example.arirangtrail.data.dao.user;

import com.example.arirangtrail.data.dto.user.JoinDTO;
import com.example.arirangtrail.data.entity.UserEntity;
import com.example.arirangtrail.data.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException; // ✨ 추가: 데이터 무결성 예외 처리
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // ✨ 추가: 트랜잭션 관리

import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException; // ✨ 추가: 날짜 파싱 예외 처리
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

    @Transactional // ✨ 데이터 변경 작업이므로 트랜잭션 어노테이션 추가
    public UserEntity updateInform(String username, String firstname, String lastname, String email, LocalDate birthdate, String nickname, String imageurl ) {
        Optional<UserEntity> userOptional = this.userRepository.findById(username);
        if(userOptional.isPresent()){
            UserEntity updateUser = userOptional.get();

            // username은 ID이므로 업데이트할 필요 없음 (이미 찾은 엔티티임)
            // updateUser.setUsername(username);

            updateUser.setFirstname(firstname);
            updateUser.setLastname(lastname);

            // ✨ 중요: 이메일이 변경되었을 때만 업데이트를 시도하여 UNIQUE 제약 조건 위반 방지
            if (!updateUser.getEmail().equals(email)) {
                updateUser.setEmail(email);
            }

            // birthdate는 LocalDate 타입이므로, null이 아닐 경우에만 설정
            // 프론트에서 넘어온 String birthdate가 LocalDate로 제대로 파싱되었는지 확인하는 로직이 UserService에 있어야 함.
            // 여기서는 이미 LocalDate로 넘어왔다고 가정합니다.
            updateUser.setBirthdate(birthdate);

            // ✨ 중요: 닉네임이 변경되었을 때만 업데이트를 시도하여 UNIQUE 제약 조건 위반 방지
            if (!updateUser.getNickname().equals(nickname)) {
                // 새로운 닉네임이 기존 닉네임과 다를 경우에만 업데이트 시도
                // 이 시점에서 다른 유저가 이미 해당 닉네임을 사용하고 있다면 DataIntegrityViolationException 발생
                updateUser.setNickname(nickname);
            }

            // imageurl은 null 허용이므로 항상 업데이트
            updateUser.setImageurl(imageurl);

            try {
                // 변경된 엔티티 저장
                return this.userRepository.save(updateUser);
            } catch (DataIntegrityViolationException e) {
                // 닉네임 또는 이메일 중복과 같은 데이터 무결성 위반 예외 처리
                // 이 예외를 잡아서 더 구체적인 메시지를 반환하거나, 상위 계층에서 처리하도록 던질 수 있습니다.
                e.printStackTrace(); // 로그에 스택 트레이스 출력
                throw new IllegalArgumentException("데이터 업데이트 중 문제가 발생했습니다 (예: 닉네임/이메일 중복).", e);
            } catch (Exception e) {
                // 그 외 다른 일반적인 예외 처리
                e.printStackTrace(); // 로그에 스택 트레이스 출력
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
