package org.playlimana.service;

import io.opentelemetry.instrumentation.annotations.WithSpan;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.playlimana.model.dto.SongDTO;
import org.playlimana.model.entity.SongEntity;
import org.playlimana.model.repository.SongRepository;
import org.playlimana.utils.Mapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ApplicationScoped
public class SongService {

    private static final Logger logger = LoggerFactory.getLogger(SongService.class);

    SongRepository songRepository;

    @Inject
    public SongService(SongRepository songRepository) {
        this.songRepository = songRepository;
    }


    @Transactional
    @WithSpan
    public SongEntity getSong(Long songId) {
        if (songId != null) {
            return songRepository.findById(songId);
        } else {
            return null;
        }
    }


    @Transactional
    @WithSpan
    public SongEntity createSong(SongDTO songDTO) {
        if (songDTO == null || songDTO.title().isBlank() || songDTO.artists().isEmpty()) {
            logger.error("song couldn't be created because it has invalid data");
            return null;
        }

        SongEntity songEntity = getSong(songDTO.songId());

        if (songEntity != null) {
            logger.info("song {} already exists", songDTO.title());
            return songEntity;
        }

        songEntity = Mapper.toSongEntity(songDTO);
        songRepository.persist(songEntity);
        logger.info("song {} is new", songDTO.title());
        return songEntity;
    }

}
