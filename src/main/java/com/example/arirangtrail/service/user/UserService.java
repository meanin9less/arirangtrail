package com.example.arirangtrail.service.user;

import com.example.arirangtrail.data.dao.user.UserDAO;
import com.example.arirangtrail.data.dto.user.JoinDTO;
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

}
