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

    // ✨ 새로 추가된 이미지 업로드 관련 메서드
    @Transactional
    public String uploadProfileImage(String username, MultipartFile imageFile) throws IOException {
        UserEntity user = this.userDAO.userInform(username);
        String url = this.fileStore.storeFile(imageFile, bucket);
        user.setImageurl(url);

        this.userDAO.updateInform(
                user.getUsername(),
                user.getFirstname(),
                user.getLastname(),
                user.getEmail(),
                user.getBirthdate(),
                user.getNickname(),
                user.getImageurl()
        );
        return url;
    }

    // ✨ 새로 추가된 이미지 제거 관련 메서드
    @Transactional
    public void removeProfileImage(String username) throws IOException {
        UserEntity currentUserEntity = userDAO.userInform(username);
        if (currentUserEntity != null) {
            String currentImageUrl = currentUserEntity.getImageurl();
            if (currentImageUrl != null && !currentImageUrl.isEmpty()) {
                String uploadBaseDir = "src/main/resources/static"; // static 폴더의 기본 경로
                Path filePathToDelete = Paths.get(uploadBaseDir + currentImageUrl);
                if (Files.exists(filePathToDelete) && Files.isReadable(filePathToDelete)) {
                    Files.delete(filePathToDelete);
                }
            }
            UserDTO updatedUserDTO = UserDTO.builder()
                    .username(currentUserEntity.getUsername())
                    .email(currentUserEntity.getEmail())
                    .firstname(currentUserEntity.getFirstname())
                    .lastname(currentUserEntity.getLastname())
                    .birthdate(currentUserEntity.getBirthdate())
                    .nickname(currentUserEntity.getNickname())
                    .imageurl(null) // imageurl을 null로 설정
                    .build();

            userDAO.updateInform(
                    updatedUserDTO.getUsername(),
                    updatedUserDTO.getFirstname(),
                    updatedUserDTO.getLastname(),
                    updatedUserDTO.getEmail(),
                    updatedUserDTO.getBirthdate(),
                    updatedUserDTO.getNickname(),
                    updatedUserDTO.getImageurl()
            );
        } else {
            throw new EntityNotFoundException("User not found with username: " + username);
        }
    }
}