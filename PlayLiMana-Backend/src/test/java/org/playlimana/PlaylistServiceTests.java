package org.playlimana;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.playlimana.auth.UserProvider;
import org.playlimana.model.Sorting;
import org.playlimana.model.Visibility;
import org.playlimana.model.dto.PlaylistDTO;
import org.playlimana.model.entity.PlaylistEntity;
import org.playlimana.model.entity.PlaylistInLibraryEntity;
import org.playlimana.model.entity.UserAccountEntity;
import org.playlimana.model.repository.CoverFileRepository;
import org.playlimana.model.repository.PlaylistRepository;
import org.playlimana.model.repository.SongRepository;
import org.playlimana.service.PlaylistService;
import org.playlimana.service.SongService;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class PlaylistServiceTests {
    private PlaylistService playlistService;
    private PlaylistRepository playlistRepository;
    private CoverFileRepository coverFileRepository;
    private SongService songService;
    private SongRepository songRepository;
    private UserProvider userProvider;
    private UserAccountEntity user;
    private PlaylistEntity playlistEntity;

    @BeforeEach
    public void setUp() {
        playlistRepository = Mockito.mock(PlaylistRepository.class);
        coverFileRepository = Mockito.mock(CoverFileRepository.class);
        songRepository = Mockito.mock(SongRepository.class);

        songService = new SongService(songRepository);
        userProvider = Mockito.mock(UserProvider.class);

        playlistService = new PlaylistService(playlistRepository, coverFileRepository, songService, userProvider);

        user = Mockito.mock(UserAccountEntity.class);
    }

    @AfterEach
    public void tearDown() {
        playlistRepository = null;
        coverFileRepository = null;
        songRepository = null;
        userProvider = null;
        user = null;
        playlistService = null;
        songService = null;
    }

    @Test
    void testGetPlaylists_UserLoggedIn_ReturnsPlaylists() {
        PlaylistEntity playlist = Mockito.mock(PlaylistEntity.class);
        PlaylistInLibraryEntity pil = Mockito.mock(PlaylistInLibraryEntity.class);

        when(pil.getPlaylist()).thenReturn(playlist);
        when(pil.getAddDate()).thenReturn(LocalDateTime.of(2025, 6, 23, 0, 0));
        when(user.getPlaylistsInLibrary()).thenReturn(List.of(pil));
        when(userProvider.getUser()).thenReturn(user);

        List<PlaylistDTO> result = playlistService.getPlaylists();

        assertEquals(1, result.size());
    }

    @Test
    void testGetPlaylists_NotLoggedIn_ReturnsEmptyList() {
        when(userProvider.getUser()).thenReturn(null);
        List<PlaylistDTO> result = playlistService.getPlaylists();
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetLibrary_ReturnsValidJson() {
        when(userProvider.getUser()).thenReturn(user);
        PlaylistInLibraryEntity pil = Mockito.mock(PlaylistInLibraryEntity.class);
        when(pil.getPlaylist()).thenReturn(Mockito.mock(PlaylistEntity.class));
        when(pil.getAddDate()).thenReturn(LocalDateTime.now());
        when(user.getPlaylistsInLibrary()).thenReturn(List.of(pil));

        String json = playlistService.getLibrary();

        assertTrue(json.startsWith("["));
    }

    @Test
    void editPlaylist_ShouldReturnNull_WhenPlaylistDTOIsNull() {
        PlaylistDTO result = playlistService.editPlaylist(1L, null);
        assertNull(result);
    }

    @Test
    void editPlaylist_ShouldReturnNull_WhenIdMismatch() {
        PlaylistDTO wrongIdDto = new PlaylistDTO(99L, "Name", "Desc",
                Visibility.PUBLIC, Sorting.CUSTOM, List.of(), 0, 0, "cover URL", "addDate");
        PlaylistDTO result = playlistService.editPlaylist(1L, wrongIdDto);
        assertNull(result);
    }

    @Test
    void changePlaylistSongOrder_ShouldReturnNull_WhenInvalidData() {
        PlaylistDTO dto = new PlaylistDTO(2L, "Wrong ID", "Desc",
                Visibility.PUBLIC, Sorting.CUSTOM, List.of(), 0, 0, "cover URL", "  ");
        PlaylistDTO result = playlistService.changePlaylistSongOrder(1L, dto);
        assertNull(result);
    }

}
