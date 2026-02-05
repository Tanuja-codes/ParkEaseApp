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

    // Helper method to populate booking with slot and location details
    private Map<String, Object> populateBookingDetails(Booking booking) {
        Map<String, Object> bookingMap = new HashMap<>();

        // Copy all booking fields
        bookingMap.put("_id", booking.getId());
        bookingMap.put("bookingId", booking.getBookingId());
        bookingMap.put("user", booking.getUser());
        bookingMap.put("vehicleNumber", booking.getVehicleNumber());
        bookingMap.put("vehicleType", booking.getVehicleType());
        bookingMap.put("bookingDate", booking.getBookingDate());
        bookingMap.put("startTime", booking.getStartTime());
        bookingMap.put("endTime", booking.getEndTime());
        bookingMap.put("duration", booking.getDuration());
        bookingMap.put("baseAmount", booking.getBaseAmount());
        bookingMap.put("totalAmount", booking.getTotalAmount());
        bookingMap.put("paymentStatus", booking.getPaymentStatus());
        bookingMap.put("paymentId", booking.getPaymentId());
        bookingMap.put("bookingStatus", booking.getBookingStatus());
        bookingMap.put("timerStarted", booking.isTimerStarted());
        bookingMap.put("actualStartTime", booking.getActualStartTime());
        bookingMap.put("actualEndTime", booking.getActualEndTime());
        bookingMap.put("timerEndedAt", booking.getTimerEndedAt());
        bookingMap.put("createdAt", booking.getCreatedAt());

        // Populate slot details
        Optional<Slot> slotOpt = slotRepository.findById(booking.getSlot());
        if (slotOpt.isPresent()) {
            Slot slot = slotOpt.get();
            Map<String, Object> slotMap = new HashMap<>();
            slotMap.put("_id", slot.getId());
            slotMap.put("slotNo", slot.getSlotNo());
            slotMap.put("vehicleType", slot.getVehicleType());
            slotMap.put("status", slot.getStatus());
            bookingMap.put("slot", slotMap);
            bookingMap.put("slotNo", slot.getSlotNo()); // Add direct slotNo field
        } else {
            bookingMap.put("slot", null);
            bookingMap.put("slotNo", "N/A");
        }

        // Populate location details
        Optional<Location> locationOpt = locationRepository.findById(booking.getLocation());
        if (locationOpt.isPresent()) {
            Location location = locationOpt.get();
            Map<String, Object> locationMap = new HashMap<>();
            locationMap.put("_id", location.getId());
            locationMap.put("name", location.getName());
            locationMap.put("address", location.getAddress());
            locationMap.put("latitude", location.getLatitude());
            locationMap.put("longitude", location.getLongitude());
            bookingMap.put("location", locationMap);
        } else {
            bookingMap.put("location", null);
        }

        return bookingMap;
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

            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
            Date bookingDate = dateFormat.parse(body.get("bookingDate"));
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
                    "booking", populateBookingDetails(booking)
            ));
        } catch (Exception e) {
            e.printStackTrace();
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
                bookings = new ArrayList<>();
                bookings.addAll(bookingRepository.findByUserAndBookingStatus(userId, "upcoming"));
                bookings.addAll(bookingRepository.findByUserAndBookingStatus(userId, "active"));
                bookings.addAll(bookingRepository.findByUserAndBookingStatus(userId, "completed"));
                bookings.addAll(bookingRepository.findByUserAndBookingStatus(userId, "cancelled"));
            }

            Date now = new Date();
            Map<String, List<Map<String, Object>>> categorized = new HashMap<>();
            categorized.put("past", new ArrayList<>());
            categorized.put("current", new ArrayList<>());
            categorized.put("upcoming", new ArrayList<>());

            for (Booking booking : bookings) {
                Map<String, Object> populatedBooking = populateBookingDetails(booking);

                if ("completed".equals(booking.getBookingStatus()) || "cancelled".equals(booking.getBookingStatus())) {
                    categorized.get("past").add(populatedBooking);
                } else if (booking.getStartTime().before(now) && booking.getEndTime().after(now)
                        && "active".equals(booking.getBookingStatus())) {
                    categorized.get("current").add(populatedBooking);
                } else if (booking.getStartTime().after(now) && "upcoming".equals(booking.getBookingStatus())) {
                    categorized.get("upcoming").add(populatedBooking);
                } else if (booking.getEndTime().before(now) && !"completed".equals(booking.getBookingStatus()) && !"cancelled".equals(booking.getBookingStatus())) {
                    // Auto-complete past bookings that weren't completed
                    booking.setBookingStatus("completed");
                    bookingRepository.save(booking);
                    categorized.get("past").add(populatedBooking);
                } else {
                    categorized.get("past").add(populatedBooking);
                }
            }

            return ResponseEntity.ok(categorized);
        } catch (Exception e) {
            e.printStackTrace();
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

        return ResponseEntity.ok(populateBookingDetails(booking));
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

        return ResponseEntity.ok(Map.of("message", "Timer started successfully", "booking", populateBookingDetails(booking)));
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

        return ResponseEntity.ok(Map.of("message", "Timer stopped and slot released successfully", "booking", populateBookingDetails(booking)));
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

        return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully", "booking",populateBookingDetails(booking)));
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
                "booking", populateBookingDetails(booking),
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