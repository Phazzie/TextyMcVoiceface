import React from 'react';
import { ReadabilityChart } from '../ReadabilityChart';
import { ReadabilityPoint } from '../../types/contracts';

interface ReadabilityReportProps {
  data: ReadabilityPoint[] | null;
  isLoading: boolean;
  error: string | null;
}

export const ReadabilityReport: React.FC<ReadabilityReportProps> = ({ data, isLoading, error }) => {
  if (isLoading) {
    return <div className="text-center p-4">Loading readability chart...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">Error: {error}</div>;
  }

  if (data && data.length > 0) {
    return <ReadabilityChart data={data} />;
  }

  if (data && data.length === 0) {
    return <div className="text-center p-4">Not enough text to generate a readability chart.</div>;
  }

  return null;
};
