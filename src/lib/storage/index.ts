/**
 * STORAGE - INDEX
 *
 * Exports centralizados para o módulo de storage
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

// Main storage service
export {
  StorageService,
  storageService,
  uploadFile,
  uploadBatch,
  downloadFile,
  deleteFile,
  listFiles,
  getPublicUrl,
  getCDNUrl,
} from './StorageService';

// Types
export type {
  StorageConfig,
  UploadOptions,
  UploadResult,
  StorageFile,
  StorageResponse,
  ImageOptimizationOptions,
  BatchUploadOptions,
  FolderOptions,
  MoveOptions,
  FileMetadata,
} from './StorageService';

// Re-export for convenience
export { storageService as default } from './StorageService';
