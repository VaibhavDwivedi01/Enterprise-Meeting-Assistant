package com.meetingassistant.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MeetingResponse {
    private Long id;
    private String title;
    private String transcript;
    private String summary;
    private String audioUrl;
}
