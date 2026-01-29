/**
 * 메인 애플리케이션 클래스
 */

import { PageVisibilityManager } from '@shared/lib/visibility';
import { Router } from '@shared/lib/router';

export class App {
  private rootElement: HTMLElement;
  private router: Router;
  private visibilityManager: PageVisibilityManager;

  constructor(rootElement: HTMLElement) {
    this.rootElement = rootElement;
    this.router = new Router();
    this.visibilityManager = new PageVisibilityManager();
  }

  init(): void {
    // 페이지 가시성 관리 초기화
    this.visibilityManager.init();

    // 라우터 초기화
    this.router.init();

    // 초기 페이지 렌더링
    this.render();
  }

  private render(): void {
    // 인증 상태 확인
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      // 로그인 페이지로 리다이렉트
      this.router.navigate('/login');
    } else {
      // 메인 뷰어 페이지로 이동
      this.router.navigate('/viewer');
    }
  }
}
