/**
 * Sound notification service using Web Audio API synthesis
 * No dependency on external audio file URLs, works offline and reliably.
 */
class NotificationService {
  private audioCtx: AudioContext | null = null

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.audioCtx = new AudioCtx()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
    return this.audioCtx
  }

  /**
   * Plays a pleasant dual-tone chime when a token is called at reception
   * "Ding-Dong" tone: 659.25 Hz (E5) -> 523.25 Hz (C5)
   */
  public playTokenCall(): void {
    try {
      const ctx = this.getAudioContext()
      if (!ctx) return

      const now = ctx.currentTime

      // Tone 1: High chime
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(659.25, now) // E5
      gain1.gain.setValueAtTime(0.3, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.5)

      // Tone 2: Lower chime
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(523.25, now + 0.25) // C5
      gain2.gain.setValueAtTime(0.35, now + 0.25)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.25)
      osc2.stop(now + 0.85)
    } catch (e) {
      console.warn('Audio chime playback omitted (user gesture required or unsupported):', e)
    }
  }

  /**
   * Success notification chime
   */
  public playSuccess(): void {
    try {
      const ctx = this.getAudioContext()
      if (!ctx) return
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, now) // A5
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.3)
    } catch {
      // Ignore
    }
  }
}

export const notificationService = new NotificationService()
