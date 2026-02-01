package com.parkease.repository;

import com.parkease.models.Slot;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SlotRepository extends MongoRepository<Slot, String> {
    List<Slot> findByLocationAndIsActiveTrueOrderBySlotNoAsc(String location);
    List<Slot> findByLocationAndStatusAndIsActiveTrueOrderBySlotNoAsc(String location, String status);
}