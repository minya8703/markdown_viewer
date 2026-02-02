/**
 * Footer 위젯
 * 하단 고정 푸터 컴포넌트 (Google AdSense 영역)
 * 
 * @see 02_REQUIREMENTS.md - FR-6.1 (Google AdSense 통합)
 * @see 05_UI_UX_DESIGN.md - Footer 컴포넌트 설계
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (widgets 레이어)
 */

import './Footer.css';

export interface FooterProps {
  adSenseClientId?: string;
}

export class Footer {
  private element: HTMLElement;

  constructor(props: FooterProps = {}) {
    this.element = document.createElement('footer');
    this.element.className = 'footer';
    this.render(props);
  }

  private render(props: FooterProps): void {
    const { adSenseClientId } = props;

    // Google AdSense 영역
    if (adSenseClientId) {
      const adContainer = document.createElement('div');
      adContainer.className = 'footer__adsense';
      adContainer.id = 'adsense-container';

      // Google AdSense 스크립트 (실제 구현 시 환경 변수에서 가져옴)
      const adScript = document.createElement('script');
      adScript.async = true;
      adScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}`;
      adScript.crossOrigin = 'anonymous';

      const adIns = document.createElement('ins');
      adIns.className = 'adsbygoogle';
      adIns.style.display = 'block';
      adIns.setAttribute('data-ad-client', adSenseClientId);
      adIns.setAttribute('data-ad-slot', '1234567890'); // 실제 슬롯 ID로 변경 필요
      adIns.setAttribute('data-ad-format', 'auto');
      adIns.setAttribute('data-full-width-responsive', 'true');

      adContainer.appendChild(adIns);
      this.element.appendChild(adContainer);

      // 스크립트 로드 후 AdSense 초기화
      adScript.onload = () => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error('AdSense initialization error:', e);
        }
      };

      document.head.appendChild(adScript);
    } else {
      // AdSense가 설정되지 않은 경우 플레이스홀더
      const placeholder = document.createElement('div');
      placeholder.className = 'footer__placeholder';
      placeholder.textContent = '광고 영역';
      this.element.appendChild(placeholder);
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    this.element.remove();
  }
}
