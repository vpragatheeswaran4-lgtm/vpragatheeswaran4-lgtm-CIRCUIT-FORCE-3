
export enum Mood {
  HAPPY = 'Happy',
  THIRSTY = 'Thirsty',
  SICK = 'Sick',
  SCARED = 'Scared',
  STRESSED = 'Stressed',
  CALM = 'Calm'
}

export interface SensorData {
  airQuality: number; // MQ-135 (0-100 score)
  harmfulGas: number; // MQ-2/7 (ppm)
  soilMoisture: number; // %
  vibration: number; // SW-420 (0-10 activity)
  temperature: number; // °C
  humidity: number; // %
  timestamp: Date;
}

export interface PlantState {
  mood: Mood;
  message: string;
  color: string;
  emoji: string;
}
