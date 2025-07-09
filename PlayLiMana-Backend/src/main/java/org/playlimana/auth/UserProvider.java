package org.playlimana.auth;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import org.playlimana.model.entity.UserAccountEntity;
import org.playlimana.model.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// Singleton
@RequestScoped
public class UserProvider {

    private static final Logger logger = LoggerFactory.getLogger(UserProvider.class);
    private String userId;

    // changed the way the userAccountRepository gets injected to satisfy sonarqube
    UserAccountRepository userAccountRepository;

    @Inject
    public UserProvider(UserAccountRepository userAccountRepository){
        this.userAccountRepository = userAccountRepository;
    }

    public UserAccountEntity getUser() {
        if (userId == null) {
            logger.warn("User UID not set in UserProvider");
            return null;
        }
        return userAccountRepository.findByUid(userId);
    }

    public void setUser(UserAccountEntity user) {
        this.userId = user.getUid();
        logger.info("Current user set to {}", user.getUsername());
    }
}
