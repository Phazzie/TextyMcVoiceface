import React from 'react';
import { ShowTellIssue } from '../../types/contracts';

interface ShowTellReportProps {
  issues?: ShowTellIssue[];
}

export const ShowTellReport: React.FC<ShowTellReportProps> = ({ issues }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Show vs. Tell Analysis</h2>
        <div className="text-center p-6 bg-green-50 text-green-800 rounded-lg">
          <p className="font-semibold">No significant "telling" statements found. Great job showing the story!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Show vs. Tell Analysis</h2>
      <ul className="space-y-4">
        {issues.map((issue, index) => (
          <li key={index} className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg shadow">
            <p className="font-semibold text-yellow-800">Telling Statement (Severity: {issue.severity}):</p>
            <blockquote className="italic text-gray-600 border-l-4 border-yellow-400 pl-4 my-2">
              {issue.text}
            </blockquote>
            <p className="font-semibold text-green-800 mt-2">Suggestion:</p>
            <p className="text-gray-700">{issue.suggestion}</p>
            {issue.example && (
              <>
                <p className="font-semibold text-blue-800 mt-2">Example of showing:</p>
                <p className="text-gray-700 italic">{issue.example}</p>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
