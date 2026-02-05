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

    // Get all locations - UPDATED to support admin filtering
    @GetMapping("")
    public ResponseEntity<?> getAllLocations(
            @RequestHeader(value = "userId", required = false) String userId,
            @RequestHeader(value = "role", required = false) String role) {
        try {
            System.out.println("========== GET ALL LOCATIONS ==========");
            System.out.println("userId: " + userId);
            System.out.println("role: " + role);

            List<Location> locations;

            if ("admin".equals(role) && userId != null) {
                System.out.println("Admin mode - filtering by createdBy: " + userId);
                locations = locationRepository.findByCreatedByAndIsActiveTrue(userId);
                System.out.println("Found " + locations.size() + " locations");
            } else {
                System.out.println("User mode - showing all active locations");
                locations = locationRepository.findByIsActiveTrue();
                System.out.println("Found " + locations.size() + " locations");
            }

            System.out.println("========================================");
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching locations"));
        }
    }

    // Get single location
    @GetMapping("/{id}")
    public ResponseEntity<?> getLocation(@PathVariable String id) {
        Optional<Location> location = locationRepository.findById(id);
        if (location.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Location not found"));
        }
        return ResponseEntity.ok(location.get());
    }

    // Create location - UPDATED to set createdBy
    @PostMapping("")
    public ResponseEntity<?> createLocation(
            @Valid @RequestBody Location location,
            @RequestHeader("userId") String userId) {
        try {
            // DEBUG PRINTS
            System.out.println("========== CREATE LOCATION ==========");
            System.out.println("userId from header: " + userId);
            System.out.println("Location name: " + location.getName());

            // Set the admin who created this location
            location.setCreatedBy(userId);

            System.out.println("Set createdBy to: " + location.getCreatedBy());
            System.out.println("====================================");

            location.setCreatedAt(new Date());
            location.setUpdatedAt(new Date());

            locationRepository.save(location);
            return ResponseEntity.status(201).body(Map.of(
                    "message", "Location created successfully",
                    "location", location
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Error creating location", "error", e.getMessage()));
        }
    }

    // Update location - UPDATED to check ownership
    @PutMapping("/{id}")
    public ResponseEntity<?> updateLocation(
            @PathVariable String id,
            @RequestBody Location updatedLocation,
            @RequestHeader("userId") String userId,
            @RequestHeader(value = "role", required = false) String role) {
        try {
            Optional<Location> locationOpt = locationRepository.findById(id);
            if (locationOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Location not found"));
            }

            Location location = locationOpt.get();

            // Check if admin owns this location
            if ("admin".equals(role) && !location.getCreatedBy().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("message", "You can only update your own locations"));
            }

            if (updatedLocation.getName() != null) location.setName(updatedLocation.getName());
            if (updatedLocation.getAddress() != null) location.setAddress(updatedLocation.getAddress());
            if (updatedLocation.getLatitude() != null) location.setLatitude(updatedLocation.getLatitude());
            if (updatedLocation.getLongitude() != null) location.setLongitude(updatedLocation.getLongitude());
            location.setUpdatedAt(new Date());

            locationRepository.save(location);
            return ResponseEntity.ok(Map.of("message", "Location updated successfully", "location", location));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error updating location"));
        }
    }

    // Update pricing - UPDATED to check ownership
    @PatchMapping("/{id}/pricing")
    public ResponseEntity<?> updatePricing(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader("userId") String userId,
            @RequestHeader(value = "role", required = false) String role) {
        try {
            Optional<Location> locationOpt = locationRepository.findById(id);
            if (locationOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Location not found"));
            }

            Location location = locationOpt.get();

            // Check if admin owns this location
            if ("admin".equals(role) && !location.getCreatedBy().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("message", "You can only update pricing for your own locations"));
            }

            @SuppressWarnings("unchecked")
            Map<String, Integer> pricing = (Map<String, Integer>) body.get("pricing");
            location.setPricing(pricing);
            location.setUpdatedAt(new Date());

            locationRepository.save(location);
            return ResponseEntity.ok(Map.of("message", "Pricing updated successfully", "location", location));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error updating pricing"));
        }
    }

    // Delete location - UPDATED to check ownership
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLocation(
            @PathVariable String id,
            @RequestHeader("userId") String userId,
            @RequestHeader(value = "role", required = false) String role) {
        try {
            Optional<Location> locationOpt = locationRepository.findById(id);
            if (locationOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Location not found"));
            }

            Location location = locationOpt.get();

            // Check if admin owns this location
            if ("admin".equals(role) && !location.getCreatedBy().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("message", "You can only delete your own locations"));
            }

            // Soft delete
            location.setActive(false);
            location.setUpdatedAt(new Date());
            locationRepository.save(location);

            return ResponseEntity.ok(Map.of("message", "Location deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error deleting location"));
        }
    }
}