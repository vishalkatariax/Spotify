import { useState } from 'react';

interface DiscoveryDialProps {
  value: number;
  onChange: (value: number) => void;
}

export default function DiscoveryDial({ value, onChange }: DiscoveryDialProps) {
  const [isDragging, setIsDragging] = useState(false);

  const presets = [
    { label: 'Comfort', value: 20, description: 'Familiar favorites' },
    { label: 'Balanced', value: 50, description: 'Mix of known & new' },
    { label: 'Explorer', value: 80, description: 'Deep discoveries' },
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    onChange(newValue);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const getGradientColor = (val: number) => {
    // Interpolate between green (comfort) and purple (explorer)
    const ratio = val / 100;
    const r = Math.round(34 + (168 - 34) * ratio);
    const g = Math.round(197 + (85 - 197) * ratio);
    const b = Math.round(94 + (247 - 94) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getDialLabel = (val: number) => {
    if (val < 30) return 'Comfort Zone';
    if (val < 50) return 'Balanced Mix';
    if (val < 70) return 'Adventure';
    return 'Deep Explorer';
  };

  return (
    <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight flex items-center mb-2">
          <span className="h-2 w-2 bg-spotify-green rounded-full mr-2.5 animate-pulse"></span>
          Discovery Dial
        </h2>
        <p className="text-sm text-gray-400">
          Adjust to control how familiar or obscure your recommendations are
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
              value === preset.value
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="relative mb-6">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={handleSliderChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #22c55e 0%, ${getGradientColor(value)} ${value}%, #333 ${value}%, #333 100%)`,
          }}
        />
        
        {/* Custom thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg transform -translate-x-1/2 pointer-events-none transition-all duration-150"
          style={{
            left: `${value}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: isDragging ? '0 0 20px rgba(255, 255, 255, 0.5)' : '0 0 10px rgba(255, 255, 255, 0.3)',
          }}
        />
      </div>

      {/* Value Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-white">{value}</span>
          <span className="text-sm text-gray-400">/ 100</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-spotify-green">{getDialLabel(value)}</div>
          <div className="text-xs text-gray-500">
            {value < 30 ? 'Similar to your favorites' : value < 50 ? 'Balanced recommendations' : value < 70 ? 'Exploring new territory' : 'Deep discoveries ahead'}
          </div>
        </div>
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-4">
        <span className="font-semibold">Comfort</span>
        <span className="font-semibold">Explorer</span>
      </div>
    </div>
  );
}
