export function speakWord(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.95;
    utter.pitch = 1.0;
    const voices = synth.getVoices();
    const enUs = voices.find((v) => v.lang === 'en-US' || v.lang.startsWith('en-US'));
    if (enUs) {
      utter.voice = enUs;
    }
    synth.speak(utter);
  } catch {
    // Ignore speech synthesis errors on restricted browsers
  }
}
