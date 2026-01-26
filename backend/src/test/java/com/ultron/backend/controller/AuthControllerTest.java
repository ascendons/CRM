package com.ultron.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultron.backend.dto.request.LoginRequest;
import com.ultron.backend.dto.request.RegisterRequest;
import com.ultron.backend.dto.response.AuthResponse;
import com.ultron.backend.domain.enums.UserRole;
import com.ultron.backend.exception.UserAlreadyExistsException;
import com.ultron.backend.exception.InvalidCredentialsException;
import com.ultron.backend.exception.GlobalExceptionHandler;
import com.ultron.backend.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController Unit Tests")
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private RegisterRequest validRegisterRequest;
    private LoginRequest validLoginRequest;
    private AuthResponse authResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();

        validRegisterRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("Test@1234")
                .fullName("Test User")
                .build();

        validLoginRequest = LoginRequest.builder()
                .email("test@example.com")
                .password("Test@1234")
                .build();

        authResponse = AuthResponse.builder()
                .userId("USR-2026-01-00001")
                .email("test@example.com")
                .fullName("Test User")
                .role(UserRole.USER)
                .token("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
                .build();
    }

    // ==================== REGISTER ENDPOINT TESTS ====================

    @Test
    @DisplayName("POST /auth/register - Success with valid data")
    void testRegister_Success() throws Exception {
        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRegisterRequest)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User registered successfully"))
                .andExpect(jsonPath("$.data.userId").value("USR-2026-01-00001"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.fullName").value("Test User"))
                .andExpect(jsonPath("$.data.role").value("USER"))
                .andExpect(jsonPath("$.data.token").exists());

        verify(authService, times(1)).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Failure when email already exists")
    void testRegister_EmailAlreadyExists() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new UserAlreadyExistsException("Email already registered"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRegisterRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email already registered"));

        verify(authService, times(1)).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Validation failure for blank email")
    void testRegister_BlankEmail() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("")
                .password("Test@1234")
                .fullName("Test User")
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Validation failure for invalid email format")
    void testRegister_InvalidEmailFormat() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("invalid-email")
                .password("Test@1234")
                .fullName("Test User")
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Validation failure for blank password")
    void testRegister_BlankPassword() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("")
                .fullName("Test User")
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Validation failure for short password")
    void testRegister_ShortPassword() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("Test@1")
                .fullName("Test User")
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Validation failure for password without uppercase")
    void testRegister_PasswordWithoutUppercase() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("test@1234")
                .fullName("Test User")
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Validation failure for password without lowercase")
    void testRegister_PasswordWithoutLowercase() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("TEST@1234")
                .fullName("Test User")
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Validation failure for password without digit")
    void testRegister_PasswordWithoutDigit() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("Test@test")
                .fullName("Test User")
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Validation failure for password without special character")
    void testRegister_PasswordWithoutSpecialChar() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("Test12345")
                .fullName("Test User")
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Validation failure for blank full name")
    void testRegister_BlankFullName() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("Test@1234")
                .fullName("")
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Validation failure for short full name")
    void testRegister_ShortFullName() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("Test@1234")
                .fullName("A")
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Validation failure for too long full name")
    void testRegister_TooLongFullName() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .email("test@example.com")
                .password("Test@1234")
                .fullName("A".repeat(101))
                .build();

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Failure with null request body")
    void testRegister_NullRequestBody() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any(RegisterRequest.class));
    }

    // ==================== LOGIN ENDPOINT TESTS ====================

    @Test
    @DisplayName("POST /auth/login - Success with valid credentials")
    void testLogin_Success() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.data.userId").value("USR-2026-01-00001"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.fullName").value("Test User"))
                .andExpect(jsonPath("$.data.role").value("USER"))
                .andExpect(jsonPath("$.data.token").exists());

        verify(authService, times(1)).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /auth/login - Failure with invalid credentials")
    void testLogin_InvalidCredentials() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        verify(authService, times(1)).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /auth/login - Validation failure for blank email")
    void testLogin_BlankEmail() throws Exception {
        LoginRequest invalidRequest = LoginRequest.builder()
                .email("")
                .password("Test@1234")
                .build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /auth/login - Validation failure for invalid email format")
    void testLogin_InvalidEmailFormat() throws Exception {
        LoginRequest invalidRequest = LoginRequest.builder()
                .email("invalid-email")
                .password("Test@1234")
                .build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /auth/login - Validation failure for blank password")
    void testLogin_BlankPassword() throws Exception {
        LoginRequest invalidRequest = LoginRequest.builder()
                .email("test@example.com")
                .password("")
                .build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /auth/login - Failure with null request body")
    void testLogin_NullRequestBody() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        verify(authService, never()).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /auth/login - Success with different user roles")
    void testLogin_DifferentUserRoles() throws Exception {
        UserRole[] roles = {UserRole.USER, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN};

        for (UserRole role : roles) {
            AuthResponse roleResponse = AuthResponse.builder()
                    .userId("USR-2026-01-00001")
                    .email("test@example.com")
                    .fullName("Test User")
                    .role(role)
                    .token("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
                    .build();

            when(authService.login(any(LoginRequest.class))).thenReturn(roleResponse);

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validLoginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.role").value(role.toString()));
        }

        verify(authService, times(roles.length)).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /auth/register - Success validates response structure")
    void testRegister_ResponseStructure() throws Exception {
        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRegisterRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.data.userId").exists())
                .andExpect(jsonPath("$.data.email").exists())
                .andExpect(jsonPath("$.data.fullName").exists())
                .andExpect(jsonPath("$.data.role").exists())
                .andExpect(jsonPath("$.data.token").exists());
    }

    @Test
    @DisplayName("POST /auth/login - Success validates response structure")
    void testLogin_ResponseStructure() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLoginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.data.userId").exists())
                .andExpect(jsonPath("$.data.email").exists())
                .andExpect(jsonPath("$.data.fullName").exists())
                .andExpect(jsonPath("$.data.role").exists())
                .andExpect(jsonPath("$.data.token").exists());
    }
}
