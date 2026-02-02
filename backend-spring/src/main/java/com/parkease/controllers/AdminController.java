package com.parkease.controllers;

import com.parkease.models.Booking;
import com.parkease.models.User;
import com.parkease.models.Location;
import com.parkease.models.Slot;
import com.parkease.repository.BookingRepository;
import com.parkease.repository.UserRepository;
import com.parkease.repository.LocationRepository;
import com.parkease.repository.SlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private SlotRepository slotRepository;

    // --- GET ALL BOOKINGS (ADMIN ONLY) ---
    @GetMapping("/bookings")
    public ResponseEntity<?> getAllBookings(@RequestParam(required = false) String locationId,
                                            @RequestParam(required = false) String status,
                                            @RequestParam(required = false) String startDate,
                                            @RequestParam(required = false) String endDate) {
        try {
            List<Booking> bookings = bookingRepository.findAll();
            List<Booking> filtered = new ArrayList<>();

            for (Booking b : bookings) {
                boolean match = true;
                if (locationId != null && !b.getLocation().equals(locationId)) match = false;
                if (status != null && !b.getBookingStatus().equals(status)) match = false;
                if (startDate != null && endDate != null) {
                    Date start = new Date(startDate);
                    Date end = new Date(endDate);
                    if (b.getBookingDate().before(start) || b.getBookingDate().after(end)) match = false;
                }
                if (match) filtered.add(b);
            }

            filtered.sort(Comparator.comparing(Booking::getCreatedAt).reversed());
            return ResponseEntity.ok(filtered);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching bookings", "error", e.getMessage()));
        }
    }

    // --- GET ALL USERS (ADMIN ONLY) ---
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestParam(required = false) String role,
                                         @RequestParam(required = false) Boolean isActive) {
        try {
            List<User> users = userRepository.findAll();
            List<User> filtered = new ArrayList<>();

            for (User u : users) {
                boolean match = true;
                if (role != null && !u.getRole().equals(role)) match = false;
                if (isActive != null && u.isActive() != isActive) match = false;
                if (match) filtered.add(u);
            }

            filtered.sort(Comparator.comparing(User::getId).reversed());
            return ResponseEntity.ok(filtered);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching users", "error", e.getMessage()));
        }
    }

    // --- GET USER DETAILS WITH BOOKINGS (ADMIN ONLY) ---
    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserDetails(@PathVariable String userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            User user = userOpt.get();

            List<Booking> bookings = bookingRepository.findByUserAndBookingStatus(userId, "upcoming");
            bookings.addAll(bookingRepository.findByUserAndBookingStatus(userId, "active"));
            bookings.addAll(bookingRepository.findByUserAndBookingStatus(userId, "completed"));
            bookings.addAll(bookingRepository.findByUserAndBookingStatus(userId, "cancelled"));

            int completed = (int) bookings.stream().filter(b -> "completed".equals(b.getBookingStatus())).count();
            int cancelled = (int) bookings.stream().filter(b -> "cancelled".equals(b.getBookingStatus())).count();
            double totalSpent = bookings.stream()
                    .filter(b -> "completed".equals(b.getPaymentStatus()))
                    .mapToDouble(Booking::getTotalAmount)
                    .sum();

            Map<String, Object> stats = Map.of(
                    "totalBookings", bookings.size(),
                    "completedBookings", completed,
                    "cancelledBookings", cancelled,
                    "totalSpent", totalSpent
            );

            return ResponseEntity.ok(Map.of("user", user, "bookings", bookings, "stats", stats));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching user details", "error", e.getMessage()));
        }
    }

    // --- TOGGLE USER ACTIVE STATUS (ADMIN ONLY) ---
    @PatchMapping("/users/{userId}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable String userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            User user = userOpt.get();
            user.setActive(!user.isActive());
            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                    "message", "User " + (user.isActive() ? "activated" : "deactivated") + " successfully",
                    "user", user
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error toggling user status", "error", e.getMessage()));
        }
    }

    // --- DELETE USER (ADMIN ONLY) ---
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            User user = userOpt.get();

            if ("admin".equals(user.getRole())) {
                return ResponseEntity.status(403).body(Map.of("message", "Cannot delete admin users"));
            }

            // Delete all bookings associated with this user
            bookingRepository.deleteAll(bookingRepository.findByUserAndBookingStatus(userId, "upcoming"));
            bookingRepository.deleteAll(bookingRepository.findByUserAndBookingStatus(userId, "active"));
            bookingRepository.deleteAll(bookingRepository.findByUserAndBookingStatus(userId, "completed"));
            bookingRepository.deleteAll(bookingRepository.findByUserAndBookingStatus(userId, "cancelled"));

            // Delete the user
            userRepository.deleteById(userId);

            return ResponseEntity.ok(Map.of("message", "User and associated bookings deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error deleting user", "error", e.getMessage()));
        }
    }

    // --- DASHBOARD STATISTICS (ADMIN ONLY) ---
    @GetMapping("/statistics/dashboard")
    public ResponseEntity<?> getDashboardStatistics(@RequestParam(required = false) String locationId,
                                                    @RequestParam(defaultValue = "daily") String period) {
        try {
            Date now = new Date();
            Calendar cal = Calendar.getInstance();
            cal.setTime(now);

            Date startDate;
            switch (period) {
                case "weekly":
                    cal.add(Calendar.DAY_OF_MONTH, -7);
                    startDate = cal.getTime();
                    break;
                case "monthly":
                    cal.add(Calendar.MONTH, -1);
                    startDate = cal.getTime();
                    break;
                default: // daily
                    cal.set(Calendar.HOUR_OF_DAY, 0);
                    cal.set(Calendar.MINUTE, 0);
                    cal.set(Calendar.SECOND, 0);
                    cal.set(Calendar.MILLISECOND, 0);
                    startDate = cal.getTime();
            }
            Date endDate = now;

            List<Booking> bookings = bookingRepository.findAll();
            bookings.removeIf(b -> b.getCreatedAt().before(startDate) || !"completed".equals(b.getPaymentStatus()));
            if (locationId != null) {
                bookings.removeIf(b -> !b.getLocation().equals(locationId));
            }

            double totalRevenue = bookings.stream().mapToDouble(Booking::getTotalAmount).sum();
            int totalBookings = bookings.size();
            long completedBookings = bookings.stream().filter(b -> "completed".equals(b.getBookingStatus())).count();
            long activeBookings = bookings.stream().filter(b -> "active".equals(b.getBookingStatus())).count();
            long cancelledBookings = bookings.stream().filter(b -> "cancelled".equals(b.getBookingStatus())).count();

            Map<String, Double> revenueByVehicleType = new HashMap<>();
            for (Booking b : bookings) {
                revenueByVehicleType.put(b.getVehicleType(),
                        revenueByVehicleType.getOrDefault(b.getVehicleType(), 0.0) + b.getTotalAmount());
            }

            long totalSlots = slotRepository.count();
            long availableSlots = 0;
            long bookedSlots = 0;
            if (locationId != null && !locationId.isEmpty()) {
                availableSlots = slotRepository.findByLocationAndStatusAndIsActiveTrueOrderBySlotNoAsc(locationId, "available").size();
                bookedSlots = slotRepository.findByLocationAndStatusAndIsActiveTrueOrderBySlotNoAsc(locationId, "booked").size();
            } else {
                // For all locations
                availableSlots = slotRepository.findAll().stream().filter(s -> "available".equals(s.getStatus()) && s.isActive()).count();
                bookedSlots = slotRepository.findAll().stream().filter(s -> "booked".equals(s.getStatus()) && s.isActive()).count();
            }

            double avgDuration = bookings.isEmpty() ? 0 :
                    bookings.stream().mapToInt(Booking::getDuration).average().orElse(0);

            return ResponseEntity.ok(Map.of(
                    "period", period,
                    "startDate", startDate,
                    "endDate", now,
                    "revenue", Map.of("total", totalRevenue, "byVehicleType", revenueByVehicleType),
                    "bookings", Map.of("total", totalBookings, "completed", completedBookings,
                            "active", activeBookings, "cancelled", cancelledBookings),
                    "slots", Map.of("total", totalSlots, "available", availableSlots, "booked", bookedSlots,
                            "occupancyRate", totalSlots > 0 ? (bookedSlots * 100.0 / totalSlots) : 0),
                    "averageDuration", Math.round(avgDuration)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching statistics", "error", e.getMessage()));
        }
    }

    // --- REVENUE COMPARISON (ADMIN ONLY) ---
    @GetMapping("/statistics/revenue-comparison")
    public ResponseEntity<?> getRevenueComparison(@RequestParam(required = false) String locationId) {
        try {
            List<Booking> allBookings = bookingRepository.findAll();

            // Filter by location if specified
            if (locationId != null && !locationId.isEmpty()) {
                allBookings.removeIf(b -> !b.getLocation().equals(locationId));
            }

            Date now = new Date();
            Calendar cal = Calendar.getInstance();

            // Daily (last 24 hours)
            cal.setTime(now);
            cal.add(Calendar.DAY_OF_MONTH, -1);
            Date dayAgo = cal.getTime();

            List<Booking> dailyBookings = new ArrayList<>();
            for (Booking b : allBookings) {
                if (b.getCreatedAt().after(dayAgo)) {
                    dailyBookings.add(b);
                }
            }

            double dailyRevenue = dailyBookings.stream()
                    .filter(b -> "completed".equals(b.getPaymentStatus()))
                    .mapToDouble(Booking::getTotalAmount)
                    .sum();

            // Weekly (last 7 days)
            cal.setTime(now);
            cal.add(Calendar.DAY_OF_MONTH, -7);
            Date weekAgo = cal.getTime();

            List<Booking> weeklyBookings = new ArrayList<>();
            for (Booking b : allBookings) {
                if (b.getCreatedAt().after(weekAgo)) {
                    weeklyBookings.add(b);
                }
            }

            double weeklyRevenue = weeklyBookings.stream()
                    .filter(b -> "completed".equals(b.getPaymentStatus()))
                    .mapToDouble(Booking::getTotalAmount)
                    .sum();

            // Monthly (last 30 days)
            cal.setTime(now);
            cal.add(Calendar.DAY_OF_MONTH, -30);
            Date monthAgo = cal.getTime();

            List<Booking> monthlyBookings = new ArrayList<>();
            for (Booking b : allBookings) {
                if (b.getCreatedAt().after(monthAgo)) {
                    monthlyBookings.add(b);
                }
            }

            double monthlyRevenue = monthlyBookings.stream()
                    .filter(b -> "completed".equals(b.getPaymentStatus()))
                    .mapToDouble(Booking::getTotalAmount)
                    .sum();

            return ResponseEntity.ok(Map.of(
                    "daily", Map.of(
                            "revenue", Math.round(dailyRevenue * 100) / 100.0,
                            "bookings", dailyBookings.size()
                    ),
                    "weekly", Map.of(
                            "revenue", Math.round(weeklyRevenue * 100) / 100.0,
                            "bookings", weeklyBookings.size()
                    ),
                    "monthly", Map.of(
                            "revenue", Math.round(monthlyRevenue * 100) / 100.0,
                            "bookings", monthlyBookings.size()
                    )
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(
                    Map.of("message", "Error fetching revenue comparison", "error", e.getMessage())
            );
        }
    }

    // --- PEAK HOURS ANALYSIS (ADMIN ONLY) ---
    @GetMapping("/statistics/peak-hours")
    public ResponseEntity<?> getPeakHours(
            @RequestParam(required = false) String locationId,
            @RequestParam(defaultValue = "7") int days) {
        try {
            List<Booking> allBookings = bookingRepository.findAll();

            // Filter by location and last N days
            Date now = new Date();
            Calendar cal = Calendar.getInstance();
            cal.setTime(now);
            cal.add(Calendar.DAY_OF_MONTH, -days);
            Date daysAgo = cal.getTime();

            List<Booking> filteredBookings = new ArrayList<>();
            for (Booking b : allBookings) {
                boolean match = b.getCreatedAt().after(daysAgo);
                if (locationId != null && !locationId.isEmpty()) {
                    match = match && b.getLocation().equals(locationId);
                }
                if (match) {
                    filteredBookings.add(b);
                }
            }

            // Count bookings by hour
            Map<Integer, Integer> hourlyCount = new HashMap<>();
            for (int i = 0; i < 24; i++) {
                hourlyCount.put(i, 0);
            }

            for (Booking b : filteredBookings) {
                Calendar bookingCal = Calendar.getInstance();
                bookingCal.setTime(b.getStartTime());
                int hour = bookingCal.get(Calendar.HOUR_OF_DAY);
                hourlyCount.put(hour, hourlyCount.get(hour) + 1);
            }

            // Create hourly distribution
            List<Map<String, Object>> hourlyDistribution = new ArrayList<>();
            for (int i = 0; i < 24; i++) {
                Map<String, Object> hourData = new HashMap<>();
                hourData.put("hour", i);
                hourData.put("bookings", hourlyCount.get(i));
                hourlyDistribution.add(hourData);
            }

            // Get peak hours (sorted by bookings descending)
            List<Map<String, Object>> peakHours = new ArrayList<>();
            List<Map.Entry<Integer, Integer>> sortedEntries = new ArrayList<>(hourlyCount.entrySet());
            sortedEntries.sort((e1, e2) -> e2.getValue().compareTo(e1.getValue()));

            for (Map.Entry<Integer, Integer> entry : sortedEntries) {
                Map<String, Object> map = new HashMap<>();
                map.put("hour", entry.getKey());
                map.put("bookings", entry.getValue());
                peakHours.add(map);
            }

            return ResponseEntity.ok(Map.of(
                    "hourlyDistribution", hourlyDistribution,
                    "peakHours", peakHours
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(
                    Map.of("message", "Error fetching peak hours", "error", e.getMessage())
            );
        }
    }
    // --- DELETE BOOKING (ADMIN ONLY) ---
    @DeleteMapping("/bookings/{bookingId}")
    public ResponseEntity<?> deleteBooking(@PathVariable String bookingId) {
        try {
            Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
            if (bookingOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Booking not found"));
            }
            bookingRepository.deleteById(bookingId);
            return ResponseEntity.ok(Map.of("message", "Booking deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error deleting booking", "error", e.getMessage()));
        }
    }

}