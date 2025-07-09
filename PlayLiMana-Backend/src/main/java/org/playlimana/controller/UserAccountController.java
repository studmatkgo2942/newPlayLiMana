package org.playlimana.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.playlimana.auth.FirebaseTokenVerifier;
import org.playlimana.model.dto.SaveServiceTokenDTO;
import org.playlimana.service.UserAccountService;

import java.util.Map;

@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class UserAccountController {

    private final UserAccountService userAccountService;

    @Inject
    public UserAccountController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    public static record LoginRequest(
            String email,
            String firebaseUid,
            String lastLogin
    ) {}

    public static record NewUsernameRequest(
            String newUsername
    ) {}

    @POST
    @Path("/login")
    public Response login(LoginRequest req,
                          @HeaderParam("Authorization") String authHeader) {
        String idToken = extractToken(authHeader);
        if (idToken == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        var decoded = FirebaseTokenVerifier.verify(idToken);
        String uid = decoded.getUid();
        if (!uid.equals(req.firebaseUid())) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "UID/email mismatch"))
                    .build();
        }

        userAccountService.saveNewLogin(uid, req.email());
        return Response.ok(Map.of("success", true)).build();
    }

    @PUT
    @Path("/username")
    public Response updateUsername(NewUsernameRequest req,
                                   @HeaderParam("Authorization") String authHeader) {
        String idToken = extractToken(authHeader);
        if (idToken == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        var decoded = FirebaseTokenVerifier.verify(idToken);
        String uid = decoded.getUid();

        userAccountService.setNewUsername(uid, req.newUsername());
        return Response.ok(Map.of("success", true)).build();
    }

    private String extractToken(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        return header.substring("Bearer ".length()).trim();
    }

    private String authorizeAndGetUid(String authHeader) {
        String idToken = extractToken(authHeader);
        var decoded = FirebaseTokenVerifier.verify(idToken);
        return decoded.getUid();
    }

    @POST
    @Path("/save-service-token")
    public Response saveServiceToken(
            SaveServiceTokenDTO req,
            @HeaderParam("Authorization") String authHeader
    ) {
        String uid = authorizeAndGetUid(authHeader);
        userAccountService.saveServiceToken(uid, req);
        return Response.ok(Map.of("success", true)).build();
    }

    @DELETE
    @Path("/remove-service-token/{serviceName}")
    public Response removeServiceToken(
            @PathParam("serviceName") String serviceName,
            @HeaderParam("Authorization") String authHeader
    ) {
        String uid = authorizeAndGetUid(authHeader);
        userAccountService.removeServiceToken(uid, serviceName);
        return Response.ok(Map.of("success", true)).build();
    }

    @GET
    @Path("/connected-services")
    public Response getConnectedServices(
            @HeaderParam("Authorization") String authHeader
    ) {
        String uid = authorizeAndGetUid(authHeader);
        var services = userAccountService.listConnectedServices(uid);
        return Response.ok(services).build();
    }

}