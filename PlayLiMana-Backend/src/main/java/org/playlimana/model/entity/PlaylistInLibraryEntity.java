package org.playlimana.model.entity;


import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.playlimana.model.databasekey.PlaylistInLibraryKey;

import java.time.LocalDateTime;

@Entity
public class PlaylistInLibraryEntity extends PanacheEntityBase {

    @EmbeddedId
    private PlaylistInLibraryKey playlistInLibraryKey;

    private LocalDateTime addDate;

    @ManyToOne
    @MapsId("playlistId")
    @JoinColumn(name = "playlist_id", nullable = false)
    private PlaylistEntity playlist;

    @ManyToOne
    @MapsId("userAccountId")
    @JoinColumn(name = "account_id", nullable = false)
    private UserAccountEntity userAccount;

    public PlaylistInLibraryEntity() {
    }

    public PlaylistInLibraryEntity(LocalDateTime addDate, PlaylistEntity playlist, UserAccountEntity userAccount) {
        this.playlistInLibraryKey = new PlaylistInLibraryKey(playlist.getPlaylistId(), userAccount.getUid());
        this.addDate = addDate;
        this.playlist = playlist;
        this.userAccount = userAccount;
    }

    public PlaylistInLibraryKey getPlaylistInLibraryKey() {
        return playlistInLibraryKey;
    }

    public void setPlaylistInLibraryKey(PlaylistInLibraryKey playlistInLibraryKey) {
        this.playlistInLibraryKey = playlistInLibraryKey;
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

    public UserAccountEntity getUserAccount() {
        return userAccount;
    }

    public void setUserAccount(UserAccountEntity userAccount) {
        this.userAccount = userAccount;
    }
}
