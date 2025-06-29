import React from 'react';
import { ReadabilityChart } from '../ReadabilityChart';
import { ReadabilityPoint } from '../../types/contracts';

import { LineChart as ReadabilityIcon } from 'lucide-react'; // Import icon

interface ReadabilityReportProps {
  data: ReadabilityPoint[] | null | undefined; // Can be undefined if not present in analysisData
  // isLoading and error props are removed
}

export const ReadabilityReport: React.FC<ReadabilityReportProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
          <ReadabilityIcon className="w-6 h-6 mr-2 text-green-500"/> Readability Analysis
        </h2>
        <p className="text-gray-600 text-center py-4">Not enough text to generate a readability chart or no data available.</p>
      </div>
    );
  }

  // data is guaranteed to be non-null and non-empty here
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
        <ReadabilityIcon className="w-6 h-6 mr-2 text-green-500"/> Readability Analysis
      </h2>
      <ReadabilityChart data={data} />
    </div>
  );
};
