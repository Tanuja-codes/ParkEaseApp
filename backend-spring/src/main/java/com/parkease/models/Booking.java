package com.parkease.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "bookings")
@CompoundIndexes({
        @CompoundIndex(name = "user_status_idx", def = "{'user': 1, 'bookingStatus': 1}"),
        @CompoundIndex(name = "slot_start_idx", def = "{'slot': 1, 'startTime': 1}"),
        @CompoundIndex(name = "location_date_idx", def = "{'location': 1, 'bookingDate': 1}")
})
public class Booking {

    @Id
    private String id;

    private String bookingId;
    private String user;      // Reference to User ID
    private String slot;      // Reference to Slot ID
    private String location;  // Reference to Location ID

    private String vehicleNumber;
    private String vehicleType; // car, bike, bus, van, truck

    private Date bookingDate;
    private Date startTime;
    private Date endTime;

    private Date actualStartTime;
    private Date actualEndTime;

    private int duration = 0; // in minutes

    private double baseAmount;
    private double totalAmount;

    private String paymentStatus = "pending"; // pending, completed, refunded
    private String paymentId;

    private String bookingStatus = "upcoming"; // upcoming, active, completed, cancelled, no-show

    private boolean timerStarted = false;
    private Date timerEndedAt;

    private String cancellationReason;
    private Date cancelledAt;

    private Date createdAt = new Date();
    private Date updatedAt = new Date();

    // --- Getters and Setters ---
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }

    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }

    public String getSlot() { return slot; }
    public void setSlot(String slot) { this.slot = slot; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public Date getBookingDate() { return bookingDate; }
    public void setBookingDate(Date bookingDate) { this.bookingDate = bookingDate; }

    public Date getStartTime() { return startTime; }
    public void setStartTime(Date startTime) { this.startTime = startTime; }

    public Date getEndTime() { return endTime; }
    public void setEndTime(Date endTime) { this.endTime = endTime; }

    public Date getActualStartTime() { return actualStartTime; }
    public void setActualStartTime(Date actualStartTime) { this.actualStartTime = actualStartTime; }

    public Date getActualEndTime() { return actualEndTime; }
    public void setActualEndTime(Date actualEndTime) { this.actualEndTime = actualEndTime; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public double getBaseAmount() { return baseAmount; }
    public void setBaseAmount(double baseAmount) { this.baseAmount = baseAmount; }

    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getBookingStatus() { return bookingStatus; }
    public void setBookingStatus(String bookingStatus) { this.bookingStatus = bookingStatus; }

    public boolean isTimerStarted() { return timerStarted; }
    public void setTimerStarted(boolean timerStarted) { this.timerStarted = timerStarted; }

    public Date getTimerEndedAt() { return timerEndedAt; }
    public void setTimerEndedAt(Date timerEndedAt) { this.timerEndedAt = timerEndedAt; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public Date getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(Date cancelledAt) { this.cancelledAt = cancelledAt; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}