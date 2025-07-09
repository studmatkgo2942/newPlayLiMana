package org.playlimana.service;

import com.google.firebase.auth.FirebaseToken;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.playlimana.auth.UserProvider;
import org.playlimana.auth.FirebaseTokenVerifier;
import org.playlimana.model.dto.ConnectedServiceDTO;
import org.playlimana.model.dto.SaveServiceTokenDTO;
import org.playlimana.model.entity.UserAccountEntity;
import org.playlimana.model.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class UserAccountService {

    private static final Logger logger = LoggerFactory.getLogger(UserAccountService.class);

    UserAccountRepository userAccountRepository;
    UserProvider userProvider;

    @Inject
    public UserAccountService(UserAccountRepository userAccountRepository,
                              UserProvider userProvider) {
        this.userAccountRepository = userAccountRepository;
        this.userProvider = userProvider;
    }

    @Transactional
    public void saveNewLogin(String uid, String username) {
        if (uid != null && username != null) {
            UserAccountEntity existing = userAccountRepository.findByUid(uid);
            if (existing == null) {
                UserAccountEntity user = new UserAccountEntity(uid, username);
                userAccountRepository.persist(user);
                userProvider.setUser(user);
            } else {
                userProvider.setUser(existing);
            }
        }
    }

    @Transactional
    public void setNewUsername(String uid, String username) {
        if (uid != null && username != null) {
            UserAccountEntity user = userAccountRepository.findByUid(uid);
            if (user != null) {
                user.setUsername(username);
            }
        }
    }

    /**
     * Returns true if the given Firebase ID token is valid AND
     * its UID is known in our UserAccountEntity table.
     */
    @Transactional
    public boolean validateCredentials(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            return false;
        }
        try {
            // will throw a RuntimeException if invalid/expired
            FirebaseToken decoded = FirebaseTokenVerifier.verify(idToken);
            String uid = decoded.getUid();
            return userAccountRepository.findByUid(uid) != null;
        } catch (RuntimeException e) {
            // invalid token, expired, or user not found
            return false;
        }
    }

    private String extractToken(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            logger.info("Token is null");
            return null;
        }
        return header.substring("Bearer ".length()).trim();
    }

    public boolean isAuthorized(String authHeader) {
        String idToken = extractToken(authHeader);

        try {
            var decoded = FirebaseTokenVerifier.verify(idToken);
            String uid = decoded.getUid();

            if (uid != null && !uid.isBlank()) {
                UserAccountEntity user = userAccountRepository.findByUid(uid);
                userProvider.setUser(user);
            }

        } catch (Exception e) {
            logger.warn("User is not authorized: {}", e.getMessage());
            return false;
        }

        return idToken != null;
    }

    @Transactional
    public void saveServiceToken(String uid, SaveServiceTokenDTO dto) {
        var user = userAccountRepository.findByUid(uid);
        if (user == null) {
            throw new IllegalArgumentException("Unknown user " + uid);
        }

        // 1st try to update an existing slot
        if (dto.serviceName().equals(user.getServiceName1()) || user.getServiceName1() == null) {
            user.setServiceName1(dto.serviceName());
            user.setAccountId1(dto.accountId());
            user.setAuthToken1(dto.authToken());
            return;
        }
        if (dto.serviceName().equals(user.getServiceName2()) || user.getServiceName2() == null) {
            user.setServiceName2(dto.serviceName());
            user.setAccountId2(dto.accountId());
            user.setAuthToken2(dto.authToken());
            return;
        }
        if (dto.serviceName().equals(user.getServiceName3()) || user.getServiceName3() == null) {
            user.setServiceName3(dto.serviceName());
            user.setAccountId3(dto.accountId());
            user.setAuthToken3(dto.authToken());
            return;
        }

        throw new IllegalStateException("No free slot to save service token");
    }

    @Transactional
    public void removeServiceToken(String uid, String serviceName) {
        var user = userAccountRepository.findByUid(uid);
        if (user == null) {
            throw new IllegalArgumentException("Unknown user " + uid);
        }

        if (serviceName.equals(user.getServiceName1())) {
            user.setServiceName1(null);
            user.setAccountId1(null);
            user.setAuthToken1(null);
            return;
        }
        if (serviceName.equals(user.getServiceName2())) {
            user.setServiceName2(null);
            user.setAccountId2(null);
            user.setAuthToken2(null);
            return;
        }
        if (serviceName.equals(user.getServiceName3())) {
            user.setServiceName3(null);
            user.setAccountId3(null);
            user.setAuthToken3(null);
            return;
        }
    }

    @Transactional
    public List<ConnectedServiceDTO> listConnectedServices(String uid) {
        var user = userAccountRepository.findByUid(uid);
        if (user == null) {
            throw new IllegalArgumentException("Unknown user " + uid);
        }

        List<ConnectedServiceDTO> out = new ArrayList<>();
        if (user.getServiceName1() != null) {
            out.add(new ConnectedServiceDTO(
                    user.getServiceName1(),
                    user.getAccountId1(),
                    user.getAuthToken1()
            ));
        }
        if (user.getServiceName2() != null) {
            out.add(new ConnectedServiceDTO(
                    user.getServiceName2(),
                    user.getAccountId2(),
                    user.getAuthToken2()
            ));
        }
        if (user.getServiceName3() != null) {
            out.add(new ConnectedServiceDTO(
                    user.getServiceName3(),
                    user.getAccountId3(),
                    user.getAuthToken3()
            ));
        }
        return out;
    }
}
