package com.meetingassistant.controller;

import com.meetingassistant.dto.AuthResponse;
import com.meetingassistant.dto.LoginRequest;
import com.meetingassistant.dto.RegisterRequest;
import com.meetingassistant.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(userService.registerUser(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/managers")
    public ResponseEntity<java.util.List<com.meetingassistant.dto.UserDTO>> getManagers() {
        return ResponseEntity.ok(userService.getManagers());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(userService.loginUser(request));
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }
}
