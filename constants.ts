
import { Mood, PlantState } from './types';

export const SENSOR_THRESHOLDS = {
  SOIL_DRY: 30,
  GAS_DANGER: 150,
  AIR_POLLUTED: 60,
  VIBRATION_STRESS: 7,
};

export const MOOD_MAP: Record<Mood, PlantState> = {
  [Mood.HAPPY]: {
    mood: Mood.HAPPY,
    message: "I feel clean and fresh!",
    color: "bg-emerald-100 text-emerald-700",
    emoji: "😊"
  },
  [Mood.THIRSTY]: {
    mood: Mood.THIRSTY,
    message: "A little drink would be lovely.",
    color: "bg-amber-100 text-amber-700",
    emoji: "😢"
  },
  [Mood.SICK]: {
    mood: Mood.SICK,
    message: "The air is not good today...",
    color: "bg-purple-100 text-purple-700",
    emoji: "😷"
  },
  [Mood.SCARED]: {
    mood: Mood.SCARED,
    message: "Detecting harmful gases!",
    color: "bg-rose-100 text-rose-700",
    emoji: "🚨"
  },
  [Mood.STRESSED]: {
    mood: Mood.STRESSED,
    message: "Too much movement here.",
    color: "bg-orange-100 text-orange-700",
    emoji: "🌪️"
  },
  [Mood.CALM]: {
    mood: Mood.CALM,
    message: "Everything is peaceful.",
    color: "bg-sky-100 text-sky-700",
    emoji: "😌"
  }
};
