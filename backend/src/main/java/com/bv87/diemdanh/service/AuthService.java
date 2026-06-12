package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.ChangePasswordRequest;
import com.bv87.diemdanh.dto.LoginRequest;
import com.bv87.diemdanh.dto.LoginResponse;
import com.bv87.diemdanh.entity.Account;
import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AccountRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.security.LoginRateLimitService;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AttendanceLockService lockService;
    private final VietnamTimeService timeService;
    private final LoginRateLimitService loginRateLimitService;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        loginRateLimitService.assertNotBlocked(httpRequest, request.getUsername());

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            loginRateLimitService.clearFailures(httpRequest, request.getUsername());

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);

            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

            return buildResponse((AuthUser) auth.getPrincipal());
        } catch (BadCredentialsException ex) {
            loginRateLimitService.recordFailure(httpRequest, request.getUsername());
            throw ex;
        }
    }

    public LoginResponse getCurrentUser() {
        return buildResponse(getAuthUser());
    }

    public AuthUser getAuthUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthUser)) {
            throw new AccessDeniedException("Chưa đăng nhập");
        }
        return (AuthUser) auth.getPrincipal();
    }

    @Transactional
    public void changePassword(AuthUser authUser, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("Xác nhận mật khẩu không khớp");
        }

        Account account = accountRepository.findById(authUser.getAccount().getId())
                .orElseThrow(() -> new BusinessException("Tài khoản không tồn tại"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), account.getPasswordHash())) {
            throw new BusinessException("Mật khẩu hiện tại không đúng");
        }

        if (passwordEncoder.matches(request.getNewPassword(), account.getPasswordHash())) {
            throw new BusinessException("Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);
    }

    private LoginResponse buildResponse(AuthUser authUser) {
        var account = authUser.getAccount();
        Integer deptCode = account.getDeptCode();
        AccountRole role = account.getRole();
        var today = timeService.today();

        boolean locked = deptCode != null && lockService.isDepartmentLocked(deptCode, today);
        boolean editable = deptCode != null && lockService.isEditable(deptCode, role, today);
        String lockMessage = lockService.getLockMessage(deptCode, role, today);

        return LoginResponse.from(account, editable, locked, lockMessage);
    }
}
