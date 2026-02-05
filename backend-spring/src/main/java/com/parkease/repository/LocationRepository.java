package com.parkease.repository;

import com.parkease.models.Location;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LocationRepository extends MongoRepository<Location, String> {
    List<Location> findByIsActiveTrue();

    // NEW METHOD - Find locations created by a specific admin
    List<Location> findByCreatedBy(String adminId);
    List<Location> findByCreatedByAndIsActiveTrue(String adminId);
}