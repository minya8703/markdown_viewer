/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_ADSENSE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/* File System Access API (일부 브라우저) */
interface Window {
  showOpenFilePicker?(options?: unknown): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker?(options?: unknown): Promise<FileSystemFileHandle>;
  adsbygoogle?: unknown[];
}
