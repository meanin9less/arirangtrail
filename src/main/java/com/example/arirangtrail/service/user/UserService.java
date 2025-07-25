package com.example.arirangtrail.service.user;

import com.example.arirangtrail.data.dao.user.UserDAO;
import com.example.arirangtrail.data.dto.token.TokenDTO;
import com.example.arirangtrail.data.dto.user.JoinDTO;
import com.example.arirangtrail.data.dto.user.UserDTO;
import com.example.arirangtrail.data.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserDAO userDAO;

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

}
