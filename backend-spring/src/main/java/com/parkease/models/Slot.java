package com.parkease.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "slots")
@CompoundIndex(name = "slot_location_idx", def = "{'slotNo': 1, 'location': 1}", unique = true)
public class Slot {

    @Id
    private String id;

    @NotBlank
    private String slotNo;

    @NotBlank
    private String location; // Reference to Location document (ObjectId as String)

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    private String status = "available"; // available, booked, maintenance

    private String vehicleType = "all"; // all, car, bike, bus, van, truck

    private Date nextAvailableTime = new Date();

    private boolean isActive = true;

    // --- Getters and Setters ---
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSlotNo() { return slotNo; }
    public void setSlotNo(String slotNo) { this.slotNo = slotNo; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public Date getNextAvailableTime() { return nextAvailableTime; }
    public void setNextAvailableTime(Date nextAvailableTime) { this.nextAvailableTime = nextAvailableTime; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}