package com.meetingassistant.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String role;
    private String teamCode;
    private String teamName;
}
