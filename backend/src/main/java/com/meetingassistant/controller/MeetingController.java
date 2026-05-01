package com.meetingassistant.controller;

import com.meetingassistant.dto.MeetingResponse;
import com.meetingassistant.service.MeetingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.meetingassistant.repository.MeetingRepository;
import com.meetingassistant.service.PdfExportService;
import com.meetingassistant.entity.Meeting;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@CrossOrigin("*")
public class MeetingController {

    private final MeetingService meetingService;
    private final MeetingRepository meetingRepository;
    private final PdfExportService pdfExportService;

    public MeetingController(MeetingService meetingService, MeetingRepository meetingRepository, PdfExportService pdfExportService) {
        this.meetingService = meetingService;
        this.meetingRepository = meetingRepository;
        this.pdfExportService = pdfExportService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadMeetingRecording(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            Authentication authentication) {
        try {
            return ResponseEntity.ok(meetingService.processMeetingRecording(file, title, authentication.getName()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Backend Error: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<MeetingResponse>> getUserMeetings(Authentication authentication) {
        return ResponseEntity.ok(meetingService.getUserMeetings(authentication.getName()));
    }

    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportMeetingPdf(@PathVariable Long id) {
        try {
            Meeting meeting = meetingRepository.findById(id).orElseThrow(() -> new RuntimeException("Meeting not found"));
            byte[] pdfBytes = pdfExportService.generateMeetingPdf(meeting);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Meeting_" + id + ".pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
