/**
 * 애플리케이션 진입점
 */

import '../shared/styles/variables.css';
import '../shared/styles/reset.css';
import { App } from './App';

// 애플리케이션 초기화
console.log('index.ts loaded');

// DOMContentLoaded 이벤트가 이미 발생했을 수 있으므로 확인
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM이 이미 로드된 경우 즉시 실행
  initApp();
}

function initApp(): void {
  console.log('initApp() called, readyState:', document.readyState);
  const appElement = document.getElementById('app');
  console.log('App element:', appElement);
  
  if (!appElement) {
    console.error('App element not found!');
    document.body.innerHTML = '<div style="padding: 20px;"><h1>오류</h1><p>App element를 찾을 수 없습니다.</p></div>';
    return;
  }

  try {
    console.log('Initializing App...');
    const app = new App(appElement);
    app.init();
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
    appElement.innerHTML = `<div style="padding: 20px;"><h1>초기화 오류</h1><p>${error instanceof Error ? error.message : String(error)}</p><pre>${error instanceof Error ? error.stack : ''}</pre></div>`;
  }
}
