package com.meetingassistant.controller;

import com.meetingassistant.dto.TaskDTO;
import com.meetingassistant.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin("*")
public class DashboardController {

    private final TaskService taskService;

    public DashboardController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(org.springframework.security.core.Authentication auth) {
        List<TaskDTO> allTasks = taskService.getDashboardTasks(auth.getName());
        long completed = allTasks.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).count();
        long pending = allTasks.size() - completed;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTasks", allTasks.size());
        stats.put("completedTasks", completed);
        stats.put("pendingTasks", pending);
        return ResponseEntity.ok(stats);
    }
}
