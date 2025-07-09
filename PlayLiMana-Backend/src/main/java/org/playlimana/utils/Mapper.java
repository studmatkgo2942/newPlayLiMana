package org.playlimana.utils;

import org.playlimana.model.dto.PlaylistDTO;
import org.playlimana.model.dto.SongDTO;
import org.playlimana.model.entity.PlaylistEntity;
import org.playlimana.model.entity.SongEntity;
import org.playlimana.model.entity.SongInPlaylistEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
// removed unused import statement (sonarqube)
/**
 * Utility class for mapping between DTOs and Entities in the Playlimana application.
 * It handles the transformation of data between different layers, including formatting of dates.
 */
public class Mapper {

    private static final Logger logger = LoggerFactory.getLogger(Mapper.class);

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private Mapper(){
        // private constructor to hide the public one (sonarqube)
    }

    /**
     * Converts a String date in the format "yyyy-MM-dd" to a LocalDate.
     *
     * @param dateString the date string to convert
     * @return LocalDate representation or {@code null} if the input is invalid
     */
    public static LocalDate mapStringToLocalDate(String dateString) {
        if (dateString == null || dateString.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(dateString, DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            logger.error(e.getMessage());
            return null;
        }
    }


    /**
     * Converts a LocalDate to its String representation using "yyyy-MM-dd" format.
     *
     * @param date the LocalDate to format
     * @return formatted date string or {@code null} if input is {@code null}
     */
    public static String mapLocalDateToString(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.format(DATE_FORMATTER);
    }


    /**
     * Converts a String date in the format "yyyy-MM-dd'T'HH:mm:ss" to a LocalDateTime.
     *
     * @param dateString the date string to convert
     * @return LocalDateTime representation or {@code null} if the input is invalid
     */
    public static LocalDateTime mapStringToLocalDateTime(String dateString) {
        if (dateString == null || dateString.isBlank()) {
            return null;
        }

        try {
            return LocalDateTime.parse(dateString, DATE_TIME_FORMATTER);
        } catch (DateTimeParseException e1) {
            // Fallback
            try {
                LocalDate date = LocalDate.parse(dateString, DATE_FORMATTER);
                return date.atStartOfDay(); // Sets time to 00:00:00
            } catch (DateTimeParseException e2) {
                logger.error("Fehler beim Parsen des Datums '{}': {}", dateString, e2.getMessage());
                return null;
            }
        }
    }



    /**
     * Converts a LocalDateTime to its String representation using "yyyy-MM-dd'T'HH:mm:ss" format.
     *
     * @param date the LocalDateTime to format
     * @return formatted date string or {@code null} if input is {@code null}
     */
    public static String mapLocalDateTimeToString(LocalDateTime date) {
        if (date == null) {
            return null;
        }
        return date.format(DATE_TIME_FORMATTER);
    }


    /**
     * Maps a {@link SongEntity} and additional playlist information to a {@link SongDTO}.
     *
     * @param songEntity         the entity to map
     * @param positionInPlaylist position of the song within the playlist
     * @param dateAdded          date when the song was added to the playlist
     * @return the mapped SongDTO or {@code null} if input is {@code null}
     */
    public static SongDTO toSongDTO(SongEntity songEntity, int positionInPlaylist, LocalDateTime dateAdded) {
        if (songEntity == null) {
            return null;
        }

        return new SongDTO(
                songEntity.getSongId(),
                songEntity.getTitle(),
                songEntity.getArtists(),
                songEntity.getAlbum(),
                songEntity.getGenres(),
                songEntity.getPlaytime(),
                mapLocalDateToString(songEntity.getReleaseDate()),
                songEntity.getLinksForWebPlayer(),
                songEntity.getCoverUrl(),
                positionInPlaylist,
                mapLocalDateTimeToString(dateAdded)
        );
    }


    /**
     * Maps a {@link SongEntity} to a {@link SongDTO} without playlist-specific context.
     *
     * @param songEntity the entity to map
     * @return the mapped SongDTO
     */
    public static SongDTO toSongDTO(SongEntity songEntity) {
        return toSongDTO(songEntity, -1, null);
    }


    /**
     * Converts a {@link SongDTO} to a {@link SongEntity}.
     * It does NOT carry over the playlistId!
     *
     * @param songDTO the DTO to map
     * @return the mapped SongEntity or {@code null} if input is {@code null}
     */
    public static SongEntity toSongEntity(SongDTO songDTO) {
        if (songDTO == null) {
            return null;
        }
        // adjusted call for constructor to make it more simple (sonarqube)
        SongEntity song = new SongEntity(
                songDTO.title(),
                songDTO.artists(),
                songDTO.album(),
                songDTO.genres(),
                songDTO.playtime(),
                mapStringToLocalDate(songDTO.releaseDate()),
                songDTO.linksForWebPlayer());

        song.setCoverUrl(songDTO.coverUrl());

        return song;
    }


    /**
     * Maps a {@link PlaylistEntity} to a {@link PlaylistDTO}.
     * Automatically constructs a dynamic cover URL if a cover file is present.
     *
     * @param playlistEntity the entity to map
     * @return the mapped PlaylistDTO or {@code null} if input is {@code null}
     */
    public static PlaylistDTO toPlaylistDTO(PlaylistEntity playlistEntity, LocalDateTime addDate) {
        if (playlistEntity == null) {
            return null;
        }

        List<SongDTO> songDTOs = new ArrayList<>();

        if (playlistEntity.getSongs() != null) {
            int length = playlistEntity.getSongs().size();
            List<SongInPlaylistEntity> sips = playlistEntity.getSongs();
            SongInPlaylistEntity currentSip;
            SongEntity currentSong;

            for (int i = 0; i < length; i++) {
                currentSip = sips.get(i);
                currentSong = currentSip.getSong();
                songDTOs.add(toSongDTO(currentSong, i, currentSip.getAddDate()));
            }
        }

        return new PlaylistDTO(
                playlistEntity.getPlaylistId(),
                playlistEntity.getPlaylistName(),
                playlistEntity.getDescription(),
                playlistEntity.getVisibility(),
                playlistEntity.getSorting(),
                songDTOs,
                playlistEntity.getNumberOfSongs(),
                playlistEntity.getPlaytime(),
                (playlistEntity.getCoverFile() != null)
                        ? ConfigHolder.getBackendUrl() + "/api/v1/playlists/" + playlistEntity.getPlaylistId() + "/cover"
                        : playlistEntity.getCoverUrl(),
                Mapper.mapLocalDateTimeToString(addDate)
        );
    }

    /**
     * Maps a {@link PlaylistDTO} to a {@link PlaylistEntity}.
     * It does NOT carry over the playlistId!
     * Reconstructs song-playlist relationships and handles ID setting.
     *
     * @param playlistDTO the DTO to map
     * @return the mapped PlaylistEntity or {@code null} if input is {@code null}
     */
    public static PlaylistEntity toPlaylistEntity(PlaylistDTO playlistDTO) {
        if (playlistDTO == null) {
            return null;
        }

        PlaylistEntity playlistEntity = new PlaylistEntity(
                playlistDTO.playlistName(),
                playlistDTO.description(),
                playlistDTO.coverUrl(),
                playlistDTO.visibility(),
                playlistDTO.sorting()
        );

        if (playlistDTO.songs() != null) {
            for (SongDTO songDTO : playlistDTO.songs()) {
                SongInPlaylistEntity newRelation = new SongInPlaylistEntity(
                        mapStringToLocalDateTime(songDTO.addDate()),
                        playlistEntity,
                        toSongEntity(songDTO));
                playlistEntity.getSongs().add(newRelation);
            }
        }

        return playlistEntity;
    }

}
