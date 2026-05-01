package com.meetingassistant.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TaskDTO {
    private Long id;
    private String title;
    private String assignedToName;
    private String deadline;
    private String status;
    private Long meetingId;
    private String meetingTitle;
    private String delegatedByName;
}
