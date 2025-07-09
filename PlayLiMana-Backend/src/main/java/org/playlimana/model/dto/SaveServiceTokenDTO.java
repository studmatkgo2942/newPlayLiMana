package org.playlimana.model.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SaveServiceTokenDTO(
        String serviceName,
        String accountId,
        String authToken
        // we ignore tokenSavedAt
) {}
