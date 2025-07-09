package org.playlimana.utils;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;

@Provider
public class SecurityHeaderFilter implements ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext requestContext,
                       ContainerResponseContext responseContext) throws IOException {

        responseContext.getHeaders().add("X-Content-Type-Options", "nosniff"); // XSS
        responseContext.getHeaders().add("X-XSS-Protection", "1; mode=block"); // XSS
        responseContext.getHeaders().add("X-Frame-Options", "DENY");    // Clickjacking
    }
}
