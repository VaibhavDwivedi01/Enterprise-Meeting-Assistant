package com.meetingassistant.repository;

import com.meetingassistant.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByAssignedToId(Long userId);
    List<Task> findByMeetingId(Long meetingId);
    List<Task> findByAssignedToManagerId(Long managerId);
    List<Task> findByDelegatedById(Long delegatedById);
}
