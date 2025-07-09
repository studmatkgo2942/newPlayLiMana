package org.playlimana.model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Visibility settings for a playlist")
public enum Visibility {

    @Schema(description = "Playlist is only visible to the owner")
    PRIVATE,

    @Schema(description = "Playlist is visible to users with a share link")
    SHARED,

    @Schema(description = "Playlist is visible to all users")
    PUBLIC
}
