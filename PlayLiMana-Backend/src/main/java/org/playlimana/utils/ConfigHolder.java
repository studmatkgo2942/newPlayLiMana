package org.playlimana.utils;
import jakarta.enterprise.context.ApplicationScoped;
// removed unused import (sonarqube)

@ApplicationScoped
public class ConfigHolder {

    // removed commented-out lines of code (sonarqube)
    // removed @PostConstruct operation and made the strings final with their values (sonarqube)
    private static final String BACKEND_URL_STATIC = "http://localhost:9000";
    private static final String FRONTEND_URL_STATIC = "http://localhost:4200";

    private ConfigHolder(){
        // empty private constructor to hide public one (sonarqube)
    }
    public static String getBackendUrl() {
        return BACKEND_URL_STATIC;
    }

    public static String getFrontendUrl() {
        return FRONTEND_URL_STATIC;
    }
}

