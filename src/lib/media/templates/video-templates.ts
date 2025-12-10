/**
 * Video Templates - Remotion Based Templates
 * Templates profissionais de vídeo para renderização programática
 */

export interface VideoTemplate {
    id: string;
    name: string;
    category: 'marketing' | 'social' | 'education' | 'slideshow';
    duration: number; // seconds
    resolution: '720p' | '1080p' | '4K';
    fps: number;
    description: string;
    preview: string;
    suggestedPrompt: string;
    customizableFields: string[];
}

// Marketing Templates
export const MARKETING_VIDEO_TEMPLATES: VideoTemplate[] = [
    {
        id: 'product_demo_15s',
        name: 'Product Demo (15s)',
        category: 'marketing',
        duration: 15,
        resolution: '1080p',
        fps: 30,
        description: 'Demo rápido de produto com transições suaves',
        preview: '16:9',
        suggestedPrompt: 'Professional product showcase with smooth transitions',
        customizableFields: ['productName', 'tagline', 'ctaText', 'backgroundColor'],
    },
    {
        id: 'promo_ad_30s',
        name: 'Promo Ad (30s)',
        category: 'marketing',
        duration: 30,
        resolution: '1080p',
        fps: 30,
        description: 'Anúncio promocional com call-to-action',
        preview: '16:9',
        suggestedPrompt: 'Dynamic promotional video with bold text and energetic music',
        customizableFields: ['headline', 'offer', 'cta', 'brandColor'],
    },
    {
        id: 'explainer_60s',
        name: 'Explainer Video (60s)',
        category: 'marketing',
        duration: 60,
        resolution: '1080p',
        fps: 30,
        description: 'Vídeo explicativo animado',
        preview: '16:9',
        suggestedPrompt: 'Animated explainer video with icons and simple graphics',
        customizableFields: ['steps', 'icons', 'narration', 'colors'],
    },
];

// Social Media Templates
export const SOCIAL_VIDEO_TEMPLATES: VideoTemplate[] = [
    {
        id: 'tiktok_vertical',
        name: 'TikTok/Reels Template',
        category: 'social',
        duration: 15,
        resolution: '1080p',
        fps: 30,
        description: 'Vertical video otimizado para TikTok e Instagram Reels',
        preview: '9:16',
        suggestedPrompt: 'Trendy vertical video with fast cuts and upbeat music',
        customizableFields: ['hook', 'textOverlay', 'transition', 'music'],
    },
    {
        id: 'instagram_reel',
        name: 'Instagram Reel',
        category: 'social',
        duration: 30,
        resolution: '1080p',
        fps: 30,
        description: 'Reel curto e impactante',
        preview: '9:16',
        suggestedPrompt: 'Eye-catching Instagram Reel with transitions and effects',
        customizableFields: ['clips', 'effects', 'captions', 'music'],
    },
    {
        id: 'youtube_intro',
        name: 'YouTube Intro (5s)',
        category: 'social',
        duration: 5,
        resolution: '1080p',
        fps: 60,
        description: 'Intro rápida para vídeos do YouTube',
        preview: '16:9',
        suggestedPrompt: 'Dynamic YouTube intro with logo animation',
        customizableFields: ['logo', 'channelName', 'animation', 'music'],
    },
];

// Education Templates
export const EDUCATION_VIDEO_TEMPLATES: VideoTemplate[] = [
    {
        id: 'tutorial_intro',
        name: 'Tutorial Intro',
        category: 'education',
        duration: 10,
        resolution: '1080p',
        fps: 30,
        description: 'Introdução para vídeos tutoriais',
        preview: '16:9',
        suggestedPrompt: 'Clean tutorial intro with topic title and instructor name',
        customizableFields: ['topic', 'instructorName', 'background'],
    },
    {
        id: 'course_promo',
        name: 'Course Promo',
        category: 'education',
        duration: 45,
        resolution: '1080p',
        fps: 30,
        description: 'Promoção de curso online',
        preview: '16:9',
        suggestedPrompt: 'Professional course promotion with key benefits highlighted',
        customizableFields: ['courseName', 'benefits', 'instructor', 'cta'],
    },
];

// Slideshow Templates
export const SLIDESHOW_VIDEO_TEMPLATES: VideoTemplate[] = [
    {
        id: 'photo_slideshow_music',
        name: 'Photo Slideshow com Música',
        category: 'slideshow',
        duration: 60,
        resolution: '1080p',
        fps: 30,
        description: 'Apresentação de fotos com transições e música',
        preview: '16:9',
        suggestedPrompt: 'Beautiful photo slideshow with smooth transitions and background music',
        customizableFields: ['photos', 'transitions', 'music', 'duration'],
    },
    {
        id: 'text_animation',
        name: 'Text Animation',
        category: 'slideshow',
        duration: 15,
        resolution: '1080p',
        fps: 30,
        description: 'Animação de texto com efeitos',
        preview: '16:9',
        suggestedPrompt: 'Kinetic typography with smooth text animations',
        customizableFields: ['text', 'font', 'animation', 'background'],
    },
    {
        id: 'logo_reveal',
        name: 'Logo Reveal',
        category: 'slideshow',
        duration: 5,
        resolution: '1080p',
        fps: 60,
        description: 'Revelação de logo animada',
        preview: '16:9',
        suggestedPrompt: 'Professional logo reveal animation',
        customizableFields: ['logo', 'revealStyle', 'music', 'colors'],
    },
];

// All templates combined
export const ALL_VIDEO_TEMPLATES: VideoTemplate[] = [
    ...MARKETING_VIDEO_TEMPLATES,
    ...SOCIAL_VIDEO_TEMPLATES,
    ...EDUCATION_VIDEO_TEMPLATES,
    ...SLIDESHOW_VIDEO_TEMPLATES,
];

// Templates by category
export const VIDEO_TEMPLATES_BY_CATEGORY = {
    marketing: MARKETING_VIDEO_TEMPLATES,
    social: SOCIAL_VIDEO_TEMPLATES,
    education: EDUCATION_VIDEO_TEMPLATES,
    slideshow: SLIDESHOW_VIDEO_TEMPLATES,
};

// Get template by ID
export function getVideoTemplateById(id: string): VideoTemplate | undefined {
    return ALL_VIDEO_TEMPLATES.find((template) => template.id === id);
}

// Get templates by category
export function getVideoTemplatesByCategory(
    category: 'marketing' | 'social' | 'education' | 'slideshow'
): VideoTemplate[] {
    return VIDEO_TEMPLATES_BY_CATEGORY[category];
}

// Get templates by duration
export function getVideoTemplatesByDuration(maxDuration: number): VideoTemplate[] {
    return ALL_VIDEO_TEMPLATES.filter((template) => template.duration <= maxDuration);
}
