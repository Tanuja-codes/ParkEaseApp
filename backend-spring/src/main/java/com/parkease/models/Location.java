package com.parkease.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.Map;

@Document(collection = "locations")
public class Location {

    @Id
    private String id;

    @NotBlank
    private String locationId;

    @NotBlank
    private String name;

    @NotBlank
    private String address;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    private int totalSlots = 0;
    private int availableSlots = 0;

    private Map<String, Integer> pricing = Map.of(
            "car", 15, "bike", 10, "bus", 25, "van", 20, "truck", 22
    );

    private boolean isActive = true;

    // NEW FIELD - Track which admin created this location
    private String createdBy; // Admin's userId

    private Date createdAt = new Date();
    private Date updatedAt = new Date();

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLocationId() { return locationId; }
    public void setLocationId(String locationId) { this.locationId = locationId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public int getTotalSlots() { return totalSlots; }
    public void setTotalSlots(int totalSlots) { this.totalSlots = totalSlots; }

    public int getAvailableSlots() { return availableSlots; }
    public void setAvailableSlots(int availableSlots) { this.availableSlots = availableSlots; }

    public Map<String, Integer> getPricing() { return pricing; }
    public void setPricing(Map<String, Integer> pricing) { this.pricing = pricing; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    // NEW GETTER/SETTER
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}