package org.playlimana.model.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
public class CoverFileEntity extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long coverFileId;
    @Lob
    private byte[] data;
    private String contentType; // z. B. "image/jpeg"
    @OneToOne
    @JoinColumn(name = "playlist_id")
    private PlaylistEntity playlist;

    // deleted empty public constructor since it already exists implicitly (sonarqube)

    public Long getCoverFileId() {
        return coverFileId;
    }

    public byte[] getData() {
        return data;
    }

    public void setData(byte[] data) {
        this.data = data;
    }

    public PlaylistEntity getPlaylist() {
        return playlist;
    }

    public void setPlaylist(PlaylistEntity playlist) {
        this.playlist = playlist;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
}
