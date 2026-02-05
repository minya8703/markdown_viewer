/**
 * 파일 암호화 유틸리티
 * Web Crypto API를 사용한 클라이언트 사이드 암호화
 * 
 * @see docs/10_design/11_REQUIREMENTS.md - FR-4.1 (파일 암호화)
 * @see docs/10_design/10_SYSTEM_ARCHITECTURE.md - 암호화 구현 상세
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - FSD 아키텍처 (features/lib 레이어)
 */

export interface EncryptedData {
  encrypted: string; // Base64 인코딩된 암호화된 데이터
  iv: string; // Base64 인코딩된 Initialization Vector
  tag: string; // Base64 인코딩된 인증 태그
  salt?: string; // Base64 인코딩된 솔트 (PBKDF2용)
}

export interface EncryptionOptions {
  password: string;
  salt?: Uint8Array; // 솔트가 제공되지 않으면 자동 생성
  iterations?: number; // PBKDF2 반복 횟수 (기본: 100000)
}

/**
 * 파일 암호화 클래스
 * AES-256-GCM 알고리즘 사용
 */
export class FileEncryption {
  private readonly algorithm = { name: 'AES-GCM', length: 256 };
  private readonly defaultIterations = 100000;

  /**
   * 파일 내용 암호화
   */
  async encrypt(
    content: string,
    options: EncryptionOptions
  ): Promise<EncryptedData> {
    try {
      // 1. 키 파생
      const salt = options.salt || this.generateSalt();
      const key = await this.deriveKey(options.password, salt, options.iterations);

      // 2. IV 생성 (12 bytes for AES-GCM)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // 3. 텍스트를 바이트 배열로 변환
      const encodedContent = new TextEncoder().encode(content);

      // 4. 암호화
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encodedContent
      );

      // 5. 암호화된 데이터와 인증 태그 분리
      // AES-GCM은 암호화된 데이터 끝에 16바이트 인증 태그를 추가
      const encryptedBytes = new Uint8Array(encryptedData);
      const tag = encryptedBytes.slice(-16);
      const ciphertext = encryptedBytes.slice(0, -16);

      // 6. Base64 인코딩
      return {
        encrypted: this.arrayBufferToBase64(ciphertext),
        iv: this.arrayBufferToBase64(iv),
        tag: this.arrayBufferToBase64(tag),
        salt: this.arrayBufferToBase64(salt),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('파일 암호화에 실패했습니다.');
    }
  }

  /**
   * 파일 내용 복호화
   */
  async decrypt(
    encryptedData: EncryptedData,
    password: string,
    iterations?: number
  ): Promise<string> {
    try {
      // 1. Base64 디코딩
      const encrypted = this.base64ToArrayBuffer(encryptedData.encrypted);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const tag = this.base64ToArrayBuffer(encryptedData.tag);
      const salt = encryptedData.salt
        ? this.base64ToArrayBuffer(encryptedData.salt)
        : this.getDefaultSalt(); // 기본 솔트 (향후 사용자별 솔트로 변경)

      // 2. 키 파생
      const key = await this.deriveKey(password, salt, iterations);

      // 3. 암호화된 데이터와 인증 태그 결합
      const combined = new Uint8Array(encrypted.length + tag.length);
      combined.set(encrypted);
      combined.set(tag, encrypted.length);

      // 4. 복호화
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource,
        },
        key,
        combined
      );

      // 5. 텍스트로 변환
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('파일 복호화에 실패했습니다. 비밀번호를 확인해주세요.');
    }
  }

  /**
   * PBKDF2를 사용한 키 파생
   */
  private async deriveKey(
    password: string,
    salt: Uint8Array,
    iterations?: number
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: iterations || this.defaultIterations,
        hash: 'SHA-256',
      },
      passwordKey,
      this.algorithm,
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 랜덤 솔트 생성
   */
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * 기본 솔트 가져오기 (사용자별 고유 솔트로 변경 예정)
   */
  private getDefaultSalt(): Uint8Array {
    // TODO: 사용자별 고유 솔트를 localStorage나 서버에서 가져오기
    // 현재는 고정된 솔트 사용 (보안상 개선 필요)
    const defaultSalt = 'default-salt-1234'; // 임시
    return new TextEncoder().encode(defaultSalt);
  }

  /**
   * ArrayBuffer를 Base64 문자열로 변환
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      if (byte !== undefined) binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  /**
   * Base64 문자열을 ArrayBuffer로 변환
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * 비밀번호 강도 검증
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    message: string;
  } {
    if (password.length < 8) {
      return {
        isValid: false,
        strength: 'weak',
        message: '비밀번호는 최소 8자 이상이어야 합니다.',
      };
    }

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    let score = 0;

    // 길이 체크
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // 대문자 포함
    if (/[A-Z]/.test(password)) score++;

    // 소문자 포함
    if (/[a-z]/.test(password)) score++;

    // 숫자 포함
    if (/[0-9]/.test(password)) score++;

    // 특수문자 포함
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      strength = 'weak';
    } else if (score <= 4) {
      strength = 'medium';
    } else {
      strength = 'strong';
    }

    return {
      isValid: true,
      strength,
      message:
        strength === 'strong'
          ? '강력한 비밀번호입니다.'
          : strength === 'medium'
          ? '보통 강도의 비밀번호입니다. 더 강력한 비밀번호를 권장합니다.'
          : '약한 비밀번호입니다. 더 강력한 비밀번호를 사용하세요.',
    };
  }
}

// 싱글톤 인스턴스
export const fileEncryption = new FileEncryption();
