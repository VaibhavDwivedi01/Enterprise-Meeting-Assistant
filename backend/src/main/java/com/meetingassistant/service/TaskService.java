package com.meetingassistant.service;

import com.meetingassistant.dto.TaskDTO;
import com.meetingassistant.entity.Task;
import com.meetingassistant.entity.User;
import com.meetingassistant.repository.TaskRepository;
import com.meetingassistant.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import com.meetingassistant.repository.TaskRepository;
import com.meetingassistant.repository.UserRepository;
import com.meetingassistant.repository.NotificationRepository;
import com.meetingassistant.entity.Notification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository, NotificationRepository notificationRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    public List<TaskDTO> getTasksByUser(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return taskRepository.findByAssignedToId(user.getId()).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<TaskDTO> getTasksByTeam(String email) {
        User manager = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        List<Task> teamTasks = taskRepository.findByAssignedToManagerId(manager.getId());
        List<Task> myTasks = taskRepository.findByAssignedToId(manager.getId());
        
        List<Task> allTasks = new java.util.ArrayList<>(teamTasks);
        allTasks.addAll(myTasks);
        
        return allTasks.stream().distinct().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<TaskDTO> getDashboardTasks(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == com.meetingassistant.entity.Role.ROLE_ADMIN) {
            return taskRepository.findByAssignedToManagerId(user.getId()).stream().map(this::mapToDTO).collect(Collectors.toList());
        }
        return taskRepository.findByAssignedToId(user.getId()).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public TaskDTO updateTaskStatus(Long id, String status) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(status);
        taskRepository.save(task);

        if (task.getAssignedTo() != null && task.getAssignedTo().getManager() != null) {
            Notification notif = new Notification();
            notif.setUser(task.getAssignedTo().getManager());
            notif.setMessage(task.getAssignedTo().getName() + " updated task '" + task.getTitle() + "' to " + status);
            notificationRepository.save(notif);
        }

        return mapToDTO(task);
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    public TaskDTO updateTaskDeadline(Long id, String deadline) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        task.setDeadline(deadline);
        taskRepository.save(task);
        return mapToDTO(task);
    }

    public TaskDTO delegateTask(Long id, String targetEmail, String currentUserEmail) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
        User currentUser = userRepository.findByEmail(currentUserEmail).orElseThrow(() -> new RuntimeException("User not found"));
        User targetUser = userRepository.findByEmail(targetEmail).orElseThrow(() -> new RuntimeException("Target user not found"));

        task.setDelegatedBy(currentUser);
        task.setAssignedTo(targetUser);
        taskRepository.save(task);

        Notification notifAssignee = new Notification();
        notifAssignee.setUser(targetUser);
        notifAssignee.setMessage(currentUser.getName() + " has delegated a task to you: " + task.getTitle());
        notificationRepository.save(notifAssignee);

        if (currentUser.getManager() != null) {
            Notification notifManager = new Notification();
            notifManager.setUser(currentUser.getManager());
            notifManager.setMessage(currentUser.getName() + " delegated task '" + task.getTitle() + "' to " + targetUser.getName());
            notificationRepository.save(notifManager);
        }

        return mapToDTO(task);
    }

    public List<TaskDTO> getDelegatedTasks(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return taskRepository.findByDelegatedById(user.getId()).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public TaskDTO createManualTask(String title, String deadline, String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Task task = new Task();
        task.setTitle(title);
        task.setDescription(title);
        task.setDeadline(deadline);
        task.setAssignedTo(user);
        task.setStatus("PENDING");
        taskRepository.save(task);

        Notification notif = new Notification();
        notif.setUser(user);
        notif.setMessage("You manually created a task: " + task.getTitle());
        notificationRepository.save(notif);

        return mapToDTO(task);
    }

    private TaskDTO mapToDTO(Task task) {
        return TaskDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .assignedToName(task.getAssignedTo() != null ? task.getAssignedTo().getName() : "Unassigned")
                .deadline(task.getDeadline())
                .status(task.getStatus())
                .meetingId(task.getMeeting() != null ? task.getMeeting().getId() : null)
                .meetingTitle(task.getMeeting() != null ? task.getMeeting().getTitle() : null)
                .delegatedByName(task.getDelegatedBy() != null ? task.getDelegatedBy().getName() : null)
                .build();
    }
}
