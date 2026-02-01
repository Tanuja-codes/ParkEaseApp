package com.parkease.repository;

import com.parkease.models.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUserAndBookingStatus(String user, String bookingStatus);
    List<Booking> findBySlotAndStartTime(String slot, java.util.Date startTime);
    List<Booking> findByLocationAndBookingDate(String location, java.util.Date bookingDate);
}