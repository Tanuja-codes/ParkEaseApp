package com.parkease.controllers;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class GeneralController {

    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        return Map.of("status", "OK", "message", "ParkEase API is running");
    }

    @GetMapping("/geocode")
    public ResponseEntity<?> getGeocode(@RequestParam String q) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + q;

        try {
            Object data = restTemplate.getForObject(url, Object.class);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch geocode"));
        }
    }
}