package com.markdownviewer.service;

import com.markdownviewer.config.JwtProperties;
import com.markdownviewer.entity.User;
import com.markdownviewer.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * AuthService 단위 테스트
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    private static final String JWT_SECRET = "test-secret-key-min-32-characters-long-for-hs256";
    private static final Long JWT_EXPIRATION = 3600000L;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtProperties jwtProperties;

    @Mock
    private JwtBlacklistService jwtBlacklistService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        when(jwtProperties.getSecret()).thenReturn(JWT_SECRET);
        when(jwtProperties.getExpiration()).thenReturn(JWT_EXPIRATION);
    }

    @Test
    @DisplayName("generateToken 후 getUserIdFromToken으로 userId 복원")
    void generateToken_and_getUserIdFromToken_roundTrip() {
        Long userId = 1L;
        String token = authService.generateToken(userId);
        assertThat(token).isNotBlank();

        Long decoded = authService.getUserIdFromToken(token);
        assertThat(decoded).isEqualTo(userId);
    }

    @Test
    @DisplayName("getUserIdFromToken - 잘못된 토큰이면 예외")
    void getUserIdFromToken_invalidToken_throws() {
        assertThatThrownBy(() -> authService.getUserIdFromToken("invalid-token"))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("findById - 존재하는 사용자 반환")
    void findById_existingUser_returnsUser() {
        User user = User.builder()
                .id(1L)
                .googleSub("sub-1")
                .email("a@b.com")
                .name("User")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        User result = authService.findById(1L);
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("a@b.com");
    }

    @Test
    @DisplayName("findById - 존재하지 않으면 예외")
    void findById_notFound_throws() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.findById(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("찾을 수 없습니다");
    }

    @Test
    @DisplayName("createOrUpdateUser - 새 사용자면 저장 후 반환")
    void createOrUpdateUser_newUser_savesAndReturns() {
        when(userRepository.findByGoogleSub("new-sub")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return User.builder()
                    .id(1L)
                    .googleSub(u.getGoogleSub())
                    .email(u.getEmail())
                    .name(u.getName())
                    .pictureUrl(u.getPictureUrl())
                    .lastLoginAt(u.getLastLoginAt())
                    .build();
        });

        User result = authService.createOrUpdateUser("new-sub", "new@example.com", "New User", null);
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("new@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("createOrUpdateUser - 기존 사용자면 업데이트 후 반환")
    void createOrUpdateUser_existingUser_updatesAndReturns() {
        User existing = User.builder()
                .id(1L)
                .googleSub("existing-sub")
                .email("old@example.com")
                .name("Old Name")
                .build();
        when(userRepository.findByGoogleSub("existing-sub")).thenReturn(Optional.of(existing));

        User result = authService.createOrUpdateUser("existing-sub", "old@example.com", "New Name", "https://pic.url");
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getPictureUrl()).isEqualTo("https://pic.url");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("logout - 유효한 토큰이면 블랙리스트에 추가")
    void logout_validToken_addsToBlacklist() {
        String token = authService.generateToken(1L);
        authService.logout(token);
        verify(jwtBlacklistService).add(eq(token), org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    @DisplayName("logout - null/빈 토큰이면 블랙리스트에 추가하지 않음")
    void logout_nullOrBlank_doesNotAdd() {
        authService.logout(null);
        authService.logout("");
        authService.logout("   ");
        verify(jwtBlacklistService, never()).add(any(), anyLong());
    }
}
