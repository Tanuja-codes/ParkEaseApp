package com.parkease.repository;

import com.parkease.models.Slot;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SlotRepository extends MongoRepository<Slot, String> {
    // For primitive boolean 'isActive', Spring Data uses 'IsActive' (not 'Active')
    List<Slot> findByLocationAndIsActiveTrueOrderBySlotNoAsc(String location);
    List<Slot> findByLocationAndStatusAndIsActiveTrueOrderBySlotNoAsc(String location, String status);

    // Add these for testing
    List<Slot> findByLocation(String location);
    List<Slot> findByIsActiveTrue();
    List<Slot> findAll();
}