package com.healthHub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global CORS Configuration for HealthHub Application.
 * 
 * Handles cross-origin requests from frontend (http://localhost:5173)
 * to backend (http://localhost:8080) during development.
 * 
 * This configuration:
 * 1. Allows all HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
 * 2. Allows all headers (including Content-Type, Authorization, etc.)
 * 3. Allows credentials (cookies, authorization headers)
 * 4. Handles preflight OPTIONS requests automatically
 * 
 * IMPORTANT: For production, specify exact origins and methods instead of "*"
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // Allow requests from frontend
                .allowedOrigins(
                    "http://localhost:5173",      // Vite dev server
                    "http://localhost:3000"       // Alternative frontend port
                )
                // Allow common HTTP methods
                .allowedMethods(
                    "GET",
                    "POST", 
                    "PUT",
                    "DELETE",
                    "OPTIONS",
                    "PATCH"
                )
                // Allow common headers
                .allowedHeaders("*")
                // Allow credentials (cookies, auth headers)
                .allowCredentials(true)
                // Maximum age of preflight response cache (1 hour)
                .maxAge(3600)
                // Allow all header values
                .exposedHeaders("*");
    }
}
