package org.playlimana.model.databasekey;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class PlaylistInLibraryKey implements Serializable {

    private Long playlistId;
    private String userAccountId;

    public PlaylistInLibraryKey() {

    }

    public PlaylistInLibraryKey(Long playlistId, String userAccountId) {
        this.playlistId = playlistId;
        this.userAccountId = userAccountId;
    }

    public Long getPlaylistId() {
        return playlistId;
    }

    public void setPlaylistId(Long playlistId) {
        this.playlistId = playlistId;
    }

    public String getUserAccountId() {
        return userAccountId;
    }

    public void setUserAccountId(String userAccountId) {
        this.userAccountId = userAccountId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PlaylistInLibraryKey)) return false;
        PlaylistInLibraryKey that = (PlaylistInLibraryKey) o;
        return Objects.equals(playlistId, that.playlistId) &&
                Objects.equals(userAccountId, that.userAccountId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(playlistId, userAccountId);
    }
}
