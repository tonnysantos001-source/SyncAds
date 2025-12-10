/**
 * Audio Generation Providers - Multi-API Support
 * Unified interface for audio generation APIs (TTS, Music, SFX)
 * 
 * Supported providers:
 * - ElevenLabs (premium TTS)
 * - Play.ht (alternative TTS)
 * - Stable Audio (music & SFX)
 * - Suno AI (music generation)
 */

export interface AudioGenerationOptions {
    type: 'tts' | 'music' | 'sfx';
    text?: string; // For TTS
    prompt?: string; // For music/SFX generation
    voice?: string; // Voice ID for TTS
    duration?: number; // seconds (for music/SFX)
    style?: 'natural' | 'expressive' | 'calm' | 'energetic';
}

export interface AudioGenerationResult {
    url: string;
    type: 'tts' | 'music' | 'sfx';
    text?: string;
    prompt?: string;
    provider: string;
    timestamp: number;
    cost: number; // in credits
    metadata: {
        model: string;
        duration: number;
        voice?: string;
    };
}

export interface AudioProvider {
    id: string;
    name: string;
    description: string;
    type: ('tts' | 'music' | 'sfx')[];
    costPer1000Chars?: number; // For TTS
    costPerSecond?: number; // For music/SFX
    supportedVoices?: string[];
    generate: (options: AudioGenerationOptions) => Promise<AudioGenerationResult>;
    isAvailable: () => Promise<boolean>;
}

// Provider implementations
export const AUDIO_PROVIDERS: Record<string, AudioProvider> = {
    elevenlabs_tts: {
        id: 'elevenlabs_tts',
        name: 'ElevenLabs TTS',
        description: 'Premium ultra-realistic text-to-speech',
        type: ['tts'],
        costPer1000Chars: 30, // $0.30/1k chars = 30 créditos
        supportedVoices: [
            'rachel', 'drew', 'clyde', 'paul', 'domi',
            'dave', 'fin', 'sarah', 'antoni', 'thomas'
        ],
        generate: async (options) => {
            // TODO: Implementar ElevenLabs API
            // https://elevenlabs.io/docs
            throw new Error('ElevenLabs not implemented yet');
        },
        isAvailable: async () => {
            return !!process.env.ELEVENLABS_API_KEY;
        },
    },

    playht_tts: {
        id: 'playht_tts',
        name: 'Play.ht TTS',
        description: 'High-quality text-to-speech alternative',
        type: ['tts'],
        costPer1000Chars: 15, // Mais barato que ElevenLabs
        supportedVoices: [
            'matthew', 'joanna', 'ivy', 'justin', 'kendra',
            'kimberly', 'salli', 'joey', 'nicole', 'russell'
        ],
        generate: async (options) => {
            // TODO: Implementar Play.ht API
            // https://docs.play.ht
            throw new Error('Play.ht not implemented yet');
        },
        isAvailable: async () => {
            return !!process.env.PLAYHT_API_KEY;
        },
    },

    stable_audio: {
        id: 'stable_audio',
        name: 'Stable Audio',
        description: 'AI music and sound effects generation',
        type: ['music', 'sfx'],
        costPerSecond: 1, // $0.01/sec
        generate: async (options) => {
            // TODO: Implementar Stable Audio API
            // https://platform.stability.ai
            throw new Error('Stable Audio not implemented yet');
        },
        isAvailable: async () => {
            return !!process.env.STABILITY_API_KEY;
        },
    },

    suno_music: {
        id: 'suno_music',
        name: 'Suno AI Music',
        description: 'Full song generation with vocals',
        type: ['music'],
        costPerSecond: 2,
        generate: async (options) => {
            // TODO: Implementar Suno AI API (se disponível)
            throw new Error('Suno AI not implemented yet');
        },
        isAvailable: async () => {
            return !!process.env.SUNO_API_KEY;
        },
    },
};

/**
 * Get available providers by type
 */
export async function getAvailableAudioProviders(
    type?: 'tts' | 'music' | 'sfx'
): Promise<AudioProvider[]> {
    const providers = Object.values(AUDIO_PROVIDERS);
    const available = await Promise.all(
        providers.map(async (p) => ({
            provider: p,
            isAvailable: await p.isAvailable(),
        }))
    );

    let filtered = available
        .filter((p) => p.isAvailable)
        .map((p) => p.provider);

    if (type) {
        filtered = filtered.filter((p) => p.type.includes(type));
    }

    return filtered;
}

/**
 * Generate audio with automatic fallback
 */
export async function generateAudioWithFallback(
    options: AudioGenerationOptions,
    preferredProvider?: string
): Promise<AudioGenerationResult> {
    const availableProviders = await getAvailableAudioProviders(options.type);

    if (availableProviders.length === 0) {
        throw new Error(`No ${options.type} providers available`);
    }

    // Try preferred provider first
    if (preferredProvider) {
        const preferred = availableProviders.find((p) => p.id === preferredProvider);
        if (preferred) {
            try {
                return await preferred.generate(options);
            } catch (error) {
                console.error(`Preferred provider ${preferredProvider} failed:`, error);
            }
        }
    }

    // Try providers in order of quality/cost
    const sortedProviders = [...availableProviders].sort((a, b) => {
        const costA = a.costPer1000Chars || a.costPerSecond || 0;
        const costB = b.costPer1000Chars || b.costPerSecond || 0;
        return costB - costA; // Higher cost = better quality
    });

    for (const provider of sortedProviders) {
        try {
            return await provider.generate(options);
        } catch (error) {
            console.error(`Provider ${provider.id} failed:`, error);
        }
    }

    throw new Error('All audio generation providers failed');
}

/**
 * Get provider by ID
 */
export function getAudioProvider(providerId: string): AudioProvider | undefined {
    return AUDIO_PROVIDERS[providerId];
}

/**
 * Get TTS providers
 */
export async function getTTSProviders(): Promise<AudioProvider[]> {
    return getAvailableAudioProviders('tts');
}

/**
 * Get music providers
 */
export async function getMusicProviders(): Promise<AudioProvider[]> {
    return getAvailableAudioProviders('music');
}

/**
 * Get SFX providers
 */
export async function getSFXProviders(): Promise<AudioProvider[]> {
    return getAvailableAudioProviders('sfx');
}
