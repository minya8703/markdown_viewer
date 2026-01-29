/**
 * 애플리케이션 진입점
 */

import '../shared/styles/variables.css';
import '../shared/styles/reset.css';
import { App } from './App';

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app');
  if (!appElement) {
    throw new Error('App element not found');
  }

  const app = new App(appElement);
  app.init();
});
