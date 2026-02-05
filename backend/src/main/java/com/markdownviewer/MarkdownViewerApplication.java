package com.markdownviewer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 마크다운 뷰어 백엔드 애플리케이션
 * 
 * @see docs/10_design/10_SYSTEM_ARCHITECTURE.md - 전체 시스템 아키텍처
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - 백엔드 코딩 규약
 */
@SpringBootApplication
public class MarkdownViewerApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarkdownViewerApplication.class, args);
    }
}
