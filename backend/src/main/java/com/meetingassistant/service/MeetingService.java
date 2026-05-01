package com.meetingassistant.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetingassistant.ai.OpenAIService;
import com.meetingassistant.dto.MeetingResponse;
import com.meetingassistant.entity.Meeting;
import com.meetingassistant.entity.Task;
import com.meetingassistant.entity.User;
import com.meetingassistant.repository.MeetingRepository;
import com.meetingassistant.repository.TaskRepository;
import com.meetingassistant.repository.UserRepository;
import com.meetingassistant.repository.NotificationRepository;
import com.meetingassistant.entity.Notification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final OpenAIService openAIService;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MeetingService(MeetingRepository meetingRepository, TaskRepository taskRepository, UserRepository userRepository, OpenAIService openAIService, NotificationRepository notificationRepository) {
        this.meetingRepository = meetingRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.openAIService = openAIService;
        this.notificationRepository = notificationRepository;
    }

    public MeetingResponse processMeetingRecording(MultipartFile file, String title, String userEmail) throws Exception {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));

        String transcript = openAIService.transcribeAudio(file);
        String summary = openAIService.generateSummary(transcript);
        String tasksJson = openAIService.extractTasksJson(transcript);

        if (tasksJson != null) {
            int startIndex = tasksJson.indexOf('[');
            int endIndex = tasksJson.lastIndexOf(']');
            if (startIndex >= 0 && endIndex >= startIndex) {
                tasksJson = tasksJson.substring(startIndex, endIndex + 1);
            }
        }

        Meeting meeting = new Meeting();
        meeting.setTitle(title);
        meeting.setDateTime(LocalDateTime.now());
        meeting.setCreatedBy(user);
        meeting.setTranscript(transcript);
        meeting.setSummary(summary);
        meeting.setAudioUrl("uploaded/" + file.getOriginalFilename());
        
        meeting = meetingRepository.save(meeting);

        try {
            if (tasksJson != null && !tasksJson.trim().isEmpty()) {
                List<Map<String, String>> taskDataList = objectMapper.readValue(tasksJson.trim(), new TypeReference<List<Map<String, String>>>() {});
                for(Map<String, String> tData : taskDataList) {
                    Task task = new Task();
                    task.setTitle(tData.get("title"));
                    task.setDescription(tData.get("title"));
                    task.setMeeting(meeting);
                    task.setDeadline(tData.get("deadline"));
                    task.setStatus("PENDING");

                    String assignedToName = tData.get("assignedToName");
                    User assignedUser = userRepository.findAll().stream()
                        .filter(u -> u.getName() != null && assignedToName != null &&
                                (u.getName().equalsIgnoreCase(assignedToName) ||
                                 u.getName().toLowerCase().contains(assignedToName.toLowerCase()) ||
                                 assignedToName.toLowerCase().contains(u.getName().toLowerCase())))
                        .findFirst().orElse(user);

                    task.setAssignedTo(assignedUser);
                    taskRepository.save(task);

                    Notification notif = new Notification();
                    notif.setUser(assignedUser);
                    notif.setMessage("New task assigned: " + task.getTitle());
                    notificationRepository.save(notif);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return MeetingResponse.builder()
                .id(meeting.getId())
                .title(meeting.getTitle())
                .transcript(meeting.getTranscript())
                .summary(meeting.getSummary())
                .audioUrl(meeting.getAudioUrl())
                .build();
    }

    public List<MeetingResponse> getUserMeetings(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new RuntimeException("User not found"));
        return meetingRepository.findByCreatedById(user.getId()).stream()
                .map(m -> MeetingResponse.builder()
                        .id(m.getId())
                        .title(m.getTitle())
                        .transcript(m.getTranscript())
                        .summary(m.getSummary())
                        .audioUrl(m.getAudioUrl())
                        .build())
                .collect(Collectors.toList());
    }
}
