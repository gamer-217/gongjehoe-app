// 듣기 버튼(§10.1) — Web Speech API. 해당 언어 음성이 없으면 숨김
import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';

const BCP47: Record<string, string> = { ko: 'ko', en: 'en', vi: 'vi', ne: 'ne', id: 'id' };

function hasVoice(lang: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith(BCP47[lang] ?? lang));
}

export function ListenButton(props: { text: string; lang: string; label: string }) {
  const [ok, setOk] = useState(() => hasVoice(props.lang));
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const update = () => setOk(hasVoice(props.lang));
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, [props.lang]);
  if (!ok) return null;
  const speak = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(props.text);
    u.lang = BCP47[props.lang] ?? props.lang;
    window.speechSynthesis.speak(u);
  };
  return (
    <button type="button" className="ui-iconbtn" onClick={speak} aria-label={props.label}>
      <Volume2 size={22} aria-hidden />
    </button>
  );
}
