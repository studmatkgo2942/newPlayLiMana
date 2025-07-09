package org.playlimana;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.playlimana.model.dto.SongDTO;
import org.playlimana.model.entity.SongEntity;
import org.playlimana.model.repository.SongRepository;
import org.playlimana.service.SongService;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SongServiceTests {

    SongRepository songRepository;

    SongService songService;

    static final Long VALID_SONG_ID = 1L;
    static final Long PLAYTIME = 210L;
    static final int POSITION_IN_PLAYLIST = 1;

    SongDTO validSongDTO;

    SongEntity existingSong;

    String releaseDate = "2025-06-25";
    String addDate = "2025-06-25";


    @BeforeEach
    void setUp() {
        songRepository = mock(SongRepository.class);
        songService = new SongService(songRepository);

        validSongDTO = new SongDTO(VALID_SONG_ID, "Test Song", List.of("Artist 1"),
                "Album 1", List.of("Rock"), PLAYTIME, releaseDate, List.of("URL"),
                "cover URL", POSITION_IN_PLAYLIST, addDate);
        existingSong = new SongEntity();
        existingSong.setSongId(1L);
        existingSong.setTitle("Test Song");
        existingSong.setArtist(List.of("Artist 1"));
        existingSong.setAlbum("Album 1");
        existingSong.setGenres(List.of("Rock"));
        existingSong.setPlaytime(PLAYTIME);
        existingSong.setReleaseDate(LocalDate.parse(releaseDate));
        existingSong.setLinksForWebPlayer(List.of("URL"));
        existingSong.setCoverUrl("cover URL");
    }

    @AfterEach
    void tearDown() {
        songRepository = null;
        songService = null;
        validSongDTO = null;
    }

    @Test
    void testGetSong_WithValidId_ReturnsSong() {
        when(songRepository.findById(VALID_SONG_ID)).thenReturn(existingSong);

        SongEntity result = songService.getSong(VALID_SONG_ID);

        assertNotNull(result);
        assertEquals("Test Song", result.getTitle());
    }

    @Test
    void testGetSong_WithNullId_ReturnsNull() {
        SongEntity result = songService.getSong(null);
        assertNull(result);
        verify(songRepository, never()).findById(any());
    }

    @Test
    void testCreateSong_WithExistingSong_ReturnsExisting() {
        when(songRepository.findById(VALID_SONG_ID)).thenReturn(existingSong);

        SongEntity result = songService.createSong(validSongDTO);

        assertNotNull(result);
        assertEquals(existingSong, result);
        verify(songRepository, never()).persist((SongEntity) any());
    }

    @Test
    void testCreateSong_WithNullDTO_ReturnsNull() {
        SongEntity result = songService.createSong(null);
        assertNull(result);
        verify(songRepository, never()).persist((SongEntity) any());
    }

    @Test
    void testCreateSong_WithBlankTitle_ReturnsNull() {
        SongDTO dto = new SongDTO(VALID_SONG_ID, "   ", List.of("Artist 1"),
                "Album 1", List.of("Rock"), PLAYTIME, releaseDate, List.of("URL"),
                "cover URL", POSITION_IN_PLAYLIST, addDate);
        SongEntity result = songService.createSong(dto);
        assertNull(result);
        verify(songRepository, never()).persist((SongEntity) any());
    }

    @Test
    void testCreateSong_WithEmptyArtists_ReturnsNull() {
        SongDTO dto = new SongDTO(VALID_SONG_ID, "Test Song", List.of(),
                "Album 1", List.of("Rock"), PLAYTIME, releaseDate, List.of("URL"),
                "cover URL", POSITION_IN_PLAYLIST, addDate);
        SongEntity result = songService.createSong(dto);
        assertNull(result);
        verify(songRepository, never()).persist((SongEntity) any());
    }
}
