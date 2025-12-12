/**
 * STORAGE SERVICE
 *
 * Serviço completo de gerenciamento de arquivos com Supabase Storage
 *
 * Features:
 * - Upload de arquivos (imagens, vídeos, documentos)
 * - CDN URL generation
 * - Batch operations
 * - Folder management
 * - Image optimization
 * - Trash/Recovery
 * - File metadata
 * - Progress tracking
 * - File validation
 * - Public/Private buckets
 *
 * @version 1.0.0
 * @date 2025-01-08
 * @author SyncAds Team
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StorageConfig {
  defaultBucket?: string;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  cdnUrl?: string;
}

export interface UploadOptions {
  file: File | Blob;
  path: string;
  bucket?: string;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  path: string;
  url: string;
  cdnUrl: string;
  publicUrl: string;
  size: number;
  type: string;
  metadata?: Record<string, any>;
}

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
    contentLength: number;
    httpStatusCode: number;
  };
}

export interface StorageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    duration?: number;
    size?: number;
    count?: number;
  };
}

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  resize?: 'cover' | 'contain' | 'fill';
}

export interface BatchUploadOptions {
  files: Array<{
    file: File | Blob;
    path: string;
    metadata?: Record<string, any>;
  }>;
  bucket?: string;
  onProgress?: (completed: number, total: number) => void;
  onFileComplete?: (result: UploadResult, index: number) => void;
}

export interface FolderOptions {
  bucket?: string;
  path: string;
  recursive?: boolean;
}

export interface MoveOptions {
  fromPath: string;
  toPath: string;
  bucket?: string;
}

export interface FileMetadata {
  id: string;
  user_id: string;
  bucket: string;
  path: string;
  url: string;
  cdn_url: string;
  filename: string;
  size: number;
  mime_type: string;
  width?: number;
  height?: number;
  duration?: number; // for videos
  tags?: string[];
  folder?: string;
  is_deleted: boolean;
  deleted_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// STORAGE SERVICE CLASS
// ============================================================================

export class StorageService {
  private config: Required<StorageConfig>;
  private uploadAbortControllers: Map<string, AbortController> = new Map();

  constructor(config?: StorageConfig) {
    this.config = {
      defaultBucket: 'user-assets',
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedTypes: ['image/*', 'video/*', 'application/pdf', 'application/zip'],
      cdnUrl: import.meta.env.VITE_SUPABASE_URL + '/storage/v1/object/public',
      ...config,
    };
  }

  // ============================================================================
  // UPLOAD OPERATIONS
  // ============================================================================

  /**
   * Upload de arquivo único
   */
  async upload(options: UploadOptions): Promise<StorageResponse<UploadResult>> {
    const startTime = Date.now();

    try {
      // Validate file
      const validation = this.validateFile(options.file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      const bucket = options.bucket || this.config.defaultBucket;
      const abortController = new AbortController();
      const uploadId = `${bucket}/${options.path}`;

      this.uploadAbortControllers.set(uploadId, abortController);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(options.path, options.file, {
          contentType: options.contentType || (options.file as File).type,
          cacheControl: options.cacheControl || '3600',
          upsert: options.upsert || false,
        });

      this.uploadAbortControllers.delete(uploadId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Get URLs
      const publicUrl = this.getPublicUrl(bucket, data.path);
      const cdnUrl = this.getCDNUrl(bucket, data.path);

      const result: UploadResult = {
        path: data.path,
        url: publicUrl,
        cdnUrl,
        publicUrl,
        size: (options.file as File).size || 0,
        type: (options.file as File).type || options.contentType || '',
        metadata: options.metadata,
      };

      // Store metadata in database
      await this.storeFileMetadata(bucket, result, options.metadata);

      return {
        success: true,
        data: result,
        metadata: {
          duration: Date.now() - startTime,
          size: result.size,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        metadata: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Upload em lote (batch)
   */
  async uploadBatch(options: BatchUploadOptions): Promise<StorageResponse<UploadResult[]>> {
    const startTime = Date.now();
    const results: UploadResult[] = [];
    const errors: string[] = [];

    try {
      const total = options.files.length;
      let completed = 0;

      for (let i = 0; i < options.files.length; i++) {
        const fileOptions = options.files[i];

        const result = await this.upload({
          file: fileOptions.file,
          path: fileOptions.path,
          bucket: options.bucket,
          metadata: fileOptions.metadata,
        });

        if (result.success && result.data) {
          results.push(result.data);
          options.onFileComplete?.(result.data, i);
        } else {
          errors.push(`${fileOptions.path}: ${result.error}`);
        }

        completed++;
        options.onProgress?.(completed, total);
      }

      return {
        success: errors.length === 0,
        data: results,
        error: errors.length > 0 ? errors.join('; ') : undefined,
        metadata: {
          duration: Date.now() - startTime,
          count: results.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        data: results,
        metadata: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Upload de arquivo a partir de URL
   */
  async uploadFromUrl(url: string, path: string, bucket?: string): Promise<StorageResponse<UploadResult>> {
    try {
      // Fetch the file
      const response = await fetch(url);
      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to fetch file from URL',
        };
      }

      const blob = await response.blob();
      const file = new File([blob], path.split('/').pop() || 'file', {
        type: response.headers.get('content-type') || 'application/octet-stream',
      });

      return this.upload({
        file,
        path,
        bucket,
      });
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // ============================================================================
  // DOWNLOAD OPERATIONS
  // ============================================================================

  /**
   * Download de arquivo
   */
  async download(path: string, bucket?: string): Promise<StorageResponse<Blob>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket || this.config.defaultBucket)
        .download(path);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Download de múltiplos arquivos como ZIP
   */
  async downloadAsZip(_paths: string[], _bucket?: string): Promise<StorageResponse<Blob>> {
    try {
      // This would require a backend service to create ZIP
      // For now, we'll return an error suggesting to use the edge function
      return {
        success: false,
        error: 'Use the generate-zip edge function for creating ZIP files',
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // ============================================================================
  // FILE MANAGEMENT
  // ============================================================================

  /**
   * Lista arquivos em uma pasta
   */
  async list(folder: string = '', bucket?: string): Promise<StorageResponse<StorageFile[]>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket || this.config.defaultBucket)
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as StorageFile[],
        metadata: {
          count: data.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Move arquivo
   */
  async move(options: MoveOptions): Promise<StorageResponse<void>> {
    try {
      const bucket = options.bucket || this.config.defaultBucket;

      const { error } = await supabase.storage
        .from(bucket)
        .move(options.fromPath, options.toPath);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Update metadata in database
      await this.updateFileMetadata(bucket, options.fromPath, {
        path: options.toPath,
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Copia arquivo
   */
  async copy(fromPath: string, toPath: string, bucket?: string): Promise<StorageResponse<UploadResult>> {
    try {
      const downloadResult = await this.download(fromPath, bucket);

      if (!downloadResult.success || !downloadResult.data) {
        return {
          success: false,
          error: downloadResult.error,
        };
      }

      return this.upload({
        file: downloadResult.data,
        path: toPath,
        bucket,
      });
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Deleta arquivo
   */
  async delete(path: string, bucket?: string, permanent: boolean = false): Promise<StorageResponse<void>> {
    try {
      const bucketName = bucket || this.config.defaultBucket;

      if (permanent) {
        // Permanent deletion
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([path]);

        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }

        // Delete metadata
        await this.deleteFileMetadata(bucketName, path);
      } else {
        // Soft delete (move to trash)
        await this.updateFileMetadata(bucketName, path, {
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        });
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Deleta múltiplos arquivos
   */
  async deleteBatch(paths: string[], bucket?: string, permanent: boolean = false): Promise<StorageResponse<void>> {
    try {
      const results = await Promise.all(
        paths.map(path => this.delete(path, bucket, permanent))
      );

      const errors = results.filter(r => !r.success);

      if (errors.length > 0) {
        return {
          success: false,
          error: `Failed to delete ${errors.length} files`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Restaura arquivo da lixeira
   */
  async restore(path: string, bucket?: string): Promise<StorageResponse<void>> {
    try {
      await this.updateFileMetadata(bucket || this.config.defaultBucket, path, {
        is_deleted: false,
        deleted_at: undefined,
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // ============================================================================
  // URL GENERATION
  // ============================================================================

  /**
   * Retorna URL pública do arquivo
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Retorna URL do CDN
   */
  getCDNUrl(bucket: string, path: string): string {
    return `${this.config.cdnUrl}/${bucket}/${path}`;
  }

  /**
   * Gera URL assinada (signed URL) para acesso temporário
   */
  async getSignedUrl(
    path: string,
    expiresIn: number = 3600,
    bucket?: string
  ): Promise<StorageResponse<string>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket || this.config.defaultBucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data.signedUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Gera URLs assinadas em lote
   */
  async getSignedUrls(
    paths: string[],
    expiresIn: number = 3600,
    bucket?: string
  ): Promise<StorageResponse<Array<{ path: string; url: string }>>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket || this.config.defaultBucket)
        .createSignedUrls(paths, expiresIn);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data.map((item: any, index: number) => ({
          path: paths[index],
          url: item.signedUrl,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // ============================================================================
  // IMAGE OPTIMIZATION
  // ============================================================================

  /**
   * Retorna URL otimizada de imagem com transformações
   */
  getOptimizedImageUrl(
    bucket: string,
    path: string,
    options?: ImageOptimizationOptions
  ): string {
    const baseUrl = this.getCDNUrl(bucket, path);

    if (!options) {
      return baseUrl;
    }

    const params = new URLSearchParams();

    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.format) params.append('format', options.format);
    if (options.resize) params.append('resize', options.resize);

    return `${baseUrl}?${params.toString()}`;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Valida arquivo antes do upload
   */
  private validateFile(file: File | Blob): { valid: boolean; error?: string } {
    const fileObj = file as File;

    // Check size
    if (fileObj.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum of ${this.formatBytes(this.config.maxFileSize)}`,
      };
    }

    // Check type
    if (fileObj.type && this.config.allowedTypes.length > 0) {
      const isAllowed = this.config.allowedTypes.some(pattern => {
        if (pattern.endsWith('/*')) {
          return fileObj.type.startsWith(pattern.replace('/*', ''));
        }
        return fileObj.type === pattern;
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: `File type ${fileObj.type} is not allowed`,
        };
      }
    }

    return { valid: true };
  }

  // ============================================================================
  // METADATA MANAGEMENT
  // ============================================================================

  /**
   * Armazena metadata do arquivo no banco
   */
  private async storeFileMetadata(
    bucket: string,
    uploadResult: UploadResult,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const filename = uploadResult.path.split('/').pop() || '';
      const folder = uploadResult.path.split('/').slice(0, -1).join('/');

      await supabase.from('storage_files').insert({
        user_id: user.id,
        bucket,
        path: uploadResult.path,
        url: uploadResult.url,
        cdn_url: uploadResult.cdnUrl,
        filename,
        size: uploadResult.size,
        mime_type: uploadResult.type,
        folder: folder || null,
        metadata: metadata || {},
        is_deleted: false,
      });
    } catch (error) {
      console.error('Failed to store file metadata:', error);
    }
  }

  /**
   * Atualiza metadata do arquivo
   */
  private async updateFileMetadata(
    bucket: string,
    path: string,
    updates: Partial<FileMetadata>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      await supabase
        .from('storage_files')
        .update(updates)
        .eq('user_id', user.id)
        .eq('bucket', bucket)
        .eq('path', path);
    } catch (error) {
      console.error('Failed to update file metadata:', error);
    }
  }

  /**
   * Deleta metadata do arquivo
   */
  private async deleteFileMetadata(bucket: string, path: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      await supabase
        .from('storage_files')
        .delete()
        .eq('user_id', user.id)
        .eq('bucket', bucket)
        .eq('path', path);
    } catch (error) {
      console.error('Failed to delete file metadata:', error);
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Formata bytes para formato legível
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Cancela upload em andamento
   */
  cancelUpload(bucket: string, path: string): void {
    const uploadId = `${bucket}/${path}`;
    const controller = this.uploadAbortControllers.get(uploadId);

    if (controller) {
      controller.abort();
      this.uploadAbortControllers.delete(uploadId);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const storageService = new StorageService();

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const uploadFile = storageService.upload.bind(storageService);
export const uploadBatch = storageService.uploadBatch.bind(storageService);
export const downloadFile = storageService.download.bind(storageService);
export const deleteFile = storageService.delete.bind(storageService);
export const listFiles = storageService.list.bind(storageService);
export const getPublicUrl = storageService.getPublicUrl.bind(storageService);
export const getCDNUrl = storageService.getCDNUrl.bind(storageService);
