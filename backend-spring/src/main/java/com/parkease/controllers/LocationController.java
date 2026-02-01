package com.parkease.controllers;

import com.parkease.models.Location;
import com.parkease.repository.LocationRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    @Autowired
    private LocationRepository locationRepository;

    // Get all locations (public)
    @GetMapping("")
    public ResponseEntity<?> getAllLocations() {
        List<Location> locations = locationRepository.findAll()
                .stream()
                .filter(Location::isActive)
                .sorted(Comparator.comparing(Location::getId).reversed())
                .toList();
        return ResponseEntity.ok(locations);
    }

    // Get single location
    @GetMapping("/{id}")
    public ResponseEntity<?> getLocation(@PathVariable String id) {
        Optional<Location> locationOpt = locationRepository.findById(id);
        if (locationOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Location not found"));
        }
        return ResponseEntity.ok(locationOpt.get());
    }

    // Create location (admin only)
    @PostMapping("")
    public ResponseEntity<?> createLocation(@Valid @RequestBody Location location) {
        if (locationRepository.findByLocationId(location.getLocationId()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Location ID already exists"));
        }

        locationRepository.save(location);
        return ResponseEntity.status(201).body(Map.of(
                "message", "Location created successfully",
                "location", location
        ));
    }

    // Update location (admin only)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateLocation(@PathVariable String id, @RequestBody Location updated) {
        Optional<Location> locationOpt = locationRepository.findById(id);
        if (locationOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Location not found"));
        }

        Location location = locationOpt.get();
        if (updated.getName() != null) location.setName(updated.getName());
        if (updated.getAddress() != null) location.setAddress(updated.getAddress());
        if (updated.getLatitude() != null) location.setLatitude(updated.getLatitude());
        if (updated.getLongitude() != null) location.setLongitude(updated.getLongitude());
        if (updated.getPricing() != null) {
            Map<String, Integer> mergedPricing = new HashMap<>(location.getPricing());
            mergedPricing.putAll(updated.getPricing());
            location.setPricing(mergedPricing);
        }
        location.setActive(updated.isActive());

        locationRepository.save(location);
        return ResponseEntity.ok(Map.of("message", "Location updated successfully", "location", location));
    }

    // Update pricing (admin only)
    @PatchMapping("/{id}/pricing")
    public ResponseEntity<?> updatePricing(@PathVariable String id, @RequestBody Map<String, Integer> pricing) {
        Optional<Location> locationOpt = locationRepository.findById(id);
        if (locationOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Location not found"));
        }

        Location location = locationOpt.get();
        Map<String, Integer> mergedPricing = new HashMap<>(location.getPricing());
        mergedPricing.putAll(pricing);
        location.setPricing(mergedPricing);

        locationRepository.save(location);
        return ResponseEntity.ok(Map.of("message", "Pricing updated successfully", "location", location));
    }

    // Delete location (admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLocation(@PathVariable String id) {
        Optional<Location> locationOpt = locationRepository.findById(id);
        if (locationOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Location not found"));
        }

        Location location = locationOpt.get();
        location.setActive(false);
        locationRepository.save(location);

        return ResponseEntity.ok(Map.of("message", "Location deleted successfully"));
    }
}