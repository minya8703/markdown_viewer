/**
 * 에디터 기능
 * Smart Paste 및 변경사항 감지 유틸리티
 * 
 * @see docs/10_design/11_REQUIREMENTS.md - FR-3.2 (Smart Paste)
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - FSD 아키텍처 (features/lib 레이어)
 */

import { detectMarkdown } from '@features/markdown-renderer';

/**
 * Smart Paste 처리
 * 붙여넣은 텍스트의 마크다운 형식 자동 인식
 */
export function handleSmartPaste(
  event: ClipboardEvent,
  textarea: HTMLTextAreaElement
): void {
  event.preventDefault();
  
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  const pastedText = clipboardData.getData('text/plain');
  
  // 마크다운 형식 감지
  const isMarkdown = detectMarkdown(pastedText);
  
  if (isMarkdown) {
    // 마크다운 형식이면 그대로 붙여넣기
    insertTextAtCursor(textarea, pastedText);
  } else {
    // 일반 텍스트면 그대로 붙여넣기
    insertTextAtCursor(textarea, pastedText);
  }
}

/**
 * 커서 위치에 텍스트 삽입
 */
function insertTextAtCursor(textarea: HTMLTextAreaElement, text: string): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  
  textarea.value = value.substring(0, start) + text + value.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  
  // input 이벤트 발생
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * 저장되지 않은 변경사항 확인
 */
export function hasUnsavedChanges(
  originalContent: string,
  currentContent: string
): boolean {
  return originalContent !== currentContent;
}
