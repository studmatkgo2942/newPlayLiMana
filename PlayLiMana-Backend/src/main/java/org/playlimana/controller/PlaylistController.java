package org.playlimana.controller;

import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.metrics.annotation.Counted;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.resteasy.reactive.RestForm;
import org.playlimana.model.Sorting;
import org.playlimana.model.Visibility;
import org.playlimana.model.dto.PlaylistDTO;
import org.playlimana.model.dto.SongDTO;
import org.playlimana.model.entity.CoverFileEntity;
import org.playlimana.service.PlaylistService;
import org.playlimana.service.SongService;
import org.playlimana.service.UserAccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

@ApplicationScoped
@Path("/playlists")
@Tag(name = "Playlist", description = "Operations on playlists")
public class PlaylistController {

    PlaylistService playlistService;
    SongService songService;
    UserAccountService userAccountService;
    private static final Logger logger = LoggerFactory.getLogger(PlaylistController.class);

    // constant to stop duplicating the string (sonarqube)
    private static final String INVALID_PLAYLIST_ID_OR_NAME = "Invalid playlist ID or name";

    @Inject
    public PlaylistController(PlaylistService playlistService, SongService songService, UserAccountService userAccountService) {
        this.playlistService = playlistService;
        this.songService = songService;
        this.userAccountService = userAccountService;
    }


    /**
     * Retrieves all playlists for the current user.
     */
    @GET
    @Produces("application/json")
    @Operation(summary = "Get all playlists", description = "Fetches all playlists of the authenticated user.")
    @APIResponse(responseCode = "200", description = "A list of playlists")
    @APIResponse(responseCode = "401", description = "Unauthorized access")
    @Counted(name = "getPlaylists_counter", description = "How many times the getPlaylist endpoint was called")
    public Response getPlaylists(@HeaderParam("Authorization") String authorizationHeader) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        return Response.ok().entity(playlistService.getLibrary()).build();
    }


    /**
     * Retrieves a specific playlist by ID.
     */
    @GET
    @Path("/{playlistId}")
    @Produces("application/json")
    @Operation(summary = "Get playlist", description = "Fetch a specific playlist by its ID.")
    @APIResponse(responseCode = "200", description = "Playlist found")
    @APIResponse(responseCode = "401", description = "Unauthorized access")
    @APIResponse(responseCode = "404", description = "Playlist not found")
    @Counted(name = "getPlaylist_counter", description = "How many times a specific playlist was fetched")
    public Response getPlaylist(@HeaderParam("Authorization") String authorizationHeader,
                                @Parameter(required = true) @PathParam("playlistId") long playlistId) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO playlist = playlistService.getPlaylistDTO(playlistId);
        if (playlist != null) {
            return Response.ok().entity(playlist).build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }


    /**
     * Creates a new playlist.
     */
    @POST
    @Path("")
    @Consumes("application/json")
    @Produces("application/json")
    @Operation(summary = "Create playlist", description = "Creates a new playlist for the authenticated user.")
    @APIResponse(responseCode = "201", description = "Playlist created")
    @APIResponse(responseCode = "400", description = "Invalid playlist data")
    @APIResponse(responseCode = "401", description = "Unauthorized access")
    @RequestBody(description = "Playlist object to be created")
    public Response createPlaylist(@HeaderParam("Authorization") String authorizationHeader,
                                   PlaylistDTO playlist) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO created = playlistService.createPlaylist(playlist);
        if (created != null) {
            return Response.status(Response.Status.CREATED).entity(created).build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST).entity("Playlist wasn't created").build();
        }
    }


    /**
     * Copies an existing playlist.
     */
    @POST
    @Path("/{playlistId}/copy")
    @Produces("application/json")
    @Operation(summary = "Copy playlist", description = "Creates a copy of the specified playlist.")
    @APIResponse(responseCode = "200", description = "Playlist copied")
    @APIResponse(responseCode = "400", description = "Invalid playlist ID")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @Counted(name = "copyPlaylistCounter", description = "How many times a playlist was copied")
    public Response copyPlaylist(@HeaderParam("Authorization") String authorizationHeader,
                                 @Parameter(required = true) @PathParam("playlistId") Long playlistId) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO copy = playlistService.copyPlaylist(playlistId);
        return responseHelper(copy, INVALID_PLAYLIST_ID_OR_NAME);
    }


    /**
     * Deletes a playlist by ID.
     */
    @DELETE
    @Path("/{playlistId}/delete")
    @Produces("application/json")
    @Operation(summary = "Delete playlist", description = "Deletes the specified playlist.")
    @APIResponse(responseCode = "200", description = "Playlist deleted")
    @APIResponse(responseCode = "400", description = "Deletion failed")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @Counted(name = "deletePlaylistCounter", description = "How many times ta playlist was deleted")
    public Response deletePlaylist(@HeaderParam("Authorization") String authorizationHeader,
                                   @Parameter(required = true) @PathParam("playlistId") Long playlistId) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        boolean success = playlistService.deletePlaylist(playlistId);
        if (success) {
            JsonObject response = Json.createObjectBuilder()
                    .add("deletedPlaylistId", playlistId)
                    .build();
            return Response.ok().entity(response).build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST).entity("Couldn't delete playlist").build();
        }
    }


    /**
     * Adds a playlist to a user's library.
     */
    @POST
    @Path("/{playlistId}")
    @Produces("application/json")
    @Operation(summary = "Adds playlist to user's library", description = "Adds a playlist to a user's library.")
    @APIResponse(responseCode = "200", description = "Playlist added")
    @APIResponse(responseCode = "400", description = "Invalid playlist ID")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @Counted(name = "addToLibraryCounter", description = "How many times a playlist was added to a library")
    public Response addPlaylistToLibrary(@HeaderParam("Authorization") String authorizationHeader,
                                         @Parameter(required = true) @PathParam("playlistId") Long playlistId) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        boolean success = playlistService.addPlaylistToLibrary(playlistId);
        if (success) {
            return Response.ok().entity("Playlist added to library").build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST).entity(INVALID_PLAYLIST_ID_OR_NAME).build();
        }
    }


    /**
     * Removes a playlist from a user's library.
     */
    @DELETE
    @Path("/{playlistId}")
    @Produces("application/json")
    @Operation(summary = "Removes playlist from user's library", description = "Removes a playlist from a user's library.")
    @APIResponse(responseCode = "200", description = "Playlist removed")
    @APIResponse(responseCode = "400", description = "Invalid playlist ID")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @Counted(name = "removeFromLibraryCounter", description = "How many times a playlist was removed from a library")
    public Response removePlaylistFromLibrary(@HeaderParam("Authorization") String authorizationHeader,
                                              @Parameter(required = true) @PathParam("playlistId") Long playlistId) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        boolean success = playlistService.removePlaylistFromLibrary(playlistId);
        if (success) {
            return Response.ok().entity("Playlist removed from library").build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST).entity(INVALID_PLAYLIST_ID_OR_NAME).build();
        }
    }


    /**
     * Fully updates a playlist (name, description, visibility, sorting).
     */
    @PUT
    @Path("/{playlistId}")
    @Consumes("application/json")
    @Produces("application/json")
    @Operation(summary = "Update playlist", description = "Fully update an existing playlist.")
    @APIResponse(responseCode = "200", description = "Playlist updated")
    @APIResponse(responseCode = "400", description = "Invalid data or mismatch between path and body ID")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @RequestBody(description = "Playlist object with updated fields")
    @Counted(name = "editPlaylistCounter", description = "How many times a playlist was edited")
    public Response editPlaylist(@HeaderParam("Authorization") String authorizationHeader,
                                 @Parameter(required = true) @PathParam("playlistId") Long playlistId,
                                 PlaylistDTO playlist) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO edited = playlistService.editPlaylist(playlistId, playlist);
        return responseHelper(edited, "Couldn't edit playlist");
    }


    /**
     * Adds a song to the playlist.
     */
    @POST
    @Path("/{playlistId}/songs")
    @Consumes("application/json")
    @Produces("application/json")
    @Operation(summary = "Add song", description = "Adds a song to the end of the specified playlist.")
    @APIResponse(responseCode = "200", description = "Song added")
    @APIResponse(responseCode = "400", description = "Invalid playlist ID or song data")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @RequestBody(description = "Song object to add to playlist")
    @Counted(name = "addSongToPlaylistCounter", description = "How many times a new song was added to a playlist")
    public Response addSongToPlaylist(@HeaderParam("Authorization") String authorizationHeader,
                                      @Parameter(required = true) @PathParam("playlistId") Long playlistId,
                                      SongDTO song) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO edited = playlistService.addSongToPlaylist(playlistId, song);
        return responseHelper(edited, "Invalid playlist ID or song ID");
    }


    /**
     * Removes a song from a playlist at a given position.
     */
    @DELETE
    @Path("/{playlistId}/songs/{songId}")
    @Produces("application/json")
    @Operation(summary = "Remove song", description = "Removes a song at a specific position in the playlist.")
    @APIResponse(responseCode = "200", description = "Song removed")
    @APIResponse(responseCode = "400", description = "Invalid IDs or position")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @Counted(name = "removeSongFromPlaylistCounter", description = "How many times a song was removed from a playlist")
    public Response removeSongFromPlaylist(@HeaderParam("Authorization") String authorizationHeader,
                                           @Parameter(required = true) @PathParam("playlistId") Long playlistId,
                                           @Parameter(required = true) @PathParam("songId") Long songId,
                                           @Parameter(required = true, description = "position index of the song to remove")
                                           @QueryParam("position") int songPositionInPlaylist) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO edited = playlistService.removeSongFromPlaylist(playlistId, songId, songPositionInPlaylist);
        if (edited != null) {
            return Response.ok().entity("Song removed from playlist").build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST).entity("Invalid playlist ID or song ID").build();
        }
    }


    /**
     * Changes the order of songs in a playlist.
     */
    @PATCH
    @Path("/{playlistId}/songOrder")
    @Consumes("application/json")
    @Produces("application/json")
    @Operation(summary = "Change song order", description = "Reorders songs in the specified playlist.")
    @APIResponse(responseCode = "200", description = "Song order updated")
    @APIResponse(responseCode = "400", description = "Invalid playlist data")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @RequestBody(description = "Playlist object with new song order")
    public Response changePlaylistSongOrder(@HeaderParam("Authorization") String authorizationHeader,
                                            @Parameter(required = true) @PathParam("playlistId") Long playlistId,
                                            PlaylistDTO playlistDTO) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO edited = playlistService.changePlaylistSongOrder(playlistId, playlistDTO);
        return responseHelper(edited, "Invalid playlist data");
    }


    /**
     * Updates the playlist name.
     */
    @PATCH
    @Path("/{playlistId}/name")
    @Consumes("application/json")
    @Produces("application/json")
    @Operation(summary = "Change playlist name", description = "Updates the name of the playlist.")
    @APIResponse(responseCode = "200", description = "Name updated")
    @APIResponse(responseCode = "400", description = "Invalid playlist ID or name")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @RequestBody(description = "New name for the playlist")
    public Response changePlaylistName(@HeaderParam("Authorization") String authorizationHeader,
                                       @Parameter(required = true) @PathParam("playlistId") Long playlistId,
                                       String newPlaylistName) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO edited = playlistService.changePlaylistName(playlistId, newPlaylistName);
        return responseHelper(edited, INVALID_PLAYLIST_ID_OR_NAME);
    }


    /**
     * Updates the playlist description.
     */
    @PATCH
    @Path("/{playlistId}/description")
    @Consumes("application/json")
    @Produces("application/json")
    @Operation(summary = "Change playlist description", description = "Updates the playlist description.")
    @APIResponse(responseCode = "200", description = "Description updated")
    @APIResponse(responseCode = "400", description = "Invalid playlist ID or description")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @RequestBody(description = "New description for the playlist")
    public Response changePlaylistDescription(@HeaderParam("Authorization") String authorizationHeader,
                                              @Parameter(required = true) @PathParam("playlistId") Long playlistId,
                                              String newPlaylistDescription) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO edited = playlistService.changePlaylistDescription(playlistId, newPlaylistDescription);
        return responseHelper(edited, "Invalid playlist ID or description");
    }


    /**
     * Updates the visibility of the playlist.
     */
    @PATCH
    @Path("/{playlistId}/visibility")
    @Consumes("application/json")
    @Produces("application/json")
    @Operation(summary = "Change playlist visibility", description = "Updates the visibility of the playlist.")
    @APIResponse(responseCode = "200", description = "Visibility updated")
    @APIResponse(responseCode = "400", description = "Invalid playlist ID or visibility value")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @RequestBody(description = "New visibility setting")
    public Response changePlaylistVisibility(@HeaderParam("Authorization") String authorizationHeader,
                                             @Parameter(required = true) @PathParam("playlistId") Long playlistId,
                                             Visibility visibility) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO edited = playlistService.changePlaylistVisibility(playlistId, visibility);
        return responseHelper(edited, "Invalid playlist ID");
    }


    /**
     * Updates the sorting mode of the playlist.
     */
    @PATCH
    @Path("/{playlistId}/sorting")
    @Consumes("application/json")
    @Produces("application/json")
    @Operation(summary = "Change playlist sorting", description = "Updates the sorting mode of the playlist.")
    @APIResponse(responseCode = "200", description = "Sorting updated")
    @APIResponse(responseCode = "400", description = "Invalid playlist ID or sorting value")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    @RequestBody(description = "New sorting mode for the playlist")
    public Response changePlaylistSorting(@HeaderParam("Authorization") String authorizationHeader,
                                          @Parameter(required = true) @PathParam("playlistId") Long playlistId,
                                          Sorting sorting) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO edited = playlistService.changePlaylistSorting(playlistId, sorting);
        return responseHelper(edited, "Invalid playlist ID or sorting value");
    }


    /**
     * Gets a playlist cover file.
     */
    @GET
    @Path("/{playlistId}/cover")
    @Produces("image/*")
    @Operation(summary = "Get playlist cover image", description = "Returns the cover file or an empty filen if " +
            "playlist doesn't have a cover file."
    )
    @APIResponse(responseCode = "200", description = "Playlist cover found")
    @APIResponse(responseCode = "404", description = "Invalid playlist ID or playlist doesn't have a cover file")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    public Response getPlaylistCover(@HeaderParam("Authorization") String authorizationHeader,
                                     @Parameter(required = true) @PathParam("playlistId") Long playlistId) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        CoverFileEntity coverFile = playlistService.getPlaylistCover(playlistId);

        if (coverFile != null && coverFile.getData() != null && coverFile.getData().length > 0) {
            return Response.ok(new ByteArrayInputStream(coverFile.getData()))
                    .type(coverFile.getContentType() != null ? coverFile.getContentType() : "application/octet-stream")
                    .header("Content-Disposition", "inline; filename=\"cover_" + playlistId + "\"")
                    .build();
        } else {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("Invalid playlist ID or playlist has no cover file")
                    .build();
        }
    }


    /**
     * Adds a playlist cover.
     */
    @POST
    @Path("/{playlistId}/cover")
    @Consumes("multipart/form-data")
    @Produces("application/json")
    @Operation(summary = "Change playlist cover image", description = "Replaces or sets a custom cover image for the specified playlist. " +
            "If a previous cover exists, it will be replaced."
    )
    @APIResponse(responseCode = "200", description = "Cover image updated successfully")
    @APIResponse(responseCode = "400", description = "Invalid playlist ID or file format")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    public Response changePlaylistCover(@HeaderParam("Authorization") String authorizationHeader,
                                        @Parameter(required = true) @PathParam("playlistId") Long playlistId,
                                        @RestForm("file") InputStream file,
                                        @RestForm("file") String contentType) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO edited = playlistService.changePlaylistCover(playlistId, file, contentType);
        return responseHelper(edited, "Invalid playlist ID or cover file");
    }


    /**
     * Removes a playlist cover.
     */
    @DELETE
    @Path("/{playlistId}/cover")
    @Produces("application/json")
    @Operation(summary = "Delete playlist cover image", description = "Deletes the image from the playlist and from the database."
    )
    @APIResponse(responseCode = "200", description = "Cover image deleted successfully")
    @APIResponse(responseCode = "400", description = "Invalid playlist ID")
    @APIResponse(responseCode = "401", description = "Unauthorized")
    public Response deletePlaylistCover(@HeaderParam("Authorization") String authorizationHeader,
                                        @Parameter(required = true) @PathParam("playlistId") Long playlistId) {
        if (!userAccountService.isAuthorized(authorizationHeader)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        PlaylistDTO edited = playlistService.deletePlaylistCover(playlistId);
        return responseHelper(edited, "Invalid playlist ID");
    }

    @GET
    @Path("/public")
    @Produces("application/json")
    @Operation(
            summary = "Get all public playlists",
            description = "Fetches all playlists that are marked as public. No authentication required."
    )
    @APIResponse(responseCode = "200", description = "A list of public playlists")
    @Counted(name = "getPublicPlaylists_counter", description = "How many times the public playlists endpoint was called")
    public Response getPublicPlaylists() {
        return Response.ok().entity(playlistService.getPublicPlaylists()).build();
    }

    @GET
    @Path("/public/{id}")
    @Produces("application/json")
    @Operation(
            summary = "Get specific public playlist",
            description = "Fetches a specific playlist marked as public. No authentication required."
    )
    @APIResponse(responseCode = "200", description = "The requested public playlist")
    @APIResponse(responseCode = "404", description = "Playlist not found or not public")
    @Counted(name = "getPublicPlaylists_counter", description = "How many times the public playlists endpoint was called")
    public Response getPublicPlaylist(@PathParam("id") Long playlistId) {
        var playlist = playlistService.getPlaylistDTO(playlistId);
        logger.debug("found playlist: {}", playlist);
        if (playlist == null || playlist.visibility() != Visibility.PUBLIC) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok().entity(playlist).build();
    }

    // helper function to reduce duplications
    private Response responseHelper(PlaylistDTO edited, String message){
        if(edited != null){
            return Response.ok().entity(edited).build();
        }else{
            return Response.status(Response.Status.BAD_REQUEST).entity(message).build();
        }
    }
}
