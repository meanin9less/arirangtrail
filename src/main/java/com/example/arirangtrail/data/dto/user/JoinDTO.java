package com.example.arirangtrail.data.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JoinDTO {
    private String username;
    private String password;
    private String email;
    private String firstname;
    private String lastname;
    private String nickname;
}
