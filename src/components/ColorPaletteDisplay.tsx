import React from 'react';

export interface ColorPaletteItem {
  hexCode: string;
  name: string;
  frequency: number;
}

export interface ColorPaletteResult {
  palette: ColorPaletteItem[];
}

interface ColorPaletteDisplayProps {
  data?: ColorPaletteResult; // Make data prop optional for mock
}

// Mock data definition
const mockColorPaletteData: ColorPaletteResult = {
  palette: [
    { hexCode: '#FF5733', name: 'Fiery Coral', frequency: 15 },
    { hexCode: '#33FF57', name: 'Luminous Green', frequency: 22 },
    { hexCode: '#3357FF', name: 'Deep Sapphire', frequency: 8 },
    { hexCode: '#F0E68C', name: 'Pale Khaki', frequency: 30 },
    { hexCode: '#D2B48C', name: 'Tan', frequency: 12 },
  ],
};

const ColorPaletteDisplay: React.FC<ColorPaletteDisplayProps> = ({ data = mockColorPaletteData }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Story's Color Palette</h3>
      <div className="space-y-3">
        {data.palette.map((color, index) => (
          <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
            <div
              className="w-6 h-6 rounded-sm mr-3 border border-gray-300"
              style={{ backgroundColor: color.hexCode }}
              title={`Hex: ${color.hexCode}`}
            ></div>
            <span className="text-sm font-medium text-gray-700 flex-1">{color.name}</span>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{color.frequency} uses</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPaletteDisplay;
