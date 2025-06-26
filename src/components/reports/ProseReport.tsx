import React from 'react';
import { PurpleProseIssue } from '../../types/contracts';

interface ProseReportProps {
  issues?: PurpleProseIssue[];
}

export const ProseReport: React.FC<ProseReportProps> = ({ issues }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Purple Prose Analysis</h2>
        <div className="text-center p-6 bg-green-50 text-green-800 rounded-lg">
          <p className="font-semibold">Your prose is clear and concise. No purple prose found!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Purple Prose Analysis</h2>
      <ul className="space-y-4">
        {issues.map((issue, index) => (
          <li key={index} className="p-4 border border-purple-300 bg-purple-50 rounded-lg shadow">
            <h3 className="font-semibold text-purple-800">Overly Ornate Phrase (Severity: {issue.severity}):</h3>
            <p className='text-sm text-gray-500 mb-1'>Type: {issue.type.replace(/_/g, ' ')}</p>
            <blockquote className="italic text-gray-600 border-l-4 border-purple-400 pl-4 my-2">
              {issue.text}
            </blockquote>
            <p className="font-semibold text-green-800 mt-2">Suggestion:</p>
            <p className="text-gray-700">{issue.suggestion}</p>
            {issue.simplifiedVersion && (
               <>
                <p className="font-semibold text-blue-800 mt-2">Simplified Version:</p>
                <p className="text-gray-700 italic">{issue.simplifiedVersion}</p>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
