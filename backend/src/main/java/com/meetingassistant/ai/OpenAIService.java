package com.meetingassistant.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import java.util.List;

@Service
public class OpenAIService {

    @Value("${openai.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    public OpenAIService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String transcribeAudio(MultipartFile audioFile) throws Exception {
        if ("YOUR_OPENAI_API_KEY".equals(apiKey)) {
            return "This is a mock transcript. Vaibhav will complete API by Monday. Rahul will finish testing.";
        }
        String url = "https://api.groq.com/openai/v1/audio/transcriptions";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(apiKey);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(audioFile.getBytes()) {
            @Override
            public String getFilename() {
                return audioFile.getOriginalFilename() != null ? audioFile.getOriginalFilename() : "audio.mp3";
            }
        });
        body.add("model", "whisper-large-v3");

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
        return (String) response.getBody().get("text");
    }

    public String generateSummary(String transcript) {
        if ("YOUR_OPENAI_API_KEY".equals(apiKey)) {
            return "Mock Summary: \n- API development assigned to Vaibhav.\n- Testing assigned to Rahul.";
        }
        String prompt = "Create a brief summary of this meeting transcript:\n" + transcript;
        return callChatGpt(prompt);
    }

    public String extractTasksJson(String transcript) {
        if ("YOUR_OPENAI_API_KEY".equals(apiKey)) {
            return "[{\"title\":\"Complete API\", \"assignedToName\":\"Vaibhav\", \"deadline\":\"Monday\"}, {\"title\":\"Finish testing\", \"assignedToName\":\"Rahul\", \"deadline\":\"Unknown\"}]";
        }
        String prompt = "Extract high-level actionable tasks from this transcript. You MUST group all related granular actions into a SINGLE overarching task. Do NOT return more than 1 or 2 tasks in total. Return ONLY a valid JSON array of objects, with keys: 'title', 'assignedToName', and 'deadline'. Do not include markdown formatting.\nTranscript: " + transcript;
        return callChatGpt(prompt);
    }

    @SuppressWarnings("unchecked")
    private String callChatGpt(String prompt) {
        String url = "https://api.groq.com/openai/v1/chat/completions";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> message = Map.of("role", "user", "content", prompt);
        Map<String, Object> body = Map.of(
            "model", "llama-3.1-8b-instant",
            "messages", List.of(message),
            "temperature", 0.3
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        Map<String, Object> responseBody = response.getBody();
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        Map<String, Object> msg = (Map<String, Object>) choices.get(0).get("message");
        return (String) msg.get("content");
    }
}
