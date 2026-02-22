// This file generates simple audio tones using Web Audio API
// Since we can't download external files, we'll create synthetic sounds

export function createSuccessSound(): string {
    // Base64 encoded short beep sound (placeholder)
    // In production, replace with actual matrix-themed sound files
    return 'data:audio/wav;base64,UklGRl9vT19QQVhPV0FWRWZtdAAAABAAAAABADgA';
}

export function createLevelUpSound(): string {
    return 'data:audio/wav;base64,UklGRl9vT19QQVhPV0FWRWZtdAAAABAAAAABADgA';
}

// For now, we'll use a simpler approach with AudioContext
export function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (typeof window === 'undefined') return;

    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        // Ignore audio errors
    }
}

// Matrix-themed sound presets
export const MatrixSounds = {
    success: () => {
        playTone(880, 0.1, 'sine');
        setTimeout(() => playTone(1100, 0.15, 'sine'), 100);
    },
    levelUp: () => {
        playTone(440, 0.1, 'sine');
        setTimeout(() => playTone(550, 0.1, 'sine'), 100);
        setTimeout(() => playTone(660, 0.1, 'sine'), 200);
        setTimeout(() => playTone(880, 0.2, 'sine'), 300);
    },
    xp: () => {
        playTone(1200, 0.05, 'sine');
    },
    click: () => {
        playTone(800, 0.03, 'square');
    },
    error: () => {
        playTone(200, 0.2, 'sawtooth');
    },
    mission: () => {
        playTone(660, 0.1, 'sine');
        setTimeout(() => playTone(880, 0.1, 'sine'), 100);
        setTimeout(() => playTone(1100, 0.15, 'sine'), 200);
    },
    playAction: () => {
        playTone(1200, 0.05, 'sine');
        setTimeout(() => playTone(900, 0.05, 'sine'), 50);
    },
    playTick: () => {
        playTone(1500, 0.01, 'sine');
    }
};
