package com.parkease.repository;

import com.parkease.models.Location;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface LocationRepository extends MongoRepository<Location, String> {
    Optional<Location> findByLocationId(String locationId);
}