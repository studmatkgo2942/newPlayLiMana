package org.playlimana.model.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import org.playlimana.model.entity.UserAccountEntity;

@ApplicationScoped
public class UserAccountRepository implements PanacheRepository<UserAccountEntity> {
    public UserAccountEntity findByUid(String uid) {
        return find("uid", uid).firstResult();
    }
}
