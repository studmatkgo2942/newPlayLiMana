package org.playlimana.model.databasekey;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class SongInPlaylistKey implements Serializable {

    private Long playlistId;
    private Long songId;

    public SongInPlaylistKey() {

    }

    public SongInPlaylistKey(Long playlistId, Long songId) {
        this.playlistId = playlistId;
        this.songId = songId;
    }

    public Long getPlaylistId() {
        return playlistId;
    }

    public void setPlaylistId(Long playlistId) {
        this.playlistId = playlistId;
    }

    public Long getSongId() {
        return songId;
    }

    public void setSongId(Long songId) {
        this.songId = songId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SongInPlaylistKey)) return false;
        SongInPlaylistKey that = (SongInPlaylistKey) o;
        return Objects.equals(playlistId, that.playlistId) &&
                Objects.equals(songId, that.songId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(playlistId, songId);
    }
}
