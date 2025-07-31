package com.example.arirangtrail.service.user;

import com.example.arirangtrail.component.review.FileStore;
import com.example.arirangtrail.data.dao.user.UserDAO;
import com.example.arirangtrail.data.dto.user.JoinDTO;
import com.example.arirangtrail.data.dto.user.UserDTO;
import com.example.arirangtrail.data.entity.UserEntity;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserDAO userDAO;
    private final FileStore fileStore;

    @Value("${cloud.aws.s3.bucket2}")
    private String bucket;

    public String join(JoinDTO joinDTO) {
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

    // 기존 updateInform 메서드 (UserDTO를 받아 DAO로 전달)
    public UserDTO updateInform(UserDTO userDTO) {
        UserEntity updated = this.userDAO.updateInform(userDTO.getUsername(), userDTO.getFirstname(), userDTO.getLastname(), userDTO.getEmail(), userDTO.getBirthdate(), userDTO.getNickname(), userDTO.getImageurl());
        UserDTO updatedDTO = UserDTO.builder()
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
        UserEntity entity = this.userDAO.userInform(username);
        UserDTO userDTO = UserDTO.builder()
                .username(entity.getUsername())
                .role(entity.getRole())
                .firstname(entity.getFirstname())
                .lastname(entity.getLastname())
                .email(entity.getEmail())
                .birthdate(entity.getBirthdate())
                .nickname(entity.getNickname())
                .imageurl(entity.getImageurl())
                .build();
        return userDTO;
    }

    public String deleteMember(String username) {
        this.userDAO.deleteMember(username);
        return "deleteMember success";
    }

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

    // ✨ 프로필 이미지 업로드 관련 메서드 (최소 수정: S3에 업로드만 하고 URL 반환)
    @Transactional
    public String uploadProfileImage(String username, MultipartFile imageFile) throws IOException {
        UserEntity user = this.userDAO.userInform(username); // 사용자 존재 여부 확인용
        if (user == null) {
            throw new EntityNotFoundException("사용자를 찾을 수 없습니다: " + username);
        }

        // 기존 이미지가 있다면 S3에서 삭제 (새 이미지로 교체되므로)
        if (user.getImageurl() != null && !user.getImageurl().isEmpty()) { // getImageurl() 사용
            fileStore.deleteFile(user.getImageurl(), bucket); // FileStore 사용
        }

        // 새 이미지 S3에 업로드
        String newImageUrl = fileStore.storeFile(imageFile, bucket); // FileStore 사용

        // 이 메서드에서는 DB 업데이트를 하지 않습니다.
        // DB 업데이트는 프론트에서 이 URL을 받아 /update-inform으로 다시 요청할 때 이루어집니다.
        return newImageUrl; // 업로드된 새 이미지 URL 반환
    }

    // ✨ 프로필 이미지 제거 관련 메서드 (최소 수정: S3에서 삭제만 하고 DB 업데이트는 하지 않음)
    @Transactional
    public void removeProfileImage(String username) { // throws IOException 제거 (S3 삭제는 RuntimeException)
        UserEntity currentUserEntity = userDAO.userInform(username);
        if (currentUserEntity == null) {
            throw new EntityNotFoundException("사용자를 찾을 수 없습니다: " + username);
        }

        // 기존 이미지가 있다면 S3에서 삭제
        if (currentUserEntity.getImageurl() != null && !currentUserEntity.getImageurl().isEmpty()) { // getImageurl() 사용
            fileStore.deleteFile(currentUserEntity.getImageurl(), bucket); // FileStore 사용
        }
        // 이 메서드에서는 DB 업데이트를 하지 않습니다.
        // DB 업데이트는 프론트에서 imageurl: null을 받아 /update-inform으로 다시 요청할 때 이루어집니다.
    }
}