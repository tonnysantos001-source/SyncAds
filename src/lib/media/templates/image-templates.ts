/**
 * Image Templates - Professional Presets
 * Templates prontos para Social Media, Marketing e Business
 */

export interface ImageTemplate {
    id: string;
    name: string;
    category: 'social' | 'marketing' | 'business';
    width: number;
    height: number;
    description: string;
    preview: string;
    backgroundColor: string;
    suggestedPrompt: string;
}

// Social Media Templates
export const SOCIAL_MEDIA_TEMPLATES: ImageTemplate[] = [
    {
        id: 'instagram_post',
        name: 'Instagram Post',
        category: 'social',
        width: 1080,
        height: 1080,
        description: 'Quadrado perfeito para feed do Instagram',
        preview: '1:1',
        backgroundColor: '#f3f4f6',
        suggestedPrompt: 'Modern minimalist design with vibrant colors, professional product photography',
    },
    {
        id: 'instagram_story',
        name: 'Instagram Story',
        category: 'social',
        width: 1080,
        height: 1920,
        description: 'Vertical para stories e reels',
        preview: '9:16',
        backgroundColor: '#1f2937',
        suggestedPrompt: 'Eye-catching vertical design, bold text overlay, vibrant background',
    },
    {
        id: 'instagram_reels_cover',
        name: 'Instagram Reels Cover',
        category: 'social',
        width: 1080,
        height: 1920,
        description: 'Thumbnail para Reels do Instagram',
        preview: '9:16',
        backgroundColor: '#000000',
        suggestedPrompt: 'Dynamic action shot, bright colors, attention-grabbing design',
    },
    {
        id: 'facebook_post',
        name: 'Facebook Post',
        category: 'social',
        width: 1200,
        height: 630,
        description: 'Otimizado para compartilhamento no Facebook',
        preview: '1.91:1',
        backgroundColor: '#ffffff',
        suggestedPrompt: 'Professional social media graphic, clean layout, engaging visuals',
    },
    {
        id: 'twitter_header',
        name: 'Twitter Header',
        category: 'social',
        width: 1500,
        height: 500,
        description: 'Banner de perfil do Twitter/X',
        preview: '3:1',
        backgroundColor: '#1da1f2',
        suggestedPrompt: 'Wide banner design, professional branding, cohesive color scheme',
    },
    {
        id: 'linkedin_post',
        name: 'LinkedIn Post',
        category: 'social',
        width: 1200,
        height: 627,
        description: 'Post profissional para LinkedIn',
        preview: '1.91:1',
        backgroundColor: '#0077b5',
        suggestedPrompt: 'Professional business graphic, modern corporate design, clean typography',
    },
];

// Marketing Templates
export const MARKETING_TEMPLATES: ImageTemplate[] = [
    {
        id: 'youtube_thumbnail',
        name: 'YouTube Thumbnail',
        category: 'marketing',
        width: 1280,
        height: 720,
        description: 'Thumbnail chamativo para vídeos do YouTube',
        preview: '16:9',
        backgroundColor: '#ff0000',
        suggestedPrompt: 'Exciting YouTube thumbnail, bold text, expressive facial expression, vibrant colors',
    },
    {
        id: 'banner_ad_leaderboard',
        name: 'Banner Ad - Leaderboard',
        category: 'marketing',
        width: 728,
        height: 90,
        description: 'Banner horizontal padrão para anúncios',
        preview: '8:1',
        backgroundColor: '#111827',
        suggestedPrompt: 'Compact banner ad, clear call-to-action, product focus',
    },
    {
        id: 'banner_ad_rectangle',
        name: 'Banner Ad - Rectangle',
        category: 'marketing',
        width: 300,
        height: 250,
        description: 'Retângulo médio para ads',
        preview: '1.2:1',
        backgroundColor: '#374151',
        suggestedPrompt: 'Square banner ad, promotional design, sale announcement',
    },
    {
        id: 'facebook_ad',
        name: 'Facebook Ad',
        category: 'marketing',
        width: 1200,
        height: 628,
        description: 'Anúncio otimizado para Facebook Ads',
        preview: '1.91:1',
        backgroundColor: '#0084ff',
        suggestedPrompt: 'Conversion-focused ad design, clear product shot, compelling headline',
    },
    {
        id: 'google_display_ad',
        name: 'Google Display Ad',
        category: 'marketing',
        width: 336,
        height: 280,
        description: 'Anúncio vertical para Google Display Network',
        preview: '1.2:1',
        backgroundColor: '#4285f4',
        suggestedPrompt: 'Professional display ad, product showcase, clear branding',
    },
    {
        id: 'pinterest_pin',
        name: 'Pinterest Pin',
        category: 'marketing',
        width: 1000,
        height: 1500,
        description: 'Pin vertical otimizado para Pinterest',
        preview: '2:3',
        backgroundColor: '#e60023',
        suggestedPrompt: 'Aesthetic Pinterest pin, lifestyle photography, inspiring design',
    },
];

// Business Templates
export const BUSINESS_TEMPLATES: ImageTemplate[] = [
    {
        id: 'logo_square',
        name: 'Logo Quadrado',
        category: 'business',
        width: 512,
        height: 512,
        description: 'Logo em formato quadrado',
        preview: '1:1',
        backgroundColor: '#ffffff',
        suggestedPrompt: 'Minimalist modern logo, clean design, professional branding, simple icon',
    },
    {
        id: 'business_card_front',
        name: 'Business Card (Front)',
        category: 'business',
        width: 1050,
        height: 600,
        description: 'Frente do cartão de visita',
        preview: '1.75:1',
        backgroundColor: '#1f2937',
        suggestedPrompt: 'Professional business card design, corporate branding, clean layout',
    },
    {
        id: 'flyer_a4',
        name: 'Flyer A4',
        category: 'business',
        width: 2480,
        height: 3508,
        description: 'Flyer tamanho A4 (300 DPI)',
        preview: '210:297',
        backgroundColor: '#ffffff',
        suggestedPrompt: 'Professional flyer design, event promotion, clear hierarchy, attractive layout',
    },
    {
        id: 'presentation_slide',
        name: 'Presentation Slide',
        category: 'business',
        width: 1920,
        height: 1080,
        description: 'Slide de apresentação 16:9',
        preview: '16:9',
        backgroundColor: '#f3f4f6',
        suggestedPrompt: 'Clean presentation slide, corporate design, data visualization, professional',
    },
    {
        id: 'email_header',
        name: 'Email Header',
        category: 'business',
        width: 600,
        height: 200,
        description: 'Cabeçalho para email marketing',
        preview: '3:1',
        backgroundColor: '#111827',
        suggestedPrompt: 'Email header design, promotional banner, brand colors, clear message',
    },
    {
        id: 'cover_photo_facebook',
        name: 'Facebook Cover Photo',
        category: 'business',
        width: 820,
        height: 312,
        description: 'Foto de capa para página do Facebook',
        preview: '2.6:1',
        backgroundColor: '#3b5998',
        suggestedPrompt: 'Business Facebook cover, professional branding, company showcase',
    },
];

// All templates combined
export const ALL_IMAGE_TEMPLATES: ImageTemplate[] = [
    ...SOCIAL_MEDIA_TEMPLATES,
    ...MARKETING_TEMPLATES,
    ...BUSINESS_TEMPLATES,
];

// Templates by category
export const TEMPLATES_BY_CATEGORY = {
    social: SOCIAL_MEDIA_TEMPLATES,
    marketing: MARKETING_TEMPLATES,
    business: BUSINESS_TEMPLATES,
};

// Get template by ID
export function getTemplateById(id: string): ImageTemplate | undefined {
    return ALL_IMAGE_TEMPLATES.find((template) => template.id === id);
}

// Get templates by category
export function getTemplatesByCategory(category: 'social' | 'marketing' | 'business'): ImageTemplate[] {
    return TEMPLATES_BY_CATEGORY[category];
}
