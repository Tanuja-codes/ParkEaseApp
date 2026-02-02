package com.parkease.controllers;

import com.parkease.models.Slot;
import com.parkease.repository.SlotRepository;
import com.parkease.repository.LocationRepository;
import com.parkease.models.Location;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/slots")
//@CrossOrigin(origins = "*")
public class SlotController {

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private LocationRepository locationRepository;

    // Get all slots for a location
    @GetMapping("/location/{locationId}")
    public ResponseEntity<?> getSlots(@PathVariable String locationId) {
        List<Slot> slots = slotRepository.findByLocationAndIsActiveTrueOrderBySlotNoAsc(locationId);
        return ResponseEntity.ok(slots);
    }

    // Get available slots for booking
    @GetMapping("/location/{locationId}/available")
    public ResponseEntity<?> getAvailableSlots(@PathVariable String locationId,
                                               @RequestParam(required = false) Date startTime) {
        List<Slot> slots = slotRepository.findByLocationAndStatusAndIsActiveTrueOrderBySlotNoAsc(locationId, "available");

        // Only filter by nextAvailableTime if startTime is provided
        if (startTime != null) {
            slots.removeIf(slot -> slot.getNextAvailableTime() != null &&
                    slot.getNextAvailableTime().after(startTime));
        }

        return ResponseEntity.ok(slots);
    }

    // Create slot (admin only)
    @PostMapping("")
    public ResponseEntity<?> createSlot(@Valid @RequestBody Slot slot) {
        Optional<Location> locationOpt = locationRepository.findById(slot.getLocation());
        if (locationOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Location not found"));
        }

        // Check duplicate slot
        List<Slot> existing = slotRepository.findByLocationAndIsActiveTrueOrderBySlotNoAsc(slot.getLocation());
        if (existing.stream().anyMatch(s -> s.getSlotNo().equals(slot.getSlotNo()))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Slot number already exists for this location"));
        }

        slotRepository.save(slot);

        Location location = locationOpt.get();
        location.setTotalSlots(location.getTotalSlots() + 1);
        location.setAvailableSlots(location.getAvailableSlots() + 1);
        locationRepository.save(location);

        return ResponseEntity.status(201).body(Map.of("message", "Slot created successfully", "slot", slot));
    }

    // Update slot (admin only)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSlot(@PathVariable String id, @RequestBody Slot updatedSlot) {
        Optional<Slot> slotOpt = slotRepository.findById(id);
        if (slotOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Slot not found"));
        }

        Slot slot = slotOpt.get();
        if (updatedSlot.getSlotNo() != null) slot.setSlotNo(updatedSlot.getSlotNo());
        if (updatedSlot.getLatitude() != null) slot.setLatitude(updatedSlot.getLatitude());
        if (updatedSlot.getLongitude() != null) slot.setLongitude(updatedSlot.getLongitude());
        if (updatedSlot.getVehicleType() != null) slot.setVehicleType(updatedSlot.getVehicleType());
        if (updatedSlot.getNextAvailableTime() != null) slot.setNextAvailableTime(updatedSlot.getNextAvailableTime());

        slotRepository.save(slot);
        return ResponseEntity.ok(Map.of("message", "Slot updated successfully", "slot", slot));
    }

    // Toggle slot status (admin only)
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateSlotStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (!List.of("available", "booked", "maintenance").contains(status)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status"));
        }

        Optional<Slot> slotOpt = slotRepository.findById(id);
        if (slotOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Slot not found"));
        }

        Slot slot = slotOpt.get();
        String oldStatus = slot.getStatus();
        slot.setStatus(status);
        slotRepository.save(slot);

        Optional<Location> locationOpt = locationRepository.findById(slot.getLocation());
        if (locationOpt.isPresent()) {
            Location location = locationOpt.get();
            if (!"available".equals(oldStatus) && "available".equals(status)) {
                location.setAvailableSlots(location.getAvailableSlots() + 1);
            } else if ("available".equals(oldStatus) && !"available".equals(status)) {
                location.setAvailableSlots(location.getAvailableSlots() - 1);
            }
            locationRepository.save(location);
        }

        return ResponseEntity.ok(Map.of("message", "Slot status updated successfully", "slot", slot));
    }

    // Delete slot (admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSlot(@PathVariable String id) {
        Optional<Slot> slotOpt = slotRepository.findById(id);
        if (slotOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Slot not found"));
        }

        Slot slot = slotOpt.get();
        if ("booked".equals(slot.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete a booked slot"));
        }

        slot.setActive(false);
        slotRepository.save(slot);

        Optional<Location> locationOpt = locationRepository.findById(slot.getLocation());
        if (locationOpt.isPresent()) {
            Location location = locationOpt.get();
            location.setTotalSlots(location.getTotalSlots() - 1);
            if ("available".equals(slot.getStatus())) {
                location.setAvailableSlots(location.getAvailableSlots() - 1);
            }
            locationRepository.save(location);
        }

        return ResponseEntity.ok(Map.of("message", "Slot deleted successfully"));
    }
}