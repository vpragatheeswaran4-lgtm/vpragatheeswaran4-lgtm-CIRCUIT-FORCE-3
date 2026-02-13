
import React from 'react';

interface SensorCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  colorClass: string;
}

const SensorCard: React.FC<SensorCardProps> = ({ label, value, unit, icon, colorClass }) => {
  return (
    <div className={`p-6 bg-white border border-stone-100 shadow-sm curved-edge flex items-center space-x-4 transition-all hover:shadow-md hover:-translate-y-1`}>
      <div className={`p-3 rounded-2xl ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-stone-800">{value}</span>
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default SensorCard;
