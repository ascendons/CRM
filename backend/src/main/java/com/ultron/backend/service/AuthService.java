package com.ultron.backend.service;

import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.UserStatus;
import com.ultron.backend.dto.request.LoginRequest;
import com.ultron.backend.dto.request.RegisterRequest;
import com.ultron.backend.dto.response.AuthResponse;
import com.ultron.backend.exception.InvalidCredentialsException;
import com.ultron.backend.exception.UserAlreadyExistsException;
import com.ultron.backend.exception.UserInactiveException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest request) {
        log.info("Attempting to register user with email: {}", request.getEmail());

        if (userService.existsByEmail(request.getEmail())) {
            log.warn("Registration failed - email already exists: {}", request.getEmail());
            throw new UserAlreadyExistsException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .createdAt(LocalDateTime.now())
                .build();

        User savedUser = userService.save(user);
        log.info("User registered successfully: {}", savedUser.getId());

        String token = jwtService.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().name()
        );

        return buildAuthResponse(savedUser, token);
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Attempting login for email: {}", request.getEmail());

        User user = userService.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> {
                    log.warn("Login failed - user not found: {}", request.getEmail());
                    return new InvalidCredentialsException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed - invalid password for email: {}", request.getEmail());
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Login failed - user account is not active: {}", request.getEmail());
            throw new UserInactiveException("Your account is not active. Please contact support.");
        }

        log.info("User logged in successfully: {}", user.getId());

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .token(token)
                .build();
    }
}
