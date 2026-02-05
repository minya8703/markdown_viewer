package com.markdownviewer.controller;

import com.markdownviewer.dto.response.ApiResponse;
import com.markdownviewer.dto.response.AuthResponse;
import com.markdownviewer.entity.User;
import com.markdownviewer.service.AuthService;
import com.markdownviewer.service.JwtBlacklistService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController 단위 테스트
 */
@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@TestPropertySource(properties = "app.frontend-url=http://localhost:5173")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtBlacklistService jwtBlacklistService;

    @Test
    @DisplayName("GET /auth/me - Authorization 헤더 없으면 401")
    void getCurrentUser_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /auth/me - Bearer 토큰 없으면 401")
    void getCurrentUser_withInvalidHeader_returns401() throws Exception {
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Invalid xxx"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /auth/me - 유효한 토큰이면 사용자 정보 200 반환")
    void getCurrentUser_withValidToken_returns200() throws Exception {
        User user = User.builder()
                .id(1L)
                .googleSub("google-sub-1")
                .email("test@example.com")
                .name("Test User")
                .pictureUrl("https://example.com/photo.jpg")
                .storageQuota(1073741824L)
                .storageUsed(0L)
                .createdAt(LocalDateTime.now())
                .build();

        when(authService.getUserIdFromToken(anyString())).thenReturn(1L);
        when(authService.findById(1L)).thenReturn(user);

        ResultActions result = mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer valid-jwt-token"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));

        String body = result.andReturn().getResponse().getContentAsString();
        ApiResponse<?> response = objectMapper.readValue(body, ApiResponse.class);
        assert Boolean.TRUE.equals(response.getSuccess());
    }

    @Test
    @DisplayName("POST /auth/logout - 200 및 성공 메시지")
    void logout_returns200() throws Exception {
        mockMvc.perform(post("/auth/logout").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("로그아웃되었습니다."));
    }
}
