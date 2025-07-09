package org.playlimana.model.dto;

public record AuthenticateDTO(String username, String authToken, String cookie) {
}
