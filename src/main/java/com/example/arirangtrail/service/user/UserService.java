package com.example.arirangtrail.service.user;

import com.example.arirangtrail.data.dao.user.UserDAO;
import com.example.arirangtrail.data.dto.token.TokenDTO;
import com.example.arirangtrail.data.dto.user.JoinDTO;
import com.example.arirangtrail.data.dto.user.UserDTO;
import com.example.arirangtrail.data.entity.UserEntity;
import jakarta.persistence.EntityNotFoundException; // 필요한 임포트 추가
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // @Transactional 임포트
import org.springframework.web.multipart.MultipartFile; // MultipartFile 임포트

import java.io.IOException; // IOException 임포트
import java.nio.file.Files; // Files 임포트
import java.nio.file.Path; // Path 임포트
import java.nio.file.Paths; // Paths 임포트
import java.nio.file.StandardCopyOption; // StandardCopyOption 임포트
import java.time.LocalDate; // LocalDate 임포트 (기존에 있다면 필요 없음)
import java.util.UUID; // UUID 임포트 (파일명 중복 방지용)

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserDAO userDAO;

    // --- 기존 UserService 메서드들은 변경 없이 그대로 유지합니다. ---
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


    // --- ✨ 새로 추가할 이미지 업로드 관련 메서드 ---
    @Transactional // 파일 저장과 DB 업데이트는 하나의 트랜잭션으로 묶는 것이 안전합니다.
    public String uploadProfileImage(String username, MultipartFile imageFile) throws IOException {
        // 1. 파일 저장 경로 설정 (⚠️ 중요: 실제 운영 환경에서는 AWS S3 등 클라우드 스토리지를 사용해야 합니다!)
        //    여기서는 임시로 로컬 파일 시스템의 'src/main/resources/static/uploads/profile/' 경로를 사용합니다.
        //    이 경로는 스프링 부트 애플리케이션의 정적 자원으로 서빙될 수 있도록 설정되어야 합니다.
        //    또는 웹 서버(Nginx, Apache)가 이 경로를 웹으로 노출하도록 설정해야 합니다.
        String uploadDir = "src/main/resources/static/uploads/profile/";
        Path uploadPath = Paths.get(uploadDir);

        // 디렉토리가 없으면 생성
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 2. 파일명 생성 (중복 방지를 위해 UUID와 원본 파일명 조합)
        String originalFileName = imageFile.getOriginalFilename();
        String fileExtension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex >= 0) {
            fileExtension = originalFileName.substring(dotIndex);
        }
        String savedFileName = username + "_" + UUID.randomUUID().toString() + fileExtension;
        Path filePath = uploadPath.resolve(savedFileName);

        // 3. 파일 저장
        Files.copy(imageFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // 4. 저장된 이미지의 웹 접근 가능 URL 생성
        //    이 URL은 클라이언트에서 <img src="..."> 태그를 통해 이미지를 불러올 때 사용됩니다.
        String imageUrl = "/uploads/profile/" + savedFileName; // 정적 자원으로 접근할 경로

        // 5. UserDAO를 통해 DB에 이미지 URL 업데이트
        //    먼저 현재 사용자의 정보를 가져와서 imageurl만 업데이트하고 다시 DAO에 전달합니다.
        UserEntity currentUserEntity = userDAO.userInform(username); // userInform은 username으로 Entity를 반환
        if (currentUserEntity != null) {
            // UserDTO를 빌드하여 imageurl 필드만 변경하고 DAO의 updateInform에 전달
            UserDTO updatedUserDTO = UserDTO.builder()
                    .username(currentUserEntity.getUsername())
                    .email(currentUserEntity.getEmail())
                    .firstname(currentUserEntity.getFirstname())
                    .lastname(currentUserEntity.getLastname())
                    .birthdate(currentUserEntity.getBirthdate())
                    .nickname(currentUserEntity.getNickname())
                    .imageurl(imageUrl) // 새로 업로드된 이미지 URL로 설정
                    .build();

            // DAO의 updateInform 메서드를 호출하여 DB에 업데이트
            userDAO.updateInform(
                    updatedUserDTO.getUsername(),
                    updatedUserDTO.getFirstname(),
                    updatedUserDTO.getLastname(),
                    updatedUserDTO.getEmail(),
                    updatedUserDTO.getBirthdate(),
                    updatedUserDTO.getNickname(),
                    updatedUserDTO.getImageurl()
            );
            return imageUrl;
        } else {
            throw new EntityNotFoundException("User not found with username: " + username);
        }
    }

    // --- ✨ 프로필 이미지 제거 관련 메서드 (선택 사항이지만 권장) ---
    @Transactional
    public void removeProfileImage(String username) throws IOException {
        UserEntity currentUserEntity = userDAO.userInform(username);
        if (currentUserEntity != null) {
            String currentImageUrl = currentUserEntity.getImageurl();
            if (currentImageUrl != null && !currentImageUrl.isEmpty()) {
                // 1. 서버에서 실제 파일 삭제 (선택 사항: 공간 낭비를 막기 위해)
                //    'uploads' 디렉토리에 저장된 파일이라면 해당 파일을 삭제합니다.
                String uploadBaseDir = "src/main/resources/static"; // static 폴더의 기본 경로
                Path filePathToDelete = Paths.get(uploadBaseDir + currentImageUrl);
                if (Files.exists(filePathToDelete) && Files.isReadable(filePathToDelete)) {
                    Files.delete(filePathToDelete);
                }
            }
            // 2. DB의 imageurl 필드를 null로 업데이트
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