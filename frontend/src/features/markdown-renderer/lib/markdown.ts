/**
 * 마크다운 렌더러
 * 클라이언트 사이드에서 마크다운을 HTML로 변환 (XSS 방지: DOMPurify 적용)
 *
 * @see 02_REQUIREMENTS.md - FR-2.1 (마크다운 뷰어)
 * @see 03_API_SPECIFICATION.md - 마크다운 처리 API
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (features/lib 레이어)
 * @see docs/project/SECURITY_CHECKLIST.md - 마크다운 XSS 방지
 */

import DOMPurify from 'dompurify';
import { marked, type MarkedOptions } from 'marked';
import hljs from 'highlight.js';

// Highlight.js 설정 (highlight는 MarkedExtension 레벨 옵션)
marked.setOptions({
  highlight(code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.warn('Highlight.js error:', err);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
} as MarkedOptions);

/**
 * 마크다운 텍스트를 HTML로 변환 (스크립트 등 위험 HTML 제거)
 */
export function renderMarkdown(markdown: string): string {
  const raw = marked.parse(markdown) as string;
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
}

/**
 * 마크다운 형식 감지 (간단한 휴리스틱)
 */
export function detectMarkdown(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s+.+$/m, // 헤더
    /^\s*[-*+]\s+.+$/m, // 리스트
    /^\s*\d+\.\s+.+$/m, // 번호 리스트
    /\[.+\]\(.+\)/, // 링크
    /!\[.+\]\(.+\)/, // 이미지
    /```[\s\S]*?```/, // 코드 블록
    /`[^`]+`/, // 인라인 코드
    /^\s*>\s+.+$/m, // 인용
    /^\s*\|.+\|.+$/m, // 테이블
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
}
