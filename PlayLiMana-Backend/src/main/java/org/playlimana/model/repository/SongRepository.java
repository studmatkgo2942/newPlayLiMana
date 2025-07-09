package org.playlimana.model.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import org.playlimana.model.entity.SongEntity;

@ApplicationScoped
public class SongRepository implements PanacheRepository<SongEntity> {
}
