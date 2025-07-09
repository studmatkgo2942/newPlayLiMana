package org.playlimana.model.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.List;

@Entity
public class SongEntity extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "song_id")
    private Long songId;
    private String title;
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> artists;
    private String album;
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> genres;
    private long playtime;
    private LocalDate releaseDate;
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> linksForWebPlayer;
    private String coverUrl;
    @OneToMany(mappedBy = "song", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SongInPlaylistEntity> playlists;

    public SongEntity() {

    }

    // adjusted call for constructor to make it more simple (sonarqube)
    public SongEntity(String title,
                      List<String> artists,
                      String album,
                      List<String> genres,
                      long playtime,
                      LocalDate releaseDate,
                      List<String> linksForWebPlayer) {
        this.title = title;
        this.artists = artists;
        this.album = album;
        this.genres = genres;
        this.playtime = playtime;
        this.releaseDate = releaseDate;
        this.linksForWebPlayer = linksForWebPlayer;
    }

    public Long getSongId() {
        return songId;
    }

    public void setSongId(long songId) {
        this.songId = songId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<String> getArtists() {
        return artists;
    }

    public void setArtist(List<String> artists) {
        this.artists = artists;
    }

    public String getAlbum() {
        return album;
    }

    public void setAlbum(String album) {
        this.album = album;
    }

    public List<String> getGenres() {
        return genres;
    }

    public void setGenres(List<String> genres) {
        this.genres = genres;
    }

    public long getPlaytime() {
        return playtime;
    }

    public void setPlaytime(long playtime) {
        this.playtime = playtime;
    }

    public LocalDate getReleaseDate() {
        return releaseDate;
    }

    public void setReleaseDate(LocalDate releaseDate) {
        this.releaseDate = releaseDate;
    }

    public List<String> getLinksForWebPlayer() {
        return linksForWebPlayer;
    }

    public void setLinksForWebPlayer(List<String> linksForWebPlayer) {
        this.linksForWebPlayer = linksForWebPlayer;
    }

    public List<SongInPlaylistEntity> getPlaylists() {return playlists; }

    public void setPlaylists(List<SongInPlaylistEntity> playlists) {this.playlists = playlists; }

    public String getCoverUrl() {
        return coverUrl;
    }

    public void setCoverUrl(String coverUrl) {
        this.coverUrl = coverUrl;
    }
}
