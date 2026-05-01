package com.meetingassistant.repository;

import com.meetingassistant.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    List<Meeting> findByCreatedById(Long userId);
}
