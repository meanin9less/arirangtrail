package com.example.arirangtrail.service.user;

import com.example.arirangtrail.component.review.FileStore;
import com.example.arirangtrail.data.dao.user.UserDAO;
import com.example.arirangtrail.data.dto.user.JoinDTO;
import com.example.arirangtrail.data.dto.user.UserDTO;
import com.example.arirangtrail.data.entity.UserEntity;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserDAO userDAO;
    private final FileStore fileStore;

    @Value("${cloud.aws.s3.bucket2}")
    private String bucket; // 변수명 'bucket' 유지

    // --- 기존 함수들: 이 부분은 사용자님께서 제공해주신 코드와 동일하게 유지됩니다. ---
    public String join(JoinDTO joinDTO) {
        // 1. 아이디(username) 중복 확인
        if (userDAO.existsByUsername(joinDTO.getUsername())) {
            return "이미 사용 중인 아이디입니다.";
        }

        // 2. 이메일(email) 중복 확인
        if (userDAO.existsByEmail(joinDTO.getEmail())) {
            return "이미 사용 중인 이메일입니다.";
        }

        // 3. 닉네임(nickname) 중복 확인
        if (userDAO.existsByNickname(joinDTO.getNickname())) {
            return "이미 사용 중인 닉네임입니다.";
        }

        // 4. 모든 중복 검사를 통과했을 때만 회원가입 진행
        return userDAO.join(
                joinDTO.getUsername(),
                joinDTO.getPassword(),
                joinDTO.getEmail(),
                joinDTO.getFirstname(),
                joinDTO.getLastname(),
                joinDTO.getBirthdate(),
                joinDTO.getNickname()
        );
    }

    public void resetPassword(String username, String password) {
        this.userDAO.resetPassword(username, password);
    }

    // updateInform 메서드 (UserDTO를 받아 DAO로 전달) - @Transactional 추가 (기존 로직 유지)
    @Transactional
    public UserDTO updateInform(UserDTO userDTO) {
        UserEntity updated=this.userDAO.updateInform(userDTO.getUsername(),userDTO.getFirstname(),userDTO.getLastname(),userDTO.getEmail(),userDTO.getBirthdate(),userDTO.getNickname(),userDTO.getImageurl());
        UserDTO updatedDTO= UserDTO.builder()
                .username(updated.getUsername())
                .firstname(updated.getFirstname())
                .lastname(updated.getLastname())
                .email(updated.getEmail())
                .birthdate(updated.getBirthdate())
                .nickname(updated.getNickname())
                .imageurl(updated.getImageurl())
                .build();
        return updatedDTO;
    }

    public Boolean comaparePassword(String username, String password) {
        return this.userDAO.comaparePassword(username, password);
    }

    public UserDTO userInform(String username) {
        UserEntity entity= this.userDAO.userInform(username);
        return UserDTO.builder()
                .username(entity.getUsername())
                .role(entity.getRole())
                .firstname(entity.getFirstname())
                .lastname(entity.getLastname())
                .email(entity.getEmail())
                .birthdate(entity.getBirthdate())
                .nickname(entity.getNickname())
                .imageurl(entity.getImageurl()) // getImageurl() 사용
                .build();
    }

    public String deleteMember(String username) {
        UserEntity user = userDAO.findUserByUsername(username);
        if (user != null && user.getImageurl() != null && !user.getImageurl().isEmpty()) {
            fileStore.deleteFile(user.getImageurl(), bucket);
        }
        this.userDAO.deleteMember(username);
        return "deleteMember success";
    }

    // simpleJoin 메서드 - 사용자님의 원래 코드와 동일하게 유지됩니다. (변경 없음)
    public UserDTO simpleJoin(JoinDTO joinDTO) {
        UserEntity user = this.userDAO.simpleJoin(
                joinDTO.getUsername(),
                joinDTO.getEmail(),
                joinDTO.getFirstname(),
                joinDTO.getLastname(),
                joinDTO.getBirthdate(),
                joinDTO.getNickname()
        );
        return UserDTO.builder()
                .username(user.getUsername())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .email(user.getEmail())
                .birthdate(user.getBirthdate())
                .nickname(user.getNickname())
                .imageurl(user.getImageurl())
                .role(user.getRole())
                .build();
    }
    // --- 기존 함수들 끝 ---


    // ✨ 프로필 이미지 업로드 관련 메서드 (최종 수정: S3에 업로드만 하고 URL 반환, DB 업데이트 로직 제거)
    @Transactional
    public String uploadProfileImage(String username, MultipartFile imageFile) throws IOException {
        UserEntity user = this.userDAO.userInform(username); // 사용자 존재 여부 확인용
        if (user == null) {
            throw new EntityNotFoundException("사용자를 찾을 수 없습니다: " + username);
        }

        // 기존 이미지가 있다면 S3에서 삭제 (새 이미지로 교체되므로)
        if (user.getImageurl() != null && !user.getImageurl().isEmpty()) {
            fileStore.deleteFile(user.getImageurl(), bucket);
        }

        // 새 이미지 S3에 업로드
        String newImageUrl = fileStore.storeFile(imageFile, bucket);

        // 이 메서드에서는 DB 업데이트를 하지 않습니다.
        // DB 업데이트는 프론트에서 이 URL을 받아 /update-inform으로 다시 요청할 때 이루어집니다.
        return newImageUrl; // 업로드된 새 이미지 URL 반환
    }

    // ✨ 프로필 이미지 제거 관련 메서드 (최종 수정: S3에서 삭제만 하고 DB 업데이트 로직 제거)
    @Transactional
    public void removeProfileImage(String username) {
        UserEntity currentUserEntity = userDAO.userInform(username);
        if (currentUserEntity == null) {
            throw new EntityNotFoundException("사용자를 찾을 수 없습니다: " + username);
        }

        // 기존 이미지가 있다면 S3에서 삭제
        if (currentUserEntity.getImageurl() != null && !currentUserEntity.getImageurl().isEmpty()) {
            fileStore.deleteFile(currentUserEntity.getImageurl(), bucket);
        }
        // 이 메서드에서는 DB 업데이트를 하지 않습니다.
        // DB 업데이트는 프론트에서 imageurl: null을 받아 /update-inform으로 다시 요청할 때 이루어집니다.
    }

    public UserDTO findByEmail(String email) {
        UserEntity user = this.userDAO.findByEmail(email);
        return UserDTO.builder()
                .username(user.getUsername())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .email(user.getEmail())
                .birthdate(user.getBirthdate())
                .nickname(user.getNickname())
                .imageurl(user.getImageurl())
                .role(user.getRole())
                .build();
    }
}
