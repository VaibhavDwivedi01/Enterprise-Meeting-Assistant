package com.meetingassistant.controller;

import com.meetingassistant.dto.TaskDTO;
import com.meetingassistant.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin("*")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskDTO>> getUserTasks(Authentication authentication) {
        return ResponseEntity.ok(taskService.getTasksByUser(authentication.getName()));
    }

    @GetMapping("/all")
    public ResponseEntity<List<TaskDTO>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @GetMapping("/team")
    public ResponseEntity<List<TaskDTO>> getTeamTasks(Authentication authentication) {
        return ResponseEntity.ok(taskService.getTasksByTeam(authentication.getName()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TaskDTO> updateTaskStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/deadline")
    public ResponseEntity<TaskDTO> updateTaskDeadline(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(taskService.updateTaskDeadline(id, body.get("deadline")));
    }

    @PutMapping("/{id}/delegate")
    public ResponseEntity<TaskDTO> delegateTask(@PathVariable Long id, @RequestParam String toEmail, Authentication authentication) {
        return ResponseEntity.ok(taskService.delegateTask(id, toEmail, authentication.getName()));
    }

    @GetMapping("/delegated")
    public ResponseEntity<List<TaskDTO>> getDelegatedTasks(Authentication authentication) {
        return ResponseEntity.ok(taskService.getDelegatedTasks(authentication.getName()));
    }
}
