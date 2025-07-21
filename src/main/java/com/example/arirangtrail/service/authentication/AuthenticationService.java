package com.example.arirangtrail.service.authentication;

import com.example.arirangtrail.data.dao.user.UserDAO;
import com.example.arirangtrail.data.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthenticationService implements UserDetailsService {
    private final UserDAO userDAO;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException{

        UserEntity userEntity = this.userDAO.findUserByUsername(username);
        if(userEntity==null){
            throw new UsernameNotFoundException("not found");
        }
        String loginRole = userEntity.getRole();

        List<GrantedAuthority> grantedAuthorities = new ArrayList<>(); // GrantedAutority 롤 정보를 담는 인터페이스

        if(loginRole.equals("ROLE_USER")){
            grantedAuthorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }
        if(loginRole.equals("ROLE_ADMIN")){
            grantedAuthorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

        return new User(userEntity.getUsername(), userEntity.getPassword(), grantedAuthorities);
    }

}
