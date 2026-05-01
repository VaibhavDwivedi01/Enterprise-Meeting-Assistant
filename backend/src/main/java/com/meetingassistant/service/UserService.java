package com.meetingassistant.service;

import com.meetingassistant.dto.AuthResponse;
import com.meetingassistant.dto.LoginRequest;
import com.meetingassistant.dto.RegisterRequest;
import com.meetingassistant.entity.Role;
import com.meetingassistant.entity.User;
import com.meetingassistant.repository.UserRepository;
import com.meetingassistant.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    public java.util.List<com.meetingassistant.dto.UserDTO> getManagers() {
        return userRepository.findByRole(Role.ROLE_ADMIN).stream()
                .map(u -> com.meetingassistant.dto.UserDTO.builder()
                        .id(u.getId()).name(u.getName()).role(u.getRole().name()).build())
                .collect(java.util.stream.Collectors.toList());
    }

    public AuthResponse registerUser(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use!");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        Role role = Role.ROLE_EMPLOYEE;
        if (request.getRole() != null && request.getRole().equals("ROLE_ADMIN")) {
            role = Role.ROLE_ADMIN;
            user.setTeamCode(java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            user.setTeamName(request.getTeamName() != null && !request.getTeamName().trim().isEmpty() ? request.getTeamName() : request.getName() + "'s Team");
        }
        user.setRole(role);

        if (request.getTeamCode() != null && !request.getTeamCode().trim().isEmpty()) {
            User manager = userRepository.findByTeamCode(request.getTeamCode().trim())
                .orElseThrow(() -> new RuntimeException("Invalid Team Code provided!"));
            if (manager.getRole() != Role.ROLE_ADMIN) {
                throw new RuntimeException("Invalid Team Code: This code does not belong to a valid Manager.");
            }
            user.setManager(manager);
        }

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getRole().name(), user.getName(), user.getProfilePic(), user.getTeamCode(), user.getTeamName());
    }

    public AuthResponse loginUser(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getRole().name(), user.getName(), user.getProfilePic(), user.getTeamCode(), user.getTeamName());
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public String resetTeamCode(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.ROLE_ADMIN) {
            throw new RuntimeException("Only Admins can reset team code");
        }
        String newCode = java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        user.setTeamCode(newCode);
        userRepository.save(user);
        return newCode;
    }
}
