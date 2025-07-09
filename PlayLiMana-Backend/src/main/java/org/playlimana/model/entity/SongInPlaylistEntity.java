package org.playlimana.model.entity;


import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.playlimana.model.databasekey.SongInPlaylistKey;

import java.time.LocalDateTime;

@Entity
public class SongInPlaylistEntity extends PanacheEntityBase {

    @EmbeddedId
    private SongInPlaylistKey songInPlaylistKey;

    private LocalDateTime addDate;

    @ManyToOne
    @MapsId("playlistId")
    @JoinColumn(name = "playlist_id", nullable = false)
    private PlaylistEntity playlist;

    @ManyToOne
    @MapsId("songId")
    @JoinColumn(name = "song_id", nullable = false)
    private SongEntity song;

    public SongInPlaylistEntity() {
    }

    public SongInPlaylistEntity(LocalDateTime addDate, PlaylistEntity playlist, SongEntity song) {
        this.songInPlaylistKey = new SongInPlaylistKey(playlist.getPlaylistId(), song.getSongId());
        this.addDate = addDate;
        this.playlist = playlist;
        this.song = song;
    }

    public SongInPlaylistKey getSongInPlaylistKey() {
        return songInPlaylistKey;
    }

    public void setSongInPlaylistKey(SongInPlaylistKey songInPlaylistKey) {
        this.songInPlaylistKey = songInPlaylistKey;
    }

    public LocalDateTime getAddDate() {
        return addDate;
    }

    public void setAddDate(LocalDateTime addDate) {
        this.addDate = addDate;
    }

    public PlaylistEntity getPlaylist() {
        return playlist;
    }

    public void setPlaylist(PlaylistEntity playlist) {
        this.playlist = playlist;
    }

    public SongEntity getSong() {
        return song;
    }

    public void setSong(SongEntity song) {
        this.song = song;
    }
}
