package org.playlimana.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import org.playlimana.model.Sorting;
import org.playlimana.model.Visibility;

import java.util.List;

@Schema(description = "DTO representing a playlist with metadata and songs")
public record PlaylistDTO(

        @Schema(description = "Unique ID of the playlist", example = "123")
        long playlistId,

        @Schema(description = "Name of the playlist", example = "Chill Vibes")
        String playlistName,

        @Schema(description = "Description of the playlist", example = "Relaxing tracks for the evening.")
        String description,

        @Schema(description = "Visibility of the playlist", example = "PRIVATE")
        Visibility visibility,

        @Schema(description = "Sorting mode of the playlist", example = "CUSTOM")
        Sorting sorting,

        @Schema(description = "List of songs in the playlist")
        List<SongDTO> songs,

        @Schema(description = "Total number of songs in the playlist", example = "20")
        int numberOfSongs,

        @Schema(description = "Total playtime of the playlist in seconds", example = "5400")
        long playtime,

        @Schema(description = "URL of the cover image", example = "https://example.com/images/cover.jpg")
        String coverUrl,

        @Schema(description = "Date the playlist was added to the library (yyyy-MM-dd'T'HH:mm:ss)", example = "2025-07-01T00:00:00")
        String addDate
) {}
