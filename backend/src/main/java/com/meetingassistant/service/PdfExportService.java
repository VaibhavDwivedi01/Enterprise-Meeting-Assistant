package com.meetingassistant.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.meetingassistant.entity.Meeting;
import com.meetingassistant.entity.Task;
import com.meetingassistant.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class PdfExportService {

    private final TaskRepository taskRepository;

    public PdfExportService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public byte[] generateMeetingPdf(Meeting meeting) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

        // Title
        Paragraph title = new Paragraph("Meeting Report: " + meeting.getTitle(), titleFont);
        title.setAlignment(Paragraph.ALIGN_CENTER);
        document.add(title);
        
        document.add(new Paragraph(" "));

        // Metadata
        document.add(new Paragraph("Date: " + meeting.getDateTime().toString(), normalFont));
        document.add(new Paragraph("Created By: " + meeting.getCreatedBy().getName(), normalFont));
        document.add(new Paragraph(" "));

        // Summary
        document.add(new Paragraph("Summary", headerFont));
        document.add(new Paragraph(meeting.getSummary() != null ? meeting.getSummary() : "No summary available.", normalFont));
        document.add(new Paragraph(" "));

        // Action Items
        document.add(new Paragraph("Action Items", headerFont));
        List<Task> tasks = taskRepository.findByMeetingId(meeting.getId());
        if (tasks.isEmpty()) {
            document.add(new Paragraph("No action items extracted.", normalFont));
        } else {
            for (int i = 0; i < tasks.size(); i++) {
                Task t = tasks.get(i);
                String taskText = (i + 1) + ". " + t.getTitle() + " (Assigned to: " + t.getAssignedTo().getName() + ")";
                document.add(new Paragraph(taskText, normalFont));
            }
        }

        document.close();
        return out.toByteArray();
    }
}
