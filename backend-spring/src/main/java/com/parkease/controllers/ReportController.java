package com.parkease.controllers;

import com.parkease.models.Booking;
import com.parkease.repository.BookingRepository;
import com.parkease.repository.LocationRepository;
import com.parkease.repository.SlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private SlotRepository slotRepository;

    // --- MONTHLY USAGE REPORT ---
    @GetMapping("/monthly-usage")
    public ResponseEntity<?> getMonthlyUsage(@RequestParam(required = false) String locationId,
                                             @RequestParam(required = false) Integer year,
                                             @RequestParam(required = false) Integer month) {
        try {
            Calendar cal = Calendar.getInstance();
            int currentYear = (year != null) ? year : cal.get(Calendar.YEAR);
            int currentMonth = (month != null) ? month - 1 : cal.get(Calendar.MONTH);

            Date startDate = new GregorianCalendar(currentYear, currentMonth, 1).getTime();
            cal = new GregorianCalendar(currentYear, currentMonth,
                    cal.getActualMaximum(Calendar.DAY_OF_MONTH), 23, 59, 59);
            Date endDate = cal.getTime();

            List<Booking> bookings = bookingRepository.findAll();
            bookings.removeIf(b -> b.getBookingDate().before(startDate) || b.getBookingDate().after(endDate));
            if (locationId != null) {
                bookings.removeIf(b -> !b.getLocation().equals(locationId));
            }

            int totalBookings = bookings.size();
            long completedBookings = bookings.stream().filter(b -> "completed".equals(b.getBookingStatus())).count();
            double totalRevenue = bookings.stream()
                    .filter(b -> "completed".equals(b.getPaymentStatus()))
                    .mapToDouble(Booking::getTotalAmount)
                    .sum();
            double avgDuration = bookings.isEmpty() ? 0 :
                    bookings.stream().mapToInt(Booking::getDuration).average().orElse(0);

            // Peak hour
            Map<Integer, Integer> hourlyBookings = new HashMap<>();
            for (Booking b : bookings) {
                int hour = b.getStartTime().getHours();
                hourlyBookings.put(hour, hourlyBookings.getOrDefault(hour, 0) + 1);
            }
            Optional<Map.Entry<Integer, Integer>> peakHour = hourlyBookings.entrySet()
                    .stream().max(Map.Entry.comparingByValue());

            // Daily bookings
            Map<Integer, Integer> dailyBookings = new HashMap<>();
            for (Booking b : bookings) {
                int day = b.getBookingDate().getDate();
                dailyBookings.put(day, dailyBookings.getOrDefault(day, 0) + 1);
            }

            // User segmentation
            Map<String, Integer> userBookingCounts = new HashMap<>();
            for (Booking b : bookings) {
                userBookingCounts.put(b.getUser(),
                        userBookingCounts.getOrDefault(b.getUser(), 0) + 1);
            }
            int newUsers = 0, returningUsers = 0;
            for (int count : userBookingCounts.values()) {
                if (count == 1) newUsers++;
                else returningUsers++;
            }

            Map<String, Object> response = Map.of(
                    "period", Map.of("month", currentMonth + 1, "year", currentYear,
                            "startDate", startDate, "endDate", endDate),
                    "summary", Map.of("totalBookings", totalBookings,
                            "completedBookings", completedBookings,
                            "totalRevenue", totalRevenue,
                            "averageDuration", Math.round(avgDuration),
                            "peakHour", peakHour.isPresent() ? peakHour.get().getKey() + ":00" : "N/A"),
                    "dailyBookings", dailyBookings,
                    "userSegmentation", Map.of("newUsers", newUsers, "returningUsers", returningUsers)
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error generating report", "error", e.getMessage()));
        }
    }

    // --- EXPORT BOOKINGS TO CSV ---
    @GetMapping("/export/bookings")
    public ResponseEntity<?> exportBookingsToCSV(@RequestParam(required = false) String locationId,
                                                 @RequestParam(required = false) String startDate,
                                                 @RequestParam(required = false) String endDate,
                                                 @RequestParam(required = false) String slotId,
                                                 @RequestParam(required = false) String status) {
        try {
            List<Booking> bookings = bookingRepository.findAll();

            if (locationId != null) bookings.removeIf(b -> !b.getLocation().equals(locationId));
            if (slotId != null) bookings.removeIf(b -> !b.getSlot().equals(slotId));
            if (status != null) bookings.removeIf(b -> !b.getBookingStatus().equals(status));
            if (startDate != null && endDate != null) {
                Date start = new Date(startDate);
                Date end = new Date(endDate);
                bookings.removeIf(b -> b.getBookingDate().before(start) || b.getBookingDate().after(end));
            }

            StringBuilder csv = new StringBuilder();
            List<String> headers = Arrays.asList("Booking ID", "User ID", "Location ID", "Slot ID",
                    "Vehicle Number", "Vehicle Type", "Booking Date", "Start Time", "End Time",
                    "Duration (minutes)", "Amount", "Payment Status", "Booking Status", "Created At");
            csv.append(String.join(",", headers)).append("\n");

            for (Booking b : bookings) {
                List<String> row = Arrays.asList(
                        b.getBookingId(),
                        b.getUser(),
                        b.getLocation(),
                        b.getSlot(),
                        b.getVehicleNumber(),
                        b.getVehicleType(),
                        b.getBookingDate().toString(),
                        b.getStartTime().toString(),
                        b.getEndTime().toString(),
                        String.valueOf(b.getDuration()),
                        String.valueOf(b.getTotalAmount()),
                        b.getPaymentStatus(),
                        b.getBookingStatus(),
                        b.getCreatedAt().toString()
                );
                csv.append(String.join(",", row)).append("\n");
            }

            return ResponseEntity.ok()
                    .header("Content-Type", "text/csv")
                    .header("Content-Disposition", "attachment; filename=bookings-" + System.currentTimeMillis() + ".csv")
                    .body(csv.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error exporting bookings", "error", e.getMessage()));
        }
    }

    // --- EXPORT SLOT USAGE TO CSV ---
    @GetMapping("/export/slot-usage")
    public ResponseEntity<?> exportSlotUsage(@RequestParam(required = false) String locationId,
                                             @RequestParam(required = false) String startDate,
                                             @RequestParam(required = false) String endDate) {
        try {
            List<Booking> bookings = bookingRepository.findAll();

            if (locationId != null) bookings.removeIf(b -> !b.getLocation().equals(locationId));
            if (startDate != null && endDate != null) {
                Date start = new Date(startDate);
                Date end = new Date(endDate);
                bookings.removeIf(b -> b.getBookingDate().before(start) || b.getBookingDate().after(end));
            }

            Map<String, Map<String, Object>> slotUsage = new HashMap<>();
            for (Booking b : bookings) {
                String slotKey = b.getLocation() + "-" + b.getSlot();
                slotUsage.putIfAbsent(slotKey, new HashMap<>(Map.of(
                        "Location ID", b.getLocation(),
                        "Slot Number", b.getSlot(),
                        "Total Bookings", 0,
                        "Total Duration (minutes)", 0,
                        "Total Revenue", 0.0
                )));
                Map<String, Object> usage = slotUsage.get(slotKey);
                usage.put("Total Bookings", (int) usage.get("Total Bookings") + 1);
                usage.put("Total Duration (minutes)", (int) usage.get("Total Duration (minutes)") + b.getDuration());
                if ("completed".equals(b.getPaymentStatus())) {
                    usage.put("Total Revenue", (double) usage.get("Total Revenue") + b.getTotalAmount());
                }
            }

            StringBuilder csv = new StringBuilder();
            List<String> headers = Arrays.asList("Location ID", "Slot Number", "Total Bookings",
                    "Total Duration (minutes)", "Average Duration (minutes)", "Total Revenue", "Average Revenue");
            csv.append(String.join(",", headers)).append("\n");

            for (Map<String, Object> usage : slotUsage.values()) {
                int totalBookings = (int) usage.get("Total Bookings");
                int totalDuration = (int) usage.get("Total Duration (minutes)");
                double totalRevenue = (double) usage.get("Total Revenue");
                int avgDuration = totalBookings > 0 ? Math.round((float) totalDuration / totalBookings) : 0;
                double avgRevenue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

                List<String> row = Arrays.asList(
                        usage.get("Location ID").toString(),
                        usage.get("Slot Number").toString(),
                        String.valueOf(totalBookings),
                        String.valueOf(totalDuration),
                        String.valueOf(avgDuration),
                        String.valueOf(totalRevenue),
                        String.valueOf(avgRevenue)
                );
                csv.append(String.join(",", row)).append("\n");
            }

            return ResponseEntity.ok()
                    .header("Content-Type", "text/csv")
                    .header("Content-Disposition", "attachment; filename=slot-usage-" + System.currentTimeMillis() + ".csv")
                    .body(csv.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error exporting slot usage", "error", e.getMessage()));
        }
    }

    // --- EXPORT REVENUE REPORT TO CSV ---
    @GetMapping("/export/revenue")
    public ResponseEntity<?> exportRevenueReport(@RequestParam(required = false) String locationId,
                                                 @RequestParam(required = false) String startDate,
                                                 @RequestParam(required = false) String endDate,
                                                 @RequestParam(defaultValue = "daily") String groupBy) {
        try {
            List<Booking> bookings = bookingRepository.findAll();
            bookings.removeIf(b -> !"completed".equals(b.getPaymentStatus()));

            if (locationId != null) bookings.removeIf(b -> !b.getLocation().equals(locationId));
            if (startDate != null && endDate != null) {
                Date start = new Date(startDate);
                Date end = new Date(endDate);
                bookings.removeIf(b -> b.getCreatedAt().before(start) || b.getCreatedAt().after(end));
            }

            Map<String, Map<String, Object>> revenueData = new HashMap<>();
            for (Booking b : bookings) {
                Date date = b.getCreatedAt();
                String dateKey;
                if ("weekly".equals(groupBy)) {
                    Calendar cal = Calendar.getInstance();
                    cal.setTime(date);
                    cal.set(Calendar.DAY_OF_WEEK, cal.getFirstDayOfWeek());
                    dateKey = cal.getTime().toString();
                } else if ("monthly".equals(groupBy)) {
                    dateKey = date.getYear() + "-" + (date.getMonth() + 1);
                } else {
                    dateKey = date.toString().substring(0, 10); // daily
                }

                revenueData.putIfAbsent(dateKey, new HashMap<>(Map.of(
                        "Date", dateKey,
                        "Total Revenue", 0.0,
                        "Total Bookings", 0,
                        "Car Revenue", 0.0,
                        "Bike Revenue", 0.0,
                        "Bus Revenue", 0.0,
                        "Van Revenue", 0.0,
                        "Truck Revenue", 0.0
                )));
                Map<String, Object> data = revenueData.get(dateKey);
                data.put("Total Revenue", (double) data.get("Total Revenue") + b.getTotalAmount());
                data.put("Total Bookings", (int) data.get("Total Bookings") + 1);

                String vt = b.getVehicleType();
                String key = vt.substring(0, 1).toUpperCase() + vt.substring(1) + " Revenue";
                data.put(key, (double) data.get(key) + b.getTotalAmount());
            }

            StringBuilder csv = new StringBuilder();
            List<String> headers = Arrays.asList("Date", "Total Revenue", "Total Bookings",
                    "Car Revenue", "Bike Revenue", "Bus Revenue", "Van Revenue", "Truck Revenue", "Average Revenue");
            csv.append(String.join(",", headers)).append("\n");

            for (Map<String, Object> data : revenueData.values()) {
                int totalBookings = (int) data.get("Total Bookings");
                double totalRevenue = (double) data.get("Total Revenue");
                double avgRevenue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

                List<String> row = Arrays.asList(
                        data.get("Date").toString(),
                        String.valueOf(totalRevenue),
                        String.valueOf(totalBookings),
                        String.valueOf(data.get("Car Revenue")),
                        String.valueOf(data.get("Bike Revenue")),
                        String.valueOf(data.get("Bus Revenue")),
                        String.valueOf(data.get("Van Revenue")),
                        String.valueOf(data.get("Truck Revenue")),
                        String.valueOf(avgRevenue)
                );
                csv.append(String.join(",", row)).append("\n");
            }

            return ResponseEntity.ok()
                    .header("Content-Type", "text/csv")
                    .header("Content-Disposition", "attachment; filename=revenue-report-" + System.currentTimeMillis() + ".csv")
                    .body(csv.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error exporting revenue report", "error", e.getMessage()));
        }
    }
}