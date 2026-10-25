import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface AudioPlaybackCallbacks {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
}

export interface AudioBridge {
  play: (audioUrl: string, rate?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
}

class UniversalAudioPlayer {
  private activeSound: any = null;
  private bridge: AudioBridge | null = null;
  private audioMode: 'gemini-native' | 'speech' | 'idle' = 'idle';
  private textChunks: string[] = [];
  private currentChunkIdx = 0;
  private currentRate = 1.0;
  private isPaused = false;
  private callbacks: AudioPlaybackCallbacks = {};

  registerBridge(bridge: AudioBridge) {
    this.bridge = bridge;
  }

  unregisterBridge() {
    this.bridge = null;
  }

  notifyBridgeStart() {
    this.callbacks.onStart?.();
  }

  notifyBridgeDone() {
    this.audioMode = 'idle';
    this.callbacks.onDone?.();
  }

  notifyBridgeError(err: any) {
    console.warn('Bridge playback error, falling back to speech:', err);
    this.fallbackToSpeech();
  }

  // Safely attempt to load Expo Audio without top-level crash
  private getNativeAudioEngine() {
    try {
      const ea = require('expo-audio');
      if (ea?.createAudioPlayer) {
        return { type: 'expo-audio' as const, module: ea };
      }
    } catch {
      // expo-audio not available in this client
    }

    return null;
  }

  // Split text into safe chunks under 2500 characters
  private splitIntoSafeChunks(str: string, maxLen = 2500): string[] {
    if (str.length <= maxLen) return [str];
    const sentences = str.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [str];
    const chunks: string[] = [];
    let cur = '';
    for (const s of sentences) {
      if ((cur + s).length > maxLen) {
        if (cur.trim()) chunks.push(cur.trim());
        cur = s;
      } else {
        cur += s;
      }
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks.length > 0 ? chunks : [str.slice(0, maxLen)];
  }

  private fallbackToSpeech() {
    this.audioMode = 'speech';
    this.currentChunkIdx = 0;
    this.speakCurrentChunk();
  }

  /**
   * Play text using Gemini audio (via WebView bridge or native audio) or safe chunked speech
   */
  async play(
    text: string,
    geminiAudioDataUrl?: string | null,
    rate = 1.0,
    callbacks: AudioPlaybackCallbacks = {}
  ): Promise<void> {
    await this.stop();

    this.currentRate = rate;
    this.callbacks = callbacks;
    this.isPaused = false;

    const cleanSpeech = text
      .replace(/[*#_`~|-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    this.textChunks = this.splitIntoSafeChunks(cleanSpeech, 2500);

    // 1. If Gemini audio is provided and bridge is registered, use WebAudio bridge (100% reliable)
    if (geminiAudioDataUrl && this.bridge) {
      try {
        this.audioMode = 'gemini-native';
        this.bridge.play(geminiAudioDataUrl, this.currentRate);
        return;
      } catch (bridgeErr) {
        console.warn('Bridge play exception:', bridgeErr);
      }
    }

    // 2. Try native audio engines if available
    if (geminiAudioDataUrl) {
      const engine = this.getNativeAudioEngine();

      if (engine?.type === 'expo-audio') {
        try {
          const player = engine.module.createAudioPlayer(geminiAudioDataUrl);
          this.activeSound = player;
          this.audioMode = 'gemini-native';
          player.playbackRate = this.currentRate;
          player.play();
          this.callbacks.onStart?.();
          return;
        } catch (audioErr) {
          console.warn('expo-audio playback failed, falling back to speech:', audioErr);
          this.activeSound = null;
        }
      }
    }

    // 3. Fallback: Safe chunked speech engine (works 100% on all Android/iOS/Expo Go)
    this.fallbackToSpeech();
  }

  private speakCurrentChunk() {
    if (this.isPaused) return;

    if (this.currentChunkIdx >= this.textChunks.length) {
      this.audioMode = 'idle';
      this.callbacks.onDone?.();
      return;
    }

    const chunk = this.textChunks[this.currentChunkIdx];

    if (this.currentChunkIdx === 0) {
      this.callbacks.onStart?.();
    }

    Speech.speak(chunk, {
      rate: this.currentRate,
      onStart: () => {},
      onDone: () => {
        if (!this.isPaused) {
          this.currentChunkIdx++;
          this.speakCurrentChunk();
        }
      },
      onError: (err) => {
        console.warn('Speech chunk error:', err);
        this.audioMode = 'idle';
        this.callbacks.onError?.(err);
      },
      onStopped: () => {
        // Handled via pause/stop
      },
    });
  }

  async pause(): Promise<void> {
    this.isPaused = true;

    if (this.audioMode === 'gemini-native') {
      if (this.bridge) {
        this.bridge.pause();
        return;
      }
      if (this.activeSound) {
        try {
          if (typeof this.activeSound.pauseAsync === 'function') {
            await this.activeSound.pauseAsync();
          } else if (typeof this.activeSound.pause === 'function') {
            this.activeSound.pause();
          }
        } catch (e) {
          console.warn('Pause native sound error:', e);
        }
        return;
      }
    }

    // Speech mode pause
    if (this.audioMode === 'speech') {
      try {
        if (Platform.OS === 'ios') {
          await Speech.pause();
        } else {
          // On Android, Speech.pause throws an error.
          // Safely stop the current chunk; resume will speak from currentChunkIdx!
          await Speech.stop();
        }
      } catch (e) {
        await Speech.stop().catch(() => {});
      }
    }
  }

  async resume(): Promise<void> {
    this.isPaused = false;

    if (this.audioMode === 'gemini-native') {
      if (this.bridge) {
        this.bridge.resume();
        return;
      }
      if (this.activeSound) {
        try {
          if (typeof this.activeSound.playAsync === 'function') {
            await this.activeSound.playAsync();
          } else if (typeof this.activeSound.play === 'function') {
            this.activeSound.play();
          }
        } catch (e) {
          console.warn('Resume native sound error:', e);
        }
        return;
      }
    }

    // Speech mode resume
    if (this.audioMode === 'speech') {
      try {
        if (Platform.OS === 'ios') {
          await Speech.resume();
        } else {
          // On Android, continue speaking from currentChunkIdx
          this.speakCurrentChunk();
        }
      } catch (e) {
        this.speakCurrentChunk();
      }
    }
  }

  async stop(): Promise<void> {
    this.isPaused = false;
    this.audioMode = 'idle';
    this.textChunks = [];
    this.currentChunkIdx = 0;

    if (this.bridge) {
      try {
        this.bridge.stop();
      } catch {}
    }

    if (this.activeSound) {
      try {
        if (typeof this.activeSound.stopAsync === 'function') {
          await this.activeSound.stopAsync();
        }
        if (typeof this.activeSound.unloadAsync === 'function') {
          await this.activeSound.unloadAsync();
        }
      } catch {}
      this.activeSound = null;
    }

    try {
      await Speech.stop();
    } catch {}
  }

  async setRate(rate: number): Promise<void> {
    this.currentRate = rate;

    if (this.bridge) {
      try {
        this.bridge.setRate(rate);
      } catch {}
    }

    if (this.activeSound) {
      try {
        if (typeof this.activeSound.setRateAsync === 'function') {
          await this.activeSound.setRateAsync(rate, true);
        } else if (typeof this.activeSound.setPlaybackRate === 'function') {
          this.activeSound.setPlaybackRate(rate);
        }
      } catch {}
    }
  }
}

export const audioPlayer = new UniversalAudioPlayer();
