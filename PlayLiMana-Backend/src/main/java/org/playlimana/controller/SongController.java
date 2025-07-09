package org.playlimana.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import org.playlimana.service.SongService;

@Path("/song")
public class SongController {

    SongService songService;

    @Inject
    public SongController(SongService songService) {
        this.songService = songService;
    }

    @GET
    public Response getSongs() {
        return Response.ok().entity("song").build();
    }
}
