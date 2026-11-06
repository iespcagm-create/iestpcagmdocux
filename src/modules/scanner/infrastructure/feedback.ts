let audioContext: AudioContext | null = null;

export function speakText(text: string, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') {
    return;
  }

  if (
    !('speechSynthesis' in window) ||
    typeof window.SpeechSynthesisUtterance === 'undefined'
  ) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PE';
    utterance.rate = 0.98;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // La voz es opcional; el escaneo continúa si falla.
  }
}

export function playCaptureSound(): void {
  try {
    if (typeof window === 'undefined' || !window.AudioContext) {
      return;
    }

    if (audioContext === null) {
      audioContext = new window.AudioContext();
    }

    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  } catch {
    // El sonido es opcional; la captura ya se completó.
  }
}
