/**
 * 라우터 단위 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from './router';

describe('Router', () => {
  let container: HTMLElement;
  let router: Router;
  let pushStateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    container = document.createElement('div');
    router = new Router(container);
    pushStateSpy = vi.spyOn(window.history, 'pushState');
  });

  it('register 후 해당 경로로 navigate하면 핸들러가 실행된다', () => {
    const handler = vi.fn();
    router.register('/test', handler);
    router.navigate('/test');
    expect(handler).toHaveBeenCalledWith(container);
    expect(container.innerHTML).toBe('');
  });

  it('핸들러가 container에 내용을 추가하면 DOM에 반영된다', () => {
    router.register('/page', (el) => {
      el.innerHTML = '<p>Hello</p>';
    });
    router.navigate('/page');
    expect(container.innerHTML).toContain('<p>Hello</p>');
  });

  it('navigate 시 pushState가 호출된다', () => {
    router.register('/viewer', () => {});
    router.navigate('/viewer');
    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/viewer');
  });

  it('getCurrentPath는 마지막으로 이동한 경로를 반환한다', () => {
    router.register('/a', () => {});
    router.register('/b', () => {});
    router.navigate('/a');
    expect(router.getCurrentPath()).toBe('/a');
    router.navigate('/b');
    expect(router.getCurrentPath()).toBe('/b');
  });

  it('등록되지 않은 경로로 이동하면 /viewer로 리다이렉트한다 (login 제외)', () => {
    router.register('/viewer', (el) => {
      el.textContent = 'viewer';
    });
    router.navigate('/unknown');
    expect(router.getCurrentPath()).toBe('/viewer');
    expect(container.textContent).toBe('viewer');
  });
});
