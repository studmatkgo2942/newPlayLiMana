package org.playlimana.model.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.playlimana.model.Sorting;
import org.playlimana.model.Visibility;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class PlaylistEntity extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "playlist_id")
    private Long playlistId;
    private String playlistName;
    private String description;
    private String coverUrl;
    @OneToOne(mappedBy = "playlist", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private CoverFileEntity coverFile;
    private Visibility visibility;
    private Sorting sorting;
    @OneToMany(mappedBy = "playlist", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "playlist_order")
    private List<SongInPlaylistEntity> songs;
    @OneToMany(mappedBy = "playlist", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlaylistInLibraryEntity> inLibraries = new ArrayList<>();


    public PlaylistEntity() {

    }

    public PlaylistEntity(PlaylistEntity playlistEntity) {
        this.playlistName = playlistEntity.playlistName;
        this.description = playlistEntity.description;
        this.coverUrl = playlistEntity.coverUrl;
        this.visibility = playlistEntity.visibility;
        this.sorting = playlistEntity.sorting;
        // sets empty list for songs so the playlist service can fill it with
        // new songInPlaylistEntities since the playlistId is also saved in these
        this.songs = new ArrayList<>();
    }

    public PlaylistEntity(String playlistName, String description, String coverUrl, Visibility visibility, Sorting sorting) {
        this.playlistName = playlistName;
        this.description = description;
        this.coverUrl = coverUrl;
        this.visibility = visibility;
        this.sorting = sorting;
        this.songs = new ArrayList<>();
    }

    public Long getPlaylistId() {
        return playlistId;
    }

    public void setPlaylistId(long playlistId) {
        this.playlistId = playlistId;
    }

    public String getPlaylistName() {
        return playlistName;
    }

    public void setPlaylistName(String playlistName) {
        this.playlistName = playlistName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCoverUrl() {
        return coverUrl;
    }

    public void setCoverUrl(String coverUrl) {
        this.coverUrl = coverUrl;
    }

    public CoverFileEntity getCoverFile() {
        return coverFile;
    }

    public void setCoverFile(CoverFileEntity coverFile) {
        this.coverFile = coverFile;
        coverFile.setPlaylist(this);
    }

    public Visibility getVisibility() {
        return visibility;
    }

    public void setVisibility(Visibility visibility) {
        this.visibility = visibility;
    }

    public Sorting getSorting() {
        return sorting;
    }

    public void setSorting(Sorting sorting) {
        this.sorting = sorting;
    }

    public List<SongInPlaylistEntity> getSongs() {
        return songs;
    }

    public void setSongs(List<SongInPlaylistEntity> songs) {
        this.songs = songs;
    }

    public List<PlaylistInLibraryEntity> getInLibraries() {
        return inLibraries;
    }

    public void setInLibraries(List<PlaylistInLibraryEntity> inLibraries) {
        this.inLibraries = inLibraries;
    }

    @Transient
    public int getNumberOfSongs() {
        return songs != null ? songs.size() : 0;
    }

    @Transient
    public long getPlaytime() {
        return songs != null ? songs.stream()
                .mapToLong(playlistSong -> playlistSong.getSong().getPlaytime())
                .sum() : 0;
    }

    @Transient
    public LocalDateTime getAddDate(UserAccountEntity userAccount) {
        if (userAccount == null || inLibraries == null) {
            return null;
        }

        return inLibraries.stream()
                .filter(pil -> pil.getUserAccount().equals(userAccount))
                .map(PlaylistInLibraryEntity::getAddDate)
                .findFirst()
                .orElse(null);
    }
}
