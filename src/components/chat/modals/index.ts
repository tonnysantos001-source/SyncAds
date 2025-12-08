/**
 * CHAT MODALS - EXPORTS
 * Sistema de modais contextuais inteligentes para o chat
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

// Main Manager
export { ChatModalManager } from './ChatModalManager';
export { default as ChatModalManagerDefault } from './ChatModalManager';

// Individual Modals
export { ChatModalNormal } from './ChatModalNormal';
export { default as ChatModalNormalDefault } from './ChatModalNormal';

export { VisualEditorModal } from './VisualEditorModal';
export { default as VisualEditorModalDefault } from './VisualEditorModal';

export { ImageGalleryModal } from './ImageGalleryModal';
export { default as ImageGalleryModalDefault } from './ImageGalleryModal';

export { VideoGalleryModal } from './VideoGalleryModal';
export { default as VideoGalleryModalDefault } from './VideoGalleryModal';

// Types (re-export from modalContext)
export type {
  ModalType,
  ModalContext,
} from '@/lib/ai/modalContext';

export {
  detectModalContext,
  shouldAutoTransition,
  getTransitionConfig,
  debugModalContext,
} from '@/lib/ai/modalContext';
