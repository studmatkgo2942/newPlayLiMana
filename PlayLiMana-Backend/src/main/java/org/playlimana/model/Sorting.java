package org.playlimana.model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Sorting options for a playlist")
public enum Sorting {

    @Schema(description = "User-defined custom order (uses the positionInPlaylist in SongDTO)")
    CUSTOM,

    @Schema(description = "Sort songs alphabetically by title")
    TITLE,

    @Schema(description = "Sort songs alphabetically by artist name")
    ARTIST,

    @Schema(description = "Sort songs by recently added")
    RECENTLY_ADDED,

    @Schema(description = "Sort songs by release date")
    RELEASE_DATE,

    @Schema(description = "Sort songs by duration")
    PLAYTIME,

    @Schema(description = "Sort songs alphabetically by album name")
    ALBUM
}
