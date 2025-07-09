package org.playlimana.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.playlimana.auth.UserProvider;
import org.playlimana.model.Sorting;
import org.playlimana.model.Visibility;
import org.playlimana.model.dto.PlaylistDTO;
import org.playlimana.model.dto.SongDTO;
import org.playlimana.model.entity.*;
import org.playlimana.model.repository.CoverFileRepository;
import org.playlimana.model.repository.PlaylistRepository;
import org.playlimana.utils.Mapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@ApplicationScoped
public class PlaylistService {

    private static final Logger logger = LoggerFactory.getLogger(PlaylistService.class);

    private final PlaylistRepository playlistRepository;
    private final CoverFileRepository coverFileRepository;
    private final SongService songService;

    private static final String VALID_CHARACTERS_REGEX = "^[\\p{L}\\p{N} _\\-\\.\\u2000-\\u206F\\u2B50\\u2600-\\u26FF]*$";
    private static final int MAX_LEN_NAME = 100;
    private static final int MAX_LEN_DESCRIPTION = 250;
    private final UserProvider userProvider;

    @Inject
    public PlaylistService(PlaylistRepository playlistRepository,
                           CoverFileRepository coverFileRepository,
                           SongService songService, UserProvider userProvider) {
        this.playlistRepository = playlistRepository;
        this.coverFileRepository = coverFileRepository;
        this.songService = songService;
        this.userProvider = userProvider;
    }

    @Transactional
    @WithSpan
    public List<PlaylistDTO> getPlaylists() {
        UserAccountEntity user = userProvider.getUser();

        if (user == null) {
            logger.info("Not logged in, no library");
            return new ArrayList<>();
        }

        List<PlaylistDTO> playlistDTOS = new ArrayList<>();

        for (PlaylistInLibraryEntity pil : user.getPlaylistsInLibrary()) {
            playlistDTOS.add(Mapper.toPlaylistDTO(pil.getPlaylist(), pil.getAddDate()));
        }

        logger.info("library contains {} playlists", playlistDTOS.size());
        return playlistDTOS;
    }

    @Transactional
    @WithSpan
    public String getLibrary() {
        List<PlaylistDTO> playlists = getPlaylists();

        try {
            ObjectWriter ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
            // immediately returning the value instead of assigning it to a variable with no other use (sonarqube)
            return ow.writeValueAsString(playlists);
        } catch (JsonProcessingException e) {
            logger.error("library couldn't be processed as JSON: {}", e.getMessage());
            return "";
        }
    }

    @Transactional
    @WithSpan
    public PlaylistDTO getPlaylistDTO(Long playlistId) {
        PlaylistEntity playlist = getPlaylist(playlistId);

        // added condition to prevent NullPointerException (sonarqube)
        if (isAccessToPlaylistDenied(playlist)) {
            return null;
        } else {
            return Mapper.toPlaylistDTO(playlist, Objects.requireNonNull(playlist).getAddDate(userProvider.getUser()));
        }
    }


    @Transactional
    @WithSpan
    public PlaylistDTO createPlaylist(PlaylistDTO playlistDTO) {
        if (playlistDTO == null
                || !isPlaylistNameValid(playlistDTO.playlistName())
                || !isPlaylistDescriptionValid(playlistDTO.description())) {
            logger.error("playlist couldn't be created because it has invalid data (null, name, playlist)");
            return null;
        }

        UserAccountEntity user = userProvider.getUser();
        if (user == null) {
            logger.error("Playlist {} couldn't be created because user is not logged in", playlistDTO.playlistName());
            return null;
        }

        for (SongDTO song : playlistDTO.songs()) {
            songService.createSong(song); // make sure that all songs exist in database
        }

        PlaylistEntity playlistEntity = Mapper.toPlaylistEntity(playlistDTO);
        playlistRepository.persist(playlistEntity);
        LocalDateTime addDate = persistPilRelation(playlistEntity, user);
        logger.info("Playlist {} created", playlistDTO.playlistName());
        return Mapper.toPlaylistDTO(playlistEntity, addDate);
    }

    @Transactional
    @WithSpan
    public PlaylistDTO copyPlaylist(Long originalPlaylistId) {
        PlaylistEntity originalPlaylist = getPlaylist(originalPlaylistId);

        // added condition playlist != null to prevent NullPointerException (sonarqube)
        if (isAccessToPlaylistDenied(originalPlaylist) && originalPlaylist != null) {
            logger.error("Playlist {} couldn't be copied because access is denied", originalPlaylist.getPlaylistName());
            return null;
        }

        // added condition originalplaylist != null to preven NullPointerException (sonarqube)
        // + if statement and error to prevent issues (sonarqube)
        PlaylistEntity copy;
        if (originalPlaylist != null) {
            copy = new PlaylistEntity(originalPlaylist);
            playlistRepository.persist(copy); // gives copy an ID

            for (SongInPlaylistEntity sip : originalPlaylist.getSongs()) {
                SongInPlaylistEntity newRelation
                        = new SongInPlaylistEntity(sip.getAddDate(), copy, sip.getSong());
                copy.getSongs().add(newRelation);
            }

            LocalDateTime addDate = persistPilRelation(copy, userProvider.getUser());
            logger.info("playlist {} with ID {} was copied to ID {}",
                    originalPlaylist.getPlaylistName(), originalPlaylistId, copy.getPlaylistId());
            return Mapper.toPlaylistDTO(copy, addDate);
        } else {
            logger.error("Playlist was null");
            return null;
        }

    }


    @Transactional
    @WithSpan
    public boolean deletePlaylist(Long playlistId) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity)) {
            logger.error("couldn't delete playlist with ID {} because access is denied", playlistEntity);
            return false;
        }

        playlistRepository.delete(playlistEntity); // SongInPlaylist and PlaylistInLibrary entities are deleted automatically
        logger.info("playlist {} was deleted", playlistEntity.getPlaylistName());
        return true;
    }


    @Transactional
    @WithSpan
    public boolean addPlaylistToLibrary(Long playlistId) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity)) {
            logger.error("couldn't add playlist with ID {} to library because access is denied", playlistEntity);
            return false;
        } else {
            persistPilRelation(playlistEntity, userProvider.getUser());
            logger.info("playlist {} was added to library of user {}", playlistEntity.getPlaylistName(), userProvider.getUser().getUsername());
            return true;
        }
    }


    @Transactional
    @WithSpan
    public boolean removePlaylistFromLibrary(Long playlistId) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity)) {
            logger.error("couldn't remove playlist with ID {} from library because access is denied", playlistEntity);
            return false;
        } else {

            Optional<PlaylistInLibraryEntity> playlistToRemove = userProvider.getUser().getPlaylistsInLibrary().stream()
                    .filter(pil -> pil.getPlaylist().getPlaylistId().equals(playlistId))
                    .findFirst();

            if (playlistToRemove.isPresent()) {
                userProvider.getUser().getPlaylistsInLibrary().remove(playlistToRemove.get());
                playlistEntity.getInLibraries().remove(playlistToRemove.get());
                playlistToRemove.get().delete();
                logger.info("playlist {} was removed from library of user {}", playlistEntity.getPlaylistName(), userProvider.getUser().getUsername());
                return true;
            } else {
                logger.error("playlist {} couldn't be removed from library of user {}", playlistEntity.getPlaylistName(), userProvider.getUser().getUsername());
                return false;
            }
        }
    }


    @Transactional
    public PlaylistDTO editPlaylist(Long playlistId, PlaylistDTO playlistDTO) {
        if (playlistDTO == null) {
            logger.error("playlist couldn't be edited because nothing was sent");
            return null;
        }

        if (playlistId != playlistDTO.playlistId()) {
            logger.error("playlist will not be edited because IDs don't match");
            return null;
        }

        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity)) {
            logger.error("playlist couldn't be edited because access is denied");
            return null;
        }

        if (isPlaylistNameValid(playlistDTO.playlistName())
                && isPlaylistDescriptionValid(playlistDTO.description())
                && playlistDTO.visibility() != null
                && playlistDTO.sorting() != null) {

            playlistEntity.setPlaylistName(playlistDTO.playlistName());
            playlistEntity.setDescription(playlistDTO.description());
            playlistEntity.setVisibility(playlistDTO.visibility());
            playlistEntity.setSorting(playlistDTO.sorting());

            logger.info("playlist {} edited", playlistDTO.playlistName());
            return Mapper.toPlaylistDTO(playlistEntity, playlistEntity.getAddDate(userProvider.getUser()));

        } else {
            logger.error("playlist couldn't be edited because the new data (name, description, " +
                    "visibility or sorting) is invalid");
            return null;
        }
    }


    @Transactional
    @WithSpan
    public PlaylistDTO addSongToPlaylist(Long playlistId, SongDTO songDTO) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity) || songDTO == null) {
            logger.error("song couldn't be added to playlist because access is denied or song doesn't exist");
            return null;
        }

        SongEntity songEntity = songService.createSong(songDTO); // gets song if it exists or creates song before returning it
        SongInPlaylistEntity newRelation
                = new SongInPlaylistEntity(LocalDateTime.now(), playlistEntity, songEntity);
        playlistEntity.getSongs().add(newRelation);
        logger.info("song {} was added to playlist {}", songEntity.getTitle(), playlistEntity.getPlaylistName());
        return Mapper.toPlaylistDTO(playlistEntity, playlistEntity.getAddDate(userProvider.getUser()));
    }


    @Transactional
    @WithSpan
    public PlaylistDTO removeSongFromPlaylist(Long playlistId, Long songId, int songPositionInPlaylist) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity) || songId == null) {
            logger.error("song with ID {} couldn't be removed from playlist with ID {} because " +
                    "access is denied or song doesn't exist", songId, playlistId);
            return null;
        }

        Optional<SongInPlaylistEntity> songToRemove = playlistEntity.getSongs().stream()
                .filter(sip -> sip.getSong().getSongId().equals(songId)
                        && playlistEntity.getSongs().indexOf(sip) == songPositionInPlaylist)
                .findFirst();

        if (songToRemove.isPresent()) {
            playlistEntity.getSongs().remove(songToRemove.get());
            logger.info("song {} was removed from playlist {}",
                    songToRemove.get().getSong().getTitle(), playlistEntity.getPlaylistName());
            return Mapper.toPlaylistDTO(playlistEntity, playlistEntity.getAddDate(userProvider.getUser()));
        } else {
            logger.warn("song with ID {} wasn't removed fom playlist {} because it didn't contain the song",
                    songId, playlistEntity.getPlaylistName());
            return null;
        }
    }


    @Transactional
    @WithSpan
    public PlaylistDTO changePlaylistSongOrder(Long playlistId, PlaylistDTO playlistDTO) {
        if (playlistDTO == null) {
            logger.error("couldn't change song order because of invalid data");
            return null;
        }

        if (playlistId != playlistDTO.playlistId()) {
            logger.error("playlist song order will not be edited because IDs don't match");
            return null;
        }

        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity)) {
            logger.error("couldn't change song order of playlist with ID {}" +
                    "because access is denied", playlistId);
            return null;
        }

        PlaylistEntity playlistWithNewOrder = Mapper.toPlaylistEntity(playlistDTO);

        if (playlistEntity.getSongs().size() != playlistDTO.numberOfSongs()
                || playlistEntity.getSongs().size() != playlistWithNewOrder.getSongs().size()) {
            logger.error("couldn't change song order because the new song order contains fewer or " +
                    "more songs than the old one");
            return null;
        }

        playlistEntity.setSongs(playlistWithNewOrder.getSongs());
        return Mapper.toPlaylistDTO(playlistEntity, playlistEntity.getAddDate(userProvider.getUser()));
    }


    @Transactional
    @WithSpan
    public PlaylistDTO changePlaylistName(Long playlistId, String newPlaylistName) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity) || !isPlaylistNameValid(newPlaylistName)) {
            logger.error("playlist couldn't be renamed because it doesn't exist, access is denied or the new name is invalid");
            return null;
        }

        if (playlistEntity.getPlaylistName().equals(newPlaylistName)) {
            logger.info("playlist wasn't renamed because old name equals new name");
        } else {
            playlistEntity.setPlaylistName(newPlaylistName);
            logger.info("Playlist with Id: {} renamed to {}", playlistId, newPlaylistName);
        }
        return Mapper.toPlaylistDTO(playlistEntity, playlistEntity.getAddDate(userProvider.getUser()));
    }


    @Transactional
    @WithSpan
    public PlaylistDTO changePlaylistDescription(Long playlistId, String newPlaylistDescription) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity) || !isPlaylistDescriptionValid(newPlaylistDescription)) {
            logger.error("playlist's description couldn't be changed because playlist doesn't exist, access is denied or the new description is invalid");
            return null;
        }

        if (playlistEntity.getDescription().equals(newPlaylistDescription)) {
            logger.info("playlist's description wasn't renamed because old one equals new one");
        } else {
            playlistEntity.setDescription(newPlaylistDescription);
            logger.info("Playlist with Id: {} changed description to {}", playlistId, newPlaylistDescription);
        }
        return Mapper.toPlaylistDTO(playlistEntity, playlistEntity.getAddDate(userProvider.getUser()));
    }


    @Transactional
    @WithSpan
    public PlaylistDTO changePlaylistVisibility(Long playlistId, Visibility visibility) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity)) {
            logger.error("visibility of playlist couldn't be changed because it doesn't exist or access is denied");
            return null;
        }

        if (playlistEntity.getVisibility() == visibility) {
            logger.info("playlist's visibility wasn't changed because old one equals new one");
        } else {
            playlistEntity.setVisibility(visibility);
            logger.info("visibility of playlist {} was changed to {}", playlistId, visibility);
        }
        return Mapper.toPlaylistDTO(playlistEntity, playlistEntity.getAddDate(userProvider.getUser()));
    }


    @Transactional
    @WithSpan
    public PlaylistDTO changePlaylistSorting(Long playlistId, Sorting sorting) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity)) {
            logger.error("sorting of playlist couldn't be changed because it doesn't exist or access is denied");
            return null;
        }

        if (playlistEntity.getSorting() == sorting) {
            logger.info("playlist's sorting wasn't changed because old one equals new one");
        } else {
            playlistEntity.setSorting(sorting);
            logger.info("sorting of playlist {} was changed to {}", playlistId, sorting);
        }

        return Mapper.toPlaylistDTO(playlistEntity, playlistEntity.getAddDate(userProvider.getUser()));
    }


    @Transactional
    @WithSpan
    public CoverFileEntity getPlaylistCover(Long playlistId) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity)) {
            logger.error("cover of playlist couldn't be found because it doesn't exist or access is denied");
            return null;
        }

        return playlistEntity.getCoverFile();
    }


    @Transactional
    @WithSpan
    public PlaylistDTO changePlaylistCover(Long playlistId, InputStream file, String contentType) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity)) {
            logger.error("cover of playlist couldn't be changed because it doesn't exist or acces is denied");
            return null;
        }

        try {
            byte[] bytes = file.readAllBytes();

            // Remove old cover file if it exists
            CoverFileEntity oldCover = playlistEntity.getCoverFile();
            if (oldCover != null) {
                coverFileRepository.delete(oldCover);
            }

            // Create and persist new cover file
            CoverFileEntity newCover = new CoverFileEntity();
            newCover.setContentType(contentType);
            newCover.setData(bytes);
            newCover.setPlaylist(playlistEntity);
            coverFileRepository.persist(newCover);
            playlistEntity.setCoverFile(newCover);
        } catch (IOException e) {
            logger.error("Failed to read cover image data: {}", e.getMessage());
            return null;
        }
        return Mapper.toPlaylistDTO(playlistEntity, playlistEntity.getAddDate(userProvider.getUser()));
    }


    @Transactional
    @WithSpan
    public PlaylistDTO deletePlaylistCover(Long playlistId) {
        PlaylistEntity playlistEntity = getPlaylist(playlistId);

        if (isAccessToPlaylistDenied(playlistEntity)) {
            logger.error("cover of playlist couldn't be deleted because it doesn't exist or access is denied");
            return null;
        }

        coverFileRepository.delete(playlistEntity.getCoverFile());
        playlistEntity.setCoverFile(null);
        return Mapper.toPlaylistDTO(playlistEntity, playlistEntity.getAddDate(userProvider.getUser()));
    }

    @Transactional
    public List<PlaylistDTO> getPublicPlaylists() {
        LocalDateTime now = LocalDateTime.now();
        return playlistRepository.listAll().stream()
                .filter(p -> p.getVisibility() == Visibility.PUBLIC)// only public playlists
                .map(p -> Mapper.toPlaylistDTO(p, now)) // map each Playlist to PlaylistDTO
                .toList(); // changed from .collect(Collectors.toList()) to ensure list is unmodified (sonarqube)
    }

    /* Helper */

    private boolean isPlaylistNameValid(String playlistName) {
        logger.info("checking playlist name...");
        if (playlistName == null || playlistName.isBlank()) {
            logger.error("playlistName is null or blank");
            return false;
        }
        return isStringValid(playlistName, MAX_LEN_NAME);
    }

    private boolean isPlaylistDescriptionValid(String description) {
        logger.info("checking playlist description...");
        return isStringValid(description, MAX_LEN_DESCRIPTION);
    }

    private boolean isStringValid(String string, int characterLimit) {
        if (string.length() > characterLimit) {
            logger.error("string has too many characters");
            return false;
        }

        boolean success = string.matches(VALID_CHARACTERS_REGEX);
        if (!success) {
            logger.error("string contains invalid characters: {}", string);
        }
        return success;
    }

    private boolean isAccessToPlaylistDenied(PlaylistEntity playlist) {
        UserAccountEntity user = userProvider.getUser();

        if (playlist == null) {
            logger.error("PlaylistEntity is null, playlist not found");
            return true;
        }

        if (playlist.getVisibility() != Visibility.PRIVATE) {
            return false;
        }

        if (user == null) {
            logger.error("Access denied: user is null");
            return true;
        }
        boolean hasAccess = user.getPlaylistsInLibrary().stream()
                .anyMatch(pil -> pil.getPlaylist().equals(playlist));

        if (!hasAccess) {
            logger.error("Access denied to playlist {}", playlist.getPlaylistName());
        }

        return !hasAccess;
    }

    private PlaylistEntity getPlaylist(Long playlistId) {
        if (playlistId == null) {
            logger.error("playlistId was null");
            return null;
        } else {
            logger.info("Searching for playlist with ID {}", playlistId);
            return playlistRepository.findById(playlistId);
        }
    }

    private LocalDateTime persistPilRelation(PlaylistEntity playlist, UserAccountEntity user) {
        Optional<PlaylistInLibraryEntity> existingRelation = user.getPlaylistsInLibrary().stream()
                .filter(pil -> pil.getPlaylist().equals(playlist))
                .findFirst();

        if (existingRelation.isPresent()) {
            logger.warn("Playlist {} already in user's library", playlist.getPlaylistName());
            return existingRelation.get().getAddDate();
        } else {
            LocalDateTime addDate = LocalDateTime.now();
            PlaylistInLibraryEntity pil = new PlaylistInLibraryEntity(addDate, playlist, user);
            user.getPlaylistsInLibrary().add(pil);
            playlist.getInLibraries().add(pil);
            pil.persist();
            return addDate;
        }
    }

}

