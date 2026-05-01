package com.meetingassistant.repository;

import com.meetingassistant.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    java.util.List<User> findByRole(com.meetingassistant.entity.Role role);
    java.util.Optional<User> findByTeamCode(String teamCode);
    java.util.List<User> findByManager(User manager);
}
