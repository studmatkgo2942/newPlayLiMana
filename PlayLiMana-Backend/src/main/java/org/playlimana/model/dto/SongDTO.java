package org.playlimana.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "DTO representing a song with metadata")
public record SongDTO(

        @Schema(description = "Unique ID of the song", example = "456")
        long songId,

        @Schema(description = "Title of the song", example = "Lose Yourself")
        String title,

        @Schema(description = "List of artists for the song", example = "[\"Eminem\"]")
        List<String> artists,

        @Schema(description = "Album name", example = "8 Mile Soundtrack")
        String album,

        @Schema(description = "Genres of the song", example = "[\"Hip-Hop\", \"Rap\"]")
        List<String> genres,

        @Schema(description = "Length of the song in seconds", example = "326")
        long playtime,

        @Schema(description = "Release date of the song (YYYY-MM-DD)", example = "2002-10-22")
        String releaseDate,

        @Schema(description = "Streaming links for web player", example = "[\"https://example.com/play/456\"]")
        List<String> linksForWebPlayer,

        @Schema(description = "URL of the cover image", example = "https://example.com/images/song-cover.jpg")
        String coverUrl,

        @Schema(description = "Position of the song within a playlist", example = "5")
        int positionInPlaylist,

        @Schema(description = "Date the song was added to the playlist (YYYY-MM-DD)", example = "2023-07-15T00:45:00")
        String addDate

) {}
