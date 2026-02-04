/**
 * 마크다운 렌더러 컴포넌트
 * 마크다운 텍스트를 HTML로 변환하여 렌더링
 * 
 * @see 02_REQUIREMENTS.md - FR-2.1 (마크다운 뷰어 기능)
 * @see 03_API_SPECIFICATION.md - 마크다운 처리 API (render, detect)
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (features 레이어)
 */

import { renderMarkdown } from '../lib/markdown';
import './MarkdownRenderer.css';

export class MarkdownRenderer {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.classList.add('markdown-renderer');
  }

  /**
   * 마크다운 콘텐츠 렌더링
   */
  render(markdown: string): void {
    const html = renderMarkdown(markdown);
    this.container.innerHTML = html;

    // 코드 블록 하이라이팅 (highlight.js)
    this.container.querySelectorAll('pre code').forEach((block) => {
      if (block instanceof HTMLElement) {
        block.classList.add('hljs');
      }
    });
  }

  /**
   * 콘텐츠 초기화
   */
  clear(): void {
    this.container.innerHTML = '';
  }

  /**
   * 로딩 상태 표시
   */
  showLoading(): void {
    this.container.innerHTML = '<div class="loading">로딩 중...</div>';
  }

  /**
   * 에러 상태 표시
   */
  showError(message: string): void {
    this.container.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'error';
    div.textContent = message;
    this.container.appendChild(div);
  }

  /**
   * 컨테이너 요소 반환
   */
  getElement(): HTMLElement {
    return this.container;
  }
}
