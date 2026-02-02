package com.markdownviewer.controller;

import com.markdownviewer.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 헬스 체크 컨트롤러
 * 
 * @see 01_SYSTEM_ARCHITECTURE.md - HealthController 상세 설계
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> health() {
        Map<String, String> data = new HashMap<>();
        data.put("status", "UP");
        data.put("service", "markdown-viewer-backend");
        
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
