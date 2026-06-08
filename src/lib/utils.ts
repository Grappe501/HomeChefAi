import { GAMIFICATION_LEVELS } from '@/types';

export function getLevelInfo(xp: number, level: number) {
  const current = GAMIFICATION_LEVELS.find((l) => l.level === level) || GAMIFICATION_LEVELS[0];
  const next = GAMIFICATION_LEVELS.find((l) => l.level === level + 1);
  const nextXp = next?.xp ?? current.xp + 500;
  const progress = next ? ((xp - current.xp) / (nextXp - current.xp)) * 100 : 100;
  return { current, next, nextXp, progress: Math.min(100, Math.max(0, progress)) };
}

export function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function speak(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}

export function parseQuantityOption(option: string): { quantity: number; unit: string } {
  const map: Record<string, { quantity: number; unit: string }> = {
    '1/4 gallon': { quantity: 0.25, unit: 'gallon' },
    '1/2 gallon': { quantity: 0.5, unit: 'gallon' },
    '1 gallon': { quantity: 1, unit: 'gallon' },
    '1/2 stick': { quantity: 0.5, unit: 'stick' },
    '1 stick': { quantity: 1, unit: 'stick' },
    '2 sticks': { quantity: 2, unit: 'sticks' },
    '1 lb': { quantity: 1, unit: 'lb' },
    '4 oz': { quantity: 4, unit: 'oz' },
    '8 oz': { quantity: 8, unit: 'oz' },
    '16 oz': { quantity: 16, unit: 'oz' },
  };
  if (map[option]) return map[option];
  const num = parseFloat(option);
  return { quantity: isNaN(num) ? 1 : num, unit: 'each' };
}

export const LOCATION_EMOJI: Record<string, string> = {
  pantry: '🥫',
  fridge: '🧊',
  freezer: '❄️',
};

export const CATEGORY_COLORS: Record<string, string> = {
  produce: 'bg-green-100 text-green-800',
  dairy: 'bg-blue-100 text-blue-800',
  meat: 'bg-red-100 text-red-800',
  pantry: 'bg-amber-100 text-amber-800',
  frozen: 'bg-cyan-100 text-cyan-800',
  other: 'bg-gray-100 text-gray-800',
};
