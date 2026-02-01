package com.parkease.config;

import com.parkease.security.JwtFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/geocode").permitAll()
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/locations").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/locations/{id}").permitAll()

                        // Admin endpoints - require authentication
                        .requestMatchers("/api/admin/**").authenticated()
                        .requestMatchers("/api/slots/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/locations").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/locations/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/locations/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/locations/**").authenticated()              // ✅ Require auth for others

                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class); // ✅ Add JWT filter

        return http.build();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}