import React from 'react';
import { ColorPaletteAnalysis } from '../../types/contracts';
import ColorPaletteDisplay from '../ColorPaletteDisplay';

interface ColorPaletteReportProps {
  analysis: ColorPaletteAnalysis | null;
  // isLoading and error props are removed as parent handles this
}

export const ColorPaletteReport: React.FC<ColorPaletteReportProps> = ({ analysis }) => {
  if (!analysis || analysis.dominantColors.length === 0) {
    // It's possible `analysis` exists but `dominantColors` is empty.
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Color Palette Analysis</h2>
        <p className="text-gray-600 text-center py-4">No color palette data available or not enough distinct colors found.</p>
      </div>
    );
  }

  // Ensure displayData is constructed correctly based on ColorPaletteAnalysis structure
  const displayData = {
    palette: analysis.dominantColors.map(c => ({ hexCode: c.hex, name: c.name, frequency: c.prominence * 100 }))
  };

  return <ColorPaletteDisplay data={displayData} />;
};
