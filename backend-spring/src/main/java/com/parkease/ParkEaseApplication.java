package com.parkease;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootApplication
public class ParkEaseApplication {

    private static final Logger logger = LoggerFactory.getLogger(ParkEaseApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(ParkEaseApplication.class, args);
        logger.info("🚀 ParkEase Backend started on port 5000");
    }
}