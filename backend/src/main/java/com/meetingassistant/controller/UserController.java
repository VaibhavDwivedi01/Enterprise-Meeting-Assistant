package com.meetingassistant.controller;

import com.meetingassistant.entity.User;
import com.meetingassistant.repository.UserRepository;
import com.meetingassistant.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    public UserController(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @PostMapping("/profile-pic")
    public ResponseEntity<?> updateProfilePic(Authentication authentication, @RequestBody Map<String, String> body) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        String base64Image = body.get("profilePic");
        if (base64Image != null && !base64Image.isEmpty()) {
            user.setProfilePic(base64Image);
            userRepository.save(user);
        }
        return ResponseEntity.ok(Map.of("message", "Profile picture updated"));
    }

    @GetMapping("/team")
    public ResponseEntity<?> getTeamMembers(Authentication authentication) {
        User admin = userRepository.findByEmail(authentication.getName()).orElseThrow();
        if (admin.getRole() != com.meetingassistant.entity.Role.ROLE_ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Only Admins view teams."));
        }
        java.util.List<User> team = userRepository.findByManager(admin);
        
        java.util.List<Map<String, Object>> response = team.stream().map(u -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("profilePic", u.getProfilePic() != null ? u.getProfilePic() : "");
            map.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
            return map;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(Authentication authentication, @RequestBody Map<String, String> body) {
        try {
            userService.changePassword(authentication.getName(), body.get("currentPassword"), body.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/team-code")
    public ResponseEntity<?> resetTeamCode(Authentication authentication) {
        try {
            String newCode = userService.resetTeamCode(authentication.getName());
            return ResponseEntity.ok(Map.of("teamCode", newCode));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
