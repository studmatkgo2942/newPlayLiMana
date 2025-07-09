package org.playlimana;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.playlimana.model.Sorting;
import org.playlimana.model.Visibility;
import org.playlimana.model.databasekey.PlaylistInLibraryKey;
import org.playlimana.model.databasekey.SongInPlaylistKey;
import org.playlimana.model.entity.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class EntityAndKeyTests {

    private PlaylistEntity playlistEntity;
    private static final long PLAYLIST_ID = 1;
    private CoverFileEntity coverFileEntity;
    private PlaylistInLibraryEntity playlistInLibraryEntity;
    private SongEntity songEntity;
    private static final long SONG_ID = 1;
    private static final long PLAYTIME = 210;
    private List<String> artists;
    private List<String> genres;
    private LocalDate releaseDate;
    private List<String> linksForWebPlayer;
    private SongInPlaylistEntity songInPlaylistEntity;
    private List<SongInPlaylistEntity> songInPlaylistEntityList;
    private List<PlaylistInLibraryEntity> playlistInLibraryEntityList;
    private PlaylistEntity playlistEntity2;
    private LocalDateTime addDate;
    private SongInPlaylistKey songInPlaylistKey;
    private SongInPlaylistEntity songInPlaylistEntity2;
    private SongEntity songEntity2;
    private byte[] data;
    private PlaylistEntity playlistEntity3;
    private UserAccountEntity userAccountEntity;
    private UserAccountEntity userAccountEntity2;
    private PlaylistInLibraryKey playlistInLibraryKey;
    private PlaylistInLibraryEntity playlistInLibraryEntity2;
    private PlaylistInLibraryKey playlistInLibraryKey2;
    private SongInPlaylistKey songInPlaylistKey2;

    @BeforeEach
    void setUp() {
        // setUp for playlistEntity
        playlistEntity = new PlaylistEntity("Playlist 1", "Description of Playlist 1",
                "CoverURL", Visibility.PRIVATE, Sorting.ALBUM);
        playlistEntity.setPlaylistId(PLAYLIST_ID);

        // setUp for songEntity
        artists = new ArrayList<>(List.of("Artist 1"));
        genres = new ArrayList<>(List.of("Rock"));
        releaseDate = LocalDate.of(2025, 6, 1);
        linksForWebPlayer = new ArrayList<>(List.of("Web Player URL"));
        songEntity = new SongEntity("Song 1", artists, "Album 1", genres, PLAYTIME, releaseDate, linksForWebPlayer);
        songEntity.setCoverUrl("Cover URL");
        songEntity.setSongId(SONG_ID);

        // setUp for songEntity2
        songEntity2 = new SongEntity();
        songEntity2.setSongId(SONG_ID);
        songEntity2.setTitle("Song 2");
        songEntity2.setArtist(artists);
        songEntity2.setAlbum("Album 2");
        songEntity2.setGenres(genres);
        songEntity2.setPlaytime(PLAYTIME);
        songEntity2.setReleaseDate(releaseDate);
        songEntity2.setLinksForWebPlayer(linksForWebPlayer);
        songEntity2.setCoverUrl("Cover URL 2");

        // setUp for songInPlaylistEntity
        addDate = LocalDateTime.of(2025, 6, 1, 0, 0, 0);
        songInPlaylistKey = new SongInPlaylistKey(SONG_ID, PLAYLIST_ID);
        songInPlaylistEntity = new SongInPlaylistEntity();
        songInPlaylistEntity.setSongInPlaylistKey(songInPlaylistKey);
        songInPlaylistEntity.setAddDate(addDate);
        songInPlaylistEntity.setPlaylist(playlistEntity);
        songInPlaylistEntity.setSong(songEntity);

        // setUp for songInPlaylistEntity2
        songInPlaylistEntity2 = new SongInPlaylistEntity(addDate, playlistEntity, songEntity);
        songInPlaylistEntity2.setSongInPlaylistKey(songInPlaylistKey);

        // setUp for coverFileEntity
        data = new byte[] {1, 2};
        coverFileEntity = new CoverFileEntity();
        coverFileEntity.setData(data);
        coverFileEntity.setContentType("image/jpeg");
        coverFileEntity.setPlaylist(playlistEntity);

        // setUp for playlistInLibraryEntity
        playlistInLibraryKey = new PlaylistInLibraryKey(PLAYLIST_ID, "uid1");
        playlistInLibraryEntity = new PlaylistInLibraryEntity();
        playlistInLibraryEntity.setPlaylistInLibraryKey(playlistInLibraryKey);
        playlistInLibraryEntity.setAddDate(addDate);
        playlistInLibraryEntity.setPlaylist(playlistEntity);

        // setUp for userAccountEntity
        playlistInLibraryEntityList = new ArrayList<>(List.of(playlistInLibraryEntity));
        userAccountEntity = new UserAccountEntity();
        userAccountEntity.setUid("uid1");
        userAccountEntity.setUsername("user1");
        userAccountEntity.setServiceName1("Spotify");
        userAccountEntity.setAccountId1("accountId1");
        userAccountEntity.setAuthToken1("auth1");
        userAccountEntity.setServiceName2("Tidal");
        userAccountEntity.setAccountId2("accountId2");
        userAccountEntity.setAuthToken2("auth2");
        userAccountEntity.setServiceName3("SoundCloud");
        userAccountEntity.setAccountId3("accountId3");
        userAccountEntity.setAuthToken3("auth3");
        userAccountEntity.setPlaylistsInLibrary(playlistInLibraryEntityList);

        // setUp for userAccountEntity2
        userAccountEntity2 = new UserAccountEntity("uid2", "user2");

        // setUp for playlistInLibraryEntity2
        playlistInLibraryEntity2 = new PlaylistInLibraryEntity(addDate, playlistEntity, userAccountEntity);

        songInPlaylistEntityList = new ArrayList<>(List.of(songInPlaylistEntity));
        playlistEntity.setCoverFile(coverFileEntity);
        playlistEntity.setSongs(songInPlaylistEntityList);
        playlistEntity.setInLibraries(playlistInLibraryEntityList);
        songEntity.setPlaylists(songInPlaylistEntityList);
        songEntity2.setPlaylists(songInPlaylistEntityList);
        playlistInLibraryEntity.setUserAccount(userAccountEntity);

        // setUp for playlistEntity2
        playlistEntity2 = new PlaylistEntity(playlistEntity);

        // setUp for playlistEntity3
        playlistEntity3 = new PlaylistEntity();
        playlistEntity3.setPlaylistId(PLAYLIST_ID);
        playlistEntity3.setPlaylistName("Playlist 3");
        playlistEntity3.setDescription("Description of Playlist 3");
        playlistEntity3.setCoverUrl("Cover URL 3");
        playlistEntity3.setCoverFile(coverFileEntity);
        playlistEntity3.setVisibility(Visibility.PRIVATE);
        playlistEntity3.setSorting(Sorting.ALBUM);
        playlistEntity3.setSongs(null);
        playlistEntity3.setInLibraries(null);

        // setUp for playlistInLibraryKey2
        playlistInLibraryKey2 = new PlaylistInLibraryKey();
        playlistInLibraryKey2.setPlaylistId(PLAYLIST_ID);
        playlistInLibraryKey2.setUserAccountId("uid1");

        // setUp for songInPlaylistKey2
        songInPlaylistKey2 = new SongInPlaylistKey();
        songInPlaylistKey2.setPlaylistId(PLAYLIST_ID);
        songInPlaylistKey2.setSongId(SONG_ID);
    }

    @AfterEach
    void tearDown() {

        playlistEntity = null;
        coverFileEntity = null;
        playlistInLibraryEntity = null;
        songEntity = null;
        artists = null;
        genres = null;
        releaseDate = null;
        linksForWebPlayer = null;
        songInPlaylistEntity = null;
        songInPlaylistEntityList = null;
        playlistInLibraryEntityList = null;
        playlistEntity2 = null;
        addDate = null;
        songInPlaylistKey = null;
        songInPlaylistEntity2 = null;
        songEntity2 = null;
        data = null;
        playlistEntity3 = null;
        userAccountEntity = null;
        userAccountEntity2 = null;
        playlistInLibraryKey = null;
        playlistInLibraryEntity2 = null;
        playlistInLibraryKey2 = null;
        songInPlaylistKey2 = null;

    }

    @Test
    void testPlaylistInLibraryKey(){

        assertEquals(PLAYLIST_ID, playlistInLibraryKey2.getPlaylistId());
        assertEquals("uid1", playlistInLibraryKey2.getUserAccountId());
        assertEquals(playlistInLibraryKey, playlistInLibraryKey2);
        assertEquals(playlistInLibraryKey.hashCode(), playlistInLibraryKey2.hashCode());
    }

    @Test
    void testSongInPlaylistKey(){

        assertEquals(PLAYLIST_ID, songInPlaylistKey2.getPlaylistId());
        assertEquals(SONG_ID, songInPlaylistKey2.getSongId());
        assertEquals(songInPlaylistKey, songInPlaylistKey2);
        assertEquals(songInPlaylistKey.hashCode(), songInPlaylistKey2.hashCode());
    }

    @Test
    void testCoverFileEntity(){

        coverFileEntity.setPlaylist(playlistEntity);
        assertNull(coverFileEntity.getCoverFileId());
        assertEquals(data, coverFileEntity.getData());
        assertEquals("image/jpeg", coverFileEntity.getContentType());
        assertEquals(playlistEntity, coverFileEntity.getPlaylist());

    }

    @Test
    void testPlaylistEntity(){
        // asserts for playlistEntity
        assertEquals(PLAYLIST_ID, playlistEntity.getPlaylistId());
        assertEquals("Playlist 1", playlistEntity.getPlaylistName());
        assertEquals("Description of Playlist 1", playlistEntity.getDescription());
        assertEquals("CoverURL", playlistEntity.getCoverUrl());
        assertEquals(coverFileEntity, playlistEntity.getCoverFile());
        assertEquals(Visibility.PRIVATE, playlistEntity.getVisibility());
        assertEquals(Sorting.ALBUM, playlistEntity.getSorting());
        assertEquals(songInPlaylistEntityList, playlistEntity.getSongs());
        assertEquals(playlistInLibraryEntityList, playlistEntity.getInLibraries());
        assertEquals(1, playlistEntity.getNumberOfSongs());
        assertEquals(PLAYTIME, playlistEntity.getPlaytime());
        assertNull(playlistEntity.getAddDate(userAccountEntity2));

        // asserts for playlistEntity2
        assertNull(playlistEntity2.getPlaylistId());
        assertEquals("Playlist 1", playlistEntity2.getPlaylistName());
        assertEquals("Description of Playlist 1", playlistEntity2.getDescription());
        assertEquals("CoverURL", playlistEntity2.getCoverUrl());
        assertNull(playlistEntity2.getCoverFile());
        assertEquals(Visibility.PRIVATE, playlistEntity2.getVisibility());
        assertEquals(Sorting.ALBUM, playlistEntity2.getSorting());
        assertEquals(new ArrayList<>(), playlistEntity2.getSongs());
        assertEquals(new ArrayList<>(), playlistEntity2.getInLibraries());

    }

    @Test
    void testPlaylistEntity3(){


        // asserts for playlistEntity3
        assertEquals(PLAYLIST_ID, playlistEntity3.getPlaylistId());
        assertEquals("Playlist 3", playlistEntity3.getPlaylistName());
        assertEquals("Description of Playlist 3", playlistEntity3.getDescription());
        assertEquals("Cover URL 3", playlistEntity3.getCoverUrl());
        assertEquals(coverFileEntity, playlistEntity3.getCoverFile());
        assertEquals(Visibility.PRIVATE, playlistEntity3.getVisibility());
        assertEquals(Sorting.ALBUM, playlistEntity3.getSorting());
        assertNull(playlistEntity3.getSongs());
        assertEquals(0, playlistEntity3.getNumberOfSongs());
        assertEquals(0, playlistEntity3.getPlaytime());
        assertNull(playlistEntity3.getInLibraries());
        assertNull(playlistEntity3.getAddDate(null));
        assertNull(playlistEntity3.getAddDate(userAccountEntity2));

        playlistEntity3.setSongs(new ArrayList<>());
        assertEquals(0, playlistEntity3.getNumberOfSongs());
        assertEquals(0, playlistEntity3.getPlaytime());

    }

    @Test
    void testPlaylistInLibraryEntity(){

        // asserts for playlistInLibraryEntity
        assertEquals(playlistInLibraryKey, playlistInLibraryEntity.getPlaylistInLibraryKey());
        assertEquals(addDate, playlistInLibraryEntity.getAddDate());
        assertEquals(playlistEntity, playlistInLibraryEntity.getPlaylist());
        assertEquals(userAccountEntity, playlistInLibraryEntity.getUserAccount());

        // asserts for playlistInLibraryEntity2
        assertEquals(addDate, playlistInLibraryEntity2.getAddDate());
        assertEquals(playlistEntity, playlistInLibraryEntity2.getPlaylist());
        assertEquals(userAccountEntity, playlistInLibraryEntity2.getUserAccount());
    }

    @Test
    void testSongEntity(){

        // asserts for songEntity
        assertEquals(SONG_ID, songEntity.getSongId());
        assertEquals("Song 1", songEntity.getTitle());
        assertEquals(artists, songEntity.getArtists());
        assertEquals("Album 1", songEntity.getAlbum());
        assertEquals(genres, songEntity.getGenres());
        assertEquals(PLAYTIME, songEntity.getPlaytime());
        assertEquals(releaseDate, songEntity.getReleaseDate());
        assertEquals(linksForWebPlayer, songEntity.getLinksForWebPlayer());
        assertEquals("Cover URL", songEntity.getCoverUrl());
        assertEquals(songInPlaylistEntityList, songEntity.getPlaylists());

        // asserts for songEntity2
        assertEquals(SONG_ID, songEntity2.getSongId());
        assertEquals("Song 2", songEntity2.getTitle());
        assertEquals(artists, songEntity2.getArtists());
        assertEquals("Album 2", songEntity2.getAlbum());
        assertEquals(genres, songEntity2.getGenres());
        assertEquals(PLAYTIME, songEntity2.getPlaytime());
        assertEquals(releaseDate, songEntity2.getReleaseDate());
        assertEquals(linksForWebPlayer, songEntity2.getLinksForWebPlayer());
        assertEquals("Cover URL 2", songEntity2.getCoverUrl());
        assertEquals(songInPlaylistEntityList, songEntity2.getPlaylists());
    }

    @Test
    void testSongInPlaylistEntity(){

        // asserts for songInPlaylistEntity
        assertEquals(songInPlaylistKey, songInPlaylistEntity.getSongInPlaylistKey());
        assertEquals(addDate, songInPlaylistEntity.getAddDate());
        assertEquals(playlistEntity, songInPlaylistEntity.getPlaylist());
        assertEquals(songEntity, songInPlaylistEntity.getSong());

        // asserts for songInPlaylistEntity2
        assertEquals(songInPlaylistKey, songInPlaylistEntity2.getSongInPlaylistKey());
        assertEquals(addDate, songInPlaylistEntity2.getAddDate());
        assertEquals(playlistEntity, songInPlaylistEntity2.getPlaylist());
        assertEquals(songEntity, songInPlaylistEntity2.getSong());
    }

    @Test
    void testUserAccountEntity(){

        // asserts for userAccountEntity
        assertEquals("uid1", userAccountEntity.getUid());
        assertEquals("user1", userAccountEntity.getUsername());
        assertEquals("Spotify", userAccountEntity.getServiceName1());
        assertEquals("accountId1", userAccountEntity.getAccountId1());
        assertEquals("auth1", userAccountEntity.getAuthToken1());
        assertEquals("Tidal", userAccountEntity.getServiceName2());
        assertEquals("accountId2", userAccountEntity.getAccountId2());
        assertEquals("auth2", userAccountEntity.getAuthToken2());
        assertEquals("SoundCloud", userAccountEntity.getServiceName3());
        assertEquals("accountId3", userAccountEntity.getAccountId3());
        assertEquals("auth3", userAccountEntity.getAuthToken3());
        assertEquals(playlistInLibraryEntityList, userAccountEntity.getPlaylistsInLibrary());

        // asserts for userAccountEntity2
        assertEquals("uid2", userAccountEntity2.getUid());
        assertEquals("user2", userAccountEntity2.getUsername());

    }
}
