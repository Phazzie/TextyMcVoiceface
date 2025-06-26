import React from 'react';
import { TropeMatch } from '../../types/contracts';

interface TropesReportProps {
  matches?: TropeMatch[];
}

export const TropesReport: React.FC<TropesReportProps> = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Trope Analysis</h2>
        <div className="text-center p-6 bg-green-50 text-green-800 rounded-lg">
          <p className="font-semibold">No common tropes detected. Your story is refreshingly original!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Trope Analysis</h2>
      <ul className="space-y-4">
        {matches.map((trope, index) => (
          <li key={index} className="p-4 border border-blue-300 bg-blue-50 rounded-lg shadow">
            <h3 className="font-semibold text-blue-800 text-lg">Trope Detected: {trope.name}</h3>
            <p className="text-sm text-gray-600 mb-1">Category: {trope.category}</p>
            <p className="font-semibold text-gray-800 mt-1">Confidence: {trope.confidence.toFixed(2)}</p>
            <blockquote className="italic text-gray-600 border-l-4 border-blue-400 pl-4 my-2">
              "{trope.text}"
            </blockquote>
            <p className="text-gray-700 text-sm">{trope.description}</p>
            {trope.subversionSuggestions && trope.subversionSuggestions.length > 0 && (
              <>
                <p className="font-semibold text-indigo-800 mt-2">Subversion Suggestions:</p>
                <ul className="list-disc list-inside pl-4 text-sm text-gray-700">
                  {trope.subversionSuggestions.map((suggestion, sIndex) => (
                    <li key={sIndex}>{suggestion}</li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
