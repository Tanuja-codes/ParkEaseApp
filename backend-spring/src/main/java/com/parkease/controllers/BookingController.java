package com.parkease.controllers;

import com.parkease.models.Booking;
import com.parkease.models.Location;
import com.parkease.models.Slot;
import com.parkease.repository.BookingRepository;
import com.parkease.repository.LocationRepository;
import com.parkease.repository.SlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private LocationRepository locationRepository;

    // Generate unique booking ID
    private String generateBookingId() {
        return "BK" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // --- CREATE BOOKING ---
    @PostMapping("")
    public ResponseEntity<?> createBooking(@RequestBody Map<String, String> body,
                                           @RequestHeader("userId") String userId) {
        try {
            String slotId = body.get("slotId");
            String locationId = body.get("locationId");
            String vehicleNumber = body.get("vehicleNumber");
            String vehicleType = body.get("vehicleType");
            SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
            Date bookingDate = isoFormat.parse(body.get("bookingDate"));
            Date startTime = isoFormat.parse(body.get("startTime"));
            Date endTime = isoFormat.parse(body.get("endTime"));

            // Verify slot availability
            Optional<Slot> slotOpt = slotRepository.findById(slotId);
            if (slotOpt.isEmpty() || !"available".equals(slotOpt.get().getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Slot is not available"));
            }
            Slot slot = slotOpt.get();

            // Get location pricing
            Optional<Location> locationOpt = locationRepository.findById(locationId);
            if (locationOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Location not found"));
            }
            Location location = locationOpt.get();

            // Calculate duration and amount
            long durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            int duration = (int) Math.ceil(durationMinutes);
            int baseAmount = location.getPricing().getOrDefault(vehicleType, 15);
            int intervals = (int) Math.ceil((double) duration / 15);
            double totalAmount = baseAmount * intervals;

            // Create booking
            Booking booking = new Booking();
            booking.setBookingId(generateBookingId());
            booking.setUser(userId);
            booking.setSlot(slotId);
            booking.setLocation(locationId);
            booking.setVehicleNumber(vehicleNumber.toUpperCase());
            booking.setVehicleType(vehicleType);
            booking.setBookingDate(bookingDate);
            booking.setStartTime(startTime);
            booking.setEndTime(endTime);
            booking.setDuration(duration);
            booking.setBaseAmount(baseAmount);
            booking.setTotalAmount(totalAmount);
            booking.setPaymentStatus("completed");
            booking.setPaymentId("PAY" + System.currentTimeMillis());
            booking.setBookingStatus("upcoming");

            bookingRepository.save(booking);

            // Update slot status
            slot.setStatus("booked");
            slot.setNextAvailableTime(endTime);
            slotRepository.save(slot);

            // Update location available slots
            location.setAvailableSlots(location.getAvailableSlots() - 1);
            locationRepository.save(location);

            return ResponseEntity.status(201).body(Map.of(
                    "message", "Booking created successfully",
                    "booking", booking
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error creating booking", "error", e.getMessage()));
        }
    }

    // --- GET USER BOOKINGS ---
    @GetMapping("/my-bookings")
    public ResponseEntity<?> getUserBookings(@RequestHeader("userId") String userId,
                                             @RequestParam(required = false) String status) {
        try {
            List<Booking> bookings;
            if (status != null) {
                bookings = bookingRepository.findByUserAndBookingStatus(userId, status);
            } else {
                bookings = bookingRepository.findByUserAndBookingStatus(userId, "upcoming");
                bookings.addAll(bookingRepository.findByUserAndBookingStatus(userId, "active"));
                bookings.addAll(bookingRepository.findByUserAndBookingStatus(userId, "completed"));
                bookings.addAll(bookingRepository.findByUserAndBookingStatus(userId, "cancelled"));
            }

            Date now = new Date();
            Map<String, List<Booking>> categorized = new HashMap<>();
            categorized.put("past", new ArrayList<>());
            categorized.put("current", new ArrayList<>());
            categorized.put("upcoming", new ArrayList<>());

            for (Booking booking : bookings) {
                if ("completed".equals(booking.getBookingStatus()) || "cancelled".equals(booking.getBookingStatus())) {
                    categorized.get("past").add(booking);
                } else if (booking.getStartTime().before(now) && booking.getEndTime().after(now)
                        && "active".equals(booking.getBookingStatus())) {
                    categorized.get("current").add(booking);
                } else if (booking.getStartTime().after(now) && "upcoming".equals(booking.getBookingStatus())) {
                    categorized.get("upcoming").add(booking);
                } else {
                    categorized.get("past").add(booking);
                }
            }

            return ResponseEntity.ok(categorized);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching bookings", "error", e.getMessage()));
        }
    }

    // --- GET SINGLE BOOKING ---
    @GetMapping("/{id}")
    public ResponseEntity<?> getBooking(@PathVariable String id,
                                        @RequestHeader("userId") String userId,
                                        @RequestHeader(value = "role", required = false) String role) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Booking not found"));
        }
        Booking booking = bookingOpt.get();

        if (!booking.getUser().equals(userId) && (role == null || !"admin".equals(role))) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }

        return ResponseEntity.ok(booking);
    }
    // --- START TIMER ---
    @PostMapping("/{id}/start-timer")
    public ResponseEntity<?> startTimer(@PathVariable String id,
                                        @RequestHeader("userId") String userId) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Booking not found"));
        }
        Booking booking = bookingOpt.get();

        if (!booking.getUser().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }
        if (booking.isTimerStarted()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Timer already started"));
        }

        Date now = new Date();
        if (now.before(booking.getStartTime())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot start timer before booking start time"));
        }

        booking.setTimerStarted(true);
        booking.setActualStartTime(now);
        booking.setBookingStatus("active");
        bookingRepository.save(booking);

        return ResponseEntity.ok(Map.of("message", "Timer started successfully", "booking", booking));
    }

    // --- STOP TIMER ---
    @PostMapping("/{id}/stop-timer")
    public ResponseEntity<?> stopTimer(@PathVariable String id,
                                       @RequestHeader("userId") String userId) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Booking not found"));
        }
        Booking booking = bookingOpt.get();

        if (!booking.getUser().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }
        if (!booking.isTimerStarted()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Timer not started"));
        }

        Date now = new Date();
        booking.setActualEndTime(now);
        booking.setTimerEndedAt(now);
        booking.setBookingStatus("completed");

        if (booking.getActualStartTime() != null) {
            int duration = (int) Math.ceil((now.getTime() - booking.getActualStartTime().getTime()) / (1000.0 * 60));
            booking.setDuration(duration);
        }
        bookingRepository.save(booking);

        // Release slot
        slotRepository.findById(booking.getSlot()).ifPresent(slot -> {
            slot.setStatus("available");
            slot.setNextAvailableTime(now);
            slotRepository.save(slot);
        });

        // Update location
        locationRepository.findById(booking.getLocation()).ifPresent(location -> {
            location.setAvailableSlots(location.getAvailableSlots() + 1);
            locationRepository.save(location);
        });

        return ResponseEntity.ok(Map.of("message", "Timer stopped and slot released successfully", "booking", booking));
    }

    // --- CANCEL BOOKING ---
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable String id,
                                           @RequestHeader("userId") String userId,
                                           @RequestBody(required = false) Map<String, String> body) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Booking not found"));
        }
        Booking booking = bookingOpt.get();

        if (!booking.getUser().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }
        if (booking.isTimerStarted()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot cancel booking after timer has started"));
        }
        if ("completed".equals(booking.getBookingStatus()) || "cancelled".equals(booking.getBookingStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Booking already completed or cancelled"));
        }

        booking.setBookingStatus("cancelled");
        booking.setCancellationReason(body != null ? body.getOrDefault("reason", "User cancelled") : "User cancelled");
        booking.setCancelledAt(new Date());
        booking.setPaymentStatus("refunded");
        bookingRepository.save(booking);

        // Release slot
        slotRepository.findById(booking.getSlot()).ifPresent(slot -> {
            slot.setStatus("available");
            slot.setNextAvailableTime(new Date());
            slotRepository.save(slot);
        });

        // Update location
        locationRepository.findById(booking.getLocation()).ifPresent(location -> {
            location.setAvailableSlots(location.getAvailableSlots() + 1);
            locationRepository.save(location);
        });

        return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully", "booking", booking));
    }

    // --- EXTEND BOOKING ---
    @PostMapping("/{id}/extend")
    public ResponseEntity<?> extendBooking(@PathVariable String id,
                                           @RequestHeader("userId") String userId) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Booking not found"));
        }
        Booking booking = bookingOpt.get();

        if (!booking.getUser().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }
        if (!booking.isTimerStarted()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Timer must be started to extend booking"));
        }
        if ("completed".equals(booking.getBookingStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot extend completed booking"));
        }

        // Extend by 15 minutes
        booking.setEndTime(new Date(booking.getEndTime().getTime() + 15 * 60 * 1000));
        booking.setTotalAmount(booking.getTotalAmount() + 10);

        int duration = (int) Math.ceil((booking.getEndTime().getTime() - booking.getStartTime().getTime()) / (1000.0 * 60));
        booking.setDuration(duration);

        bookingRepository.save(booking);

        return ResponseEntity.ok(Map.of(
                "message", "Booking extended by 15 minutes for ₹10",
                "booking", booking,
                "newEndTime", booking.getEndTime(),
                "newTotalAmount", booking.getTotalAmount()
        ));
    }

    // --- DELETE BOOKING ---
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable String id,
                                           @RequestHeader("userId") String userId,
                                           @RequestHeader(value = "role", required = false) String role) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Booking not found"));
        }
        Booking booking = bookingOpt.get();

        if (!booking.getUser().equals(userId) && (role == null || !"admin".equals(role))) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }
        if (!List.of("completed", "cancelled").contains(booking.getBookingStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Can only delete completed or cancelled bookings"));
        }

        bookingRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Booking deleted successfully"));
    }
}