import { Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeech';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export default function VoiceButton({ onTranscript, className = '' }: VoiceButtonProps) {
  const { listening, supported, start, stop } = useSpeechRecognition(onTranscript);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      className={`btn-icon ${listening ? 'bg-burgundy-500 text-white animate-pulse' : 'bg-stainless-200 text-chef-muted'} ${className}`}
      aria-label={listening ? 'Stop listening' : 'Start voice input'}
    >
      {listening ? <MicOff size={22} /> : <Mic size={22} />}
    </button>
  );
}

export function VoiceInput({
  value,
  onChange,
  placeholder,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}) {
  const handleTranscript = (text: string) => {
    onChange(text);
    if (onSubmit) setTimeout(onSubmit, 300);
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field flex-1"
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
      />
      <VoiceButton onTranscript={handleTranscript} />
    </div>
  );
}
