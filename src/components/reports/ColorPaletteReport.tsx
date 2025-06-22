import React from 'react';
import { ColorPaletteAnalysis } from '../../types/contracts';
import ColorPaletteDisplay from '../ColorPaletteDisplay';

interface ColorPaletteReportProps {
  analysis: ColorPaletteAnalysis | null;
  isLoading: boolean;
  error: string | null;
}

export const ColorPaletteReport: React.FC<ColorPaletteReportProps> = ({ analysis, isLoading, error }) => {
  if (isLoading) {
    return <div className="text-center p-4">Loading Color Palette...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">Error: {error}</div>;
  }

  if (!analysis) {
    return <div className="text-center p-4">No color palette data available.</div>;
  }

  const displayData = {
    palette: analysis.dominantColors.map(c => ({ hexCode: c.hex, name: c.name, frequency: c.prominence * 100 }))
  };

  return <ColorPaletteDisplay data={displayData} />;
};
