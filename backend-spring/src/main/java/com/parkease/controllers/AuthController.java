package com.parkease.controllers;

import com.parkease.models.User;
import com.parkease.repository.UserRepository;
import com.parkease.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;


    // User Registration
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User already exists with this email"));
        }
        user.encodePassword();
        user.setRole("user");
        user.setActive(true);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());

        return ResponseEntity.status(201).body(Map.of(
                "message", "User registered successfully",
                "token", token,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole()
                )
        ));
    }

    // Admin Registration
    @PostMapping("/register/admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody User req) {
        try {
            // Validate admin code
            if (!"ADMIN2024".equals(req.getAdminCode())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid admin code"));
            }

            // Check if admin exists
            if (userRepository.findByEmail(req.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Admin already exists with this email"));
            }

            // Create new admin
            User admin = new User();
            admin.setName(req.getName());
            admin.setEmail(req.getEmail());
            admin.setPhone(req.getPhone());
            admin.setRole("admin");
            admin.setPassword(req.getPassword());
            admin.encodePassword(); // make sure this uses BCrypt or similar
            admin.setActive(true);

            userRepository.save(admin);
            String token = jwtUtil.generateToken(admin.getEmail());

            return ResponseEntity.status(201).body(Map.of(
                    "message", "Admin registered successfully",
                    "token", token,
                    "user", Map.of(
                            "id", admin.getId(),
                            "name", admin.getName(),
                            "email", admin.getEmail(),
                            "role", admin.getRole()
                    )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Error registering admin",
                    "error", e.getMessage()
            ));
        }
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !user.comparePassword(password)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid credentials"));
        }
        if (!user.isActive()) {
            return ResponseEntity.status(403).body(Map.of("message", "Account is deactivated"));
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "token", token,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole()
                )
        ));
    }
}