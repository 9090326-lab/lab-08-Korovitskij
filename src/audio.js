// src/audio.ts
import { gameBus } from './bus.js';
export class AudioManager {
    // Оголошуємо всі поля класу та їхні точні типи
    ctx = null;
    sounds = {};
    isUnlocked = false;
    constructor() {
        this.ctx = null;
        this.sounds = {};
        this.isUnlocked = false;
        // Підписуємося на події гри без прямого імпорту рушія
        gameBus.addEventListener('fired', () => this.play('shoot'));
        gameBus.addEventListener('hit', () => this.play('hit'));
        gameBus.addEventListener('exploded', () => this.play('exploded'));
    }
    getContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) {
                throw new Error('AudioContext не підтримується у цьому браузері');
            }
            this.ctx = new AudioCtx();
        }
        return this.ctx;
    }
    // Розблокування аудіоконтексту після жесту гравця
    async unlock() {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        this.isUnlocked = true;
    }
    setSounds(soundBuffers) {
        this.sounds = soundBuffers;
    }
    play(name) {
        // Безпечне отримання звуку з урахуванням noUncheckedIndexedAccess
        const sound = this.sounds[name];
        if (!this.ctx || !sound)
            return;
        try {
            const source = this.ctx.createBufferSource();
            source.buffer = sound;
            source.connect(this.ctx.destination);
            source.start(0);
        }
        catch (err) {
            // Сувора типізація помилки (unknown замість any)
            if (err instanceof Error) {
                console.warn(`Не вдалося відтворити звук ${name}:`, err.message);
            }
            else {
                console.warn(`Не вдалося відтворити звук ${name}:`, err);
            }
        }
    }
}
export const audioManager = new AudioManager();
