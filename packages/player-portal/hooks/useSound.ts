'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SoundType = 'success' | 'levelup' | 'xp' | 'mission' | 'click' | 'error';

interface SoundConfig {
    src: string;
    volume: number;
}

const SOUNDS: Record<SoundType, SoundConfig> = {
    success: { src: '/sounds/success.mp3', volume: 0.5 },
    levelup: { src: '/sounds/levelup.mp3', volume: 0.7 },
    xp: { src: '/sounds/xp.mp3', volume: 0.4 },
    mission: { src: '/sounds/mission.mp3', volume: 0.6 },
    click: { src: '/sounds/click.mp3', volume: 0.3 },
    error: { src: '/sounds/error.mp3', volume: 0.4 },
};

const STORAGE_KEY = 'matrix-sound-enabled';

export function useSound() {
    const [enabled, setEnabled] = useState(true);
    const audioCache = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

    // Load preference from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored !== null) {
                setEnabled(stored === 'true');
            }
        }
    }, []);

    // Preload audio files
    useEffect(() => {
        if (typeof window === 'undefined') return;

        Object.entries(SOUNDS).forEach(([key, config]) => {
            const audio = new Audio(config.src);
            audio.preload = 'auto';
            audio.volume = config.volume;
            audioCache.current.set(key as SoundType, audio);
        });

        return () => {
            audioCache.current.forEach(audio => {
                audio.pause();
                audio.src = '';
            });
            audioCache.current.clear();
        };
    }, []);

    const play = useCallback((type: SoundType) => {
        if (!enabled) return;

        const audio = audioCache.current.get(type);
        if (audio) {
            // Clone the audio for overlapping sounds
            const clone = audio.cloneNode() as HTMLAudioElement;
            clone.volume = SOUNDS[type].volume;
            clone.play().catch(() => {
                // Ignore autoplay restrictions
            });
        }
    }, [enabled]);

    const toggleSound = useCallback(() => {
        setEnabled(prev => {
            const newValue = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, String(newValue));
            }
            return newValue;
        });
    }, []);

    const setVolume = useCallback((type: SoundType, volume: number) => {
        const audio = audioCache.current.get(type);
        if (audio) {
            audio.volume = Math.max(0, Math.min(1, volume));
            SOUNDS[type].volume = audio.volume;
        }
    }, []);

    return {
        play,
        enabled,
        toggleSound,
        setVolume,
    };
}

// Singleton for global sound access
let globalSoundInstance: ReturnType<typeof useSound> | null = null;

export function getGlobalSound() {
    return globalSoundInstance;
}

export function setGlobalSound(instance: ReturnType<typeof useSound>) {
    globalSoundInstance = instance;
}
