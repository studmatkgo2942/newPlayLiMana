package org.playlimana.model.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class UserAccountEntity extends PanacheEntityBase {
    @Id
    private String uid;

    private String username;
    private String serviceName1;
    private String accountId1;

    @Column(columnDefinition = "TEXT")
    private String authToken1;
    private String serviceName2;
    private String accountId2;

    @Column(columnDefinition = "TEXT")
    private String authToken2;
    private String serviceName3;
    private String accountId3;

    @Column(columnDefinition = "TEXT")
    private String authToken3;
    @OneToMany(mappedBy = "userAccount", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlaylistInLibraryEntity> playlistsInLibrary = new ArrayList<>();

    public UserAccountEntity() {
    }

    public UserAccountEntity(String uid, String username) {
        this.uid = uid;
        this.username = username;
    }

    // removed constructors that were overburdened and unused (sonarqube)

    // Getters & Setters
    public String getUid() {
        return uid;
    }

    public String getUsername() {
        return username;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getServiceName1() {
        return serviceName1;
    }

    public void setServiceName1(String serviceName1) {
        this.serviceName1 = serviceName1;
    }

    public String getAccountId1() {
        return accountId1;
    }

    public void setAccountId1(String accountId1) {
        this.accountId1 = accountId1;
    }

    public String getAuthToken1() {
        return authToken1;
    }

    public void setAuthToken1(String authToken1) {
        this.authToken1 = authToken1;
    }

    public String getServiceName2() {
        return serviceName2;
    }

    public void setServiceName2(String serviceName2) {
        this.serviceName2 = serviceName2;
    }

    public String getAccountId2() {
        return accountId2;
    }

    public void setAccountId2(String accountId2) {
        this.accountId2 = accountId2;
    }

    public String getAuthToken2() {
        return authToken2;
    }

    public void setAuthToken2(String authToken2) {
        this.authToken2 = authToken2;
    }

    public String getServiceName3() {
        return serviceName3;
    }

    public void setServiceName3(String serviceName3) {
        this.serviceName3 = serviceName3;
    }

    public String getAccountId3() {
        return accountId3;
    }

    public void setAccountId3(String accountId3) {
        this.accountId3 = accountId3;
    }

    public String getAuthToken3() {
        return authToken3;
    }

    public void setAuthToken3(String authToken3) {
        this.authToken3 = authToken3;
    }

    public List<PlaylistInLibraryEntity> getPlaylistsInLibrary() {
        return playlistsInLibrary;
    }

    public void setPlaylistsInLibrary(List<PlaylistInLibraryEntity> playlistsInLibrary) {
        this.playlistsInLibrary = playlistsInLibrary;
    }
}