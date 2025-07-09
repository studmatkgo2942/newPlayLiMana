package org.playlimana;

import com.google.firebase.auth.FirebaseToken;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.playlimana.auth.FirebaseTokenVerifier;
import org.playlimana.auth.UserProvider;
import org.playlimana.model.entity.UserAccountEntity;
import org.playlimana.model.repository.UserAccountRepository;
import org.playlimana.service.UserAccountService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserAccountServiceTests {

    UserAccountRepository userAccountRepository;
    UserProvider userProvider;
    UserAccountService userAccountService;

    @BeforeEach
    void setUp() {
        userAccountRepository = mock(UserAccountRepository.class);
        userProvider = mock(UserProvider.class);
        userAccountService = new UserAccountService(userAccountRepository, userProvider);
    }

    @AfterEach
    void tearDown() {
        userAccountRepository = null;
        userProvider = null;
        userAccountService = null;
    }

    String uid = "user1";
    String username = "john_doe";

    @Test
    void testSaveNewLogin_NewUser_CreatesAndPersists() {
        when(userAccountRepository.findByUid(uid)).thenReturn(null);

        userAccountService.saveNewLogin(uid, username);

        ArgumentCaptor<UserAccountEntity> captor = ArgumentCaptor.forClass(UserAccountEntity.class);
        verify(userAccountRepository).persist(captor.capture());
        verify(userProvider).setUser(any(UserAccountEntity.class));

        assertEquals(uid, captor.getValue().getUid());
        assertEquals(username, captor.getValue().getUsername());
    }

    @Test
    void testSaveNewLogin_ExistingUser_SetsUser() {
        UserAccountEntity user = new UserAccountEntity(uid, username);
        when(userAccountRepository.findByUid(uid)).thenReturn(user);

        userAccountService.saveNewLogin(uid, username);

        verify(userProvider).setUser(user);
        verify(userAccountRepository, never()).persist((UserAccountEntity) any());
    }

    @Test
    void testSetNewUsername_UpdatesUsername() {
        UserAccountEntity user = new UserAccountEntity(uid, "old_name");
        when(userAccountRepository.findByUid(uid)).thenReturn(user);

        userAccountService.setNewUsername(uid, username);

        assertEquals(username, user.getUsername());
    }

    @Test
    void testValidateCredentials_ValidToken_ReturnsTrue() {
        FirebaseToken mockToken = mock(FirebaseToken.class);
        when(mockToken.getUid()).thenReturn(uid);
        when(userAccountRepository.findByUid(uid)).thenReturn(new UserAccountEntity(uid, username));

        try (MockedStatic<FirebaseTokenVerifier> mockVerifier = mockStatic(FirebaseTokenVerifier.class)) {
            mockVerifier.when(() -> FirebaseTokenVerifier.verify("validToken")).thenReturn(mockToken);

            boolean result = userAccountService.validateCredentials("validToken");

            assertTrue(result);
        }
    }

    @Test
    void testValidateCredentials_InvalidToken_ReturnsFalse() {
        try (MockedStatic<FirebaseTokenVerifier> mockVerifier = mockStatic(FirebaseTokenVerifier.class)) {
            mockVerifier.when(() -> FirebaseTokenVerifier.verify("badToken"))
                    .thenThrow(new RuntimeException("Invalid"));

            boolean result = userAccountService.validateCredentials("badToken");

            assertFalse(result);
        }
    }

    @Test
    void testIsAuthorized_ValidHeader_ReturnsTrue() {
        FirebaseToken mockToken = mock(FirebaseToken.class);
        when(mockToken.getUid()).thenReturn(uid);
        when(userAccountRepository.findByUid(uid)).thenReturn(new UserAccountEntity(uid, username));

        try (MockedStatic<FirebaseTokenVerifier> mockVerifier = mockStatic(FirebaseTokenVerifier.class)) {
            mockVerifier.when(() -> FirebaseTokenVerifier.verify("abc.def.ghi")).thenReturn(mockToken);

            boolean result = userAccountService.isAuthorized("Bearer abc.def.ghi");

            assertTrue(result);
            verify(userProvider).setUser(any());
        }
    }

    @Test
    void testIsAuthorized_InvalidHeader_ReturnsFalse() {
        boolean result = userAccountService.isAuthorized("InvalidToken");
        assertFalse(result);
    }

    @Test
    void testIsAuthorized_TokenVerifierThrows_ReturnsFalse() {
        try (MockedStatic<FirebaseTokenVerifier> mockVerifier = mockStatic(FirebaseTokenVerifier.class)) {
            mockVerifier.when(() -> FirebaseTokenVerifier.verify("abc.def.ghi"))
                    .thenThrow(new RuntimeException("Invalid"));

            boolean result = userAccountService.isAuthorized("Bearer abc.def.ghi");

            assertFalse(result);
        }
    }
}
