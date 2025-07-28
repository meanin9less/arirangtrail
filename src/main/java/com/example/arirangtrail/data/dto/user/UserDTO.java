package com.example.arirangtrail.data.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private String username;
    private String password;
    private String role;
    private String email;
    private String firstname;
    private String lastname;
    private String nickname;
    private String imageurl;
    private LocalDate birthdate;
}
