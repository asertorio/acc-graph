/// <reference types="vite/client" />

interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  getFile?: () => Promise<File>;
}

interface Window {
  showDirectoryPicker(options?: { mode?: string }): Promise<FileSystemDirectoryHandle>;
}
