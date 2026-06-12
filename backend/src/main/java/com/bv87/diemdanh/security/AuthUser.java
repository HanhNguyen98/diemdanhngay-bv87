package com.bv87.diemdanh.security;

import com.bv87.diemdanh.entity.Account;
import com.bv87.diemdanh.entity.AccountRole;
import lombok.Getter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class AuthUser implements UserDetails {

    private final Account account;

    public AuthUser(Account account) {
        this.account = account;
    }

    @Override
    public Collection<SimpleGrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + account.getRole().name()));
    }

    @Override
    public String getPassword() {
        return account.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return account.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return account.isActive();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return account.isActive();
    }

    public boolean isAdmin() {
        return account.getRole() == AccountRole.ADMIN;
    }

    public boolean isHead() {
        return account.getRole() == AccountRole.HEAD;
    }

    public Integer getDeptCode() {
        return account.getDeptCode();
    }
}
