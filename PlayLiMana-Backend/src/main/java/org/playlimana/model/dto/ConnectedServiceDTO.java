package org.playlimana.model.dto;

public record ConnectedServiceDTO(
        String serviceName,
        String accountId,
        String authToken
) {}
