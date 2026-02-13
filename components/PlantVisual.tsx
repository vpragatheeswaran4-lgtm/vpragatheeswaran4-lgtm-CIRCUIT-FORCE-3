
import React from 'react';
import { Mood } from '../types';

interface PlantVisualProps {
  mood: Mood;
  color: string;
}

const PlantVisual: React.FC<PlantVisualProps> = ({ mood, color }) => {
  // Simple SVG mapping for different plant states
  const getPlantSVG = () => {
    switch (mood) {
      case Mood.THIRSTY:
        return "https://cdn-icons-png.flaticon.com/512/3062/3062145.png"; // Drooping
      case Mood.SCARED:
        return "https://cdn-icons-png.flaticon.com/512/2833/2833333.png"; // Alert
      case Mood.SICK:
        return "https://cdn-icons-png.flaticon.com/512/3062/3062140.png"; // Wilted
      default:
        return "https://cdn-icons-png.flaticon.com/512/3062/3062123.png"; // Happy sprout
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-white curved-edge shadow-lg border border-stone-100 h-full">
      <div className={`absolute top-6 right-6 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${color}`}>
        {mood}
      </div>
      
      <div className="relative w-48 h-48 mb-6 animate-float">
        <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 ${color.split(' ')[0]}`}></div>
        <img 
          src={getPlantSVG()} 
          alt="Plant Avatar" 
          className="w-full h-full object-contain relative z-10"
        />
      </div>

      <h2 className="text-3xl font-bold text-stone-800 mb-2">Flora</h2>
      <p className="text-stone-500 text-center px-4 italic">"I'm more than just data. I'm your environmental guardian."</p>
    </div>
  );
};

export default PlantVisual;
