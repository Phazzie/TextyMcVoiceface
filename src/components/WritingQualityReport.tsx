import React, { useState, useEffect } from 'react';
import { WritingQualityAnalysis } from '../types/contracts';
import { useNotifier } from '../hooks/useNotifier';

// Import existing and future report components
import { ColorPaletteReport } from './reports/ColorPaletteReport';
import { LiteraryDevicesReport } from './reports/LiteraryDevicesReport';
import { ReadabilityReport } from './reports/ReadabilityReport';
// Placeholder for new reports - will be created in a later step
import { OverviewReport } from './reports/OverviewReport';
import { ShowTellReport } from './reports/ShowTellReport';
import { TropesReport } from './reports/TropesReport';
import { ProseReport } from './reports/ProseReport';

// Event names
const ANALYSIS_STARTED = 'ANALYSIS_STARTED';
const ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE';

export const WritingQualityReport: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<WritingQualityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // For potential errors from event subscription itself
  const { on } = useNotifier();

  useEffect(() => {
    const handleAnalysisStarted = () => {
      setIsLoading(true);
      setAnalysisData(null);
      setError(null);
    };

    const handleAnalysisComplete = (data: WritingQualityAnalysis) => {
      setIsLoading(false);
      setAnalysisData(data);
      setError(null);
    };

    const unsubscribeStarted = on(ANALYSIS_STARTED, handleAnalysisStarted);
    const unsubscribeComplete = on(ANALYSIS_COMPLETE, handleAnalysisComplete);

    // Placeholder: Simulate analysis trigger if no external trigger exists yet
    // In a real scenario, another part of the app would call notify(ANALYSIS_STARTED)
    // and notify(ANALYSIS_COMPLETE, { ...data })
    // For now, let's assume this component might not be the one triggering, just listening.

    return () => {
      unsubscribeStarted();
      unsubscribeComplete();
    };
  }, [on]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto my-8 text-center">
        <p className="text-xl font-semibold text-gray-700">Loading writing quality analysis...</p>
        {/* You could add a spinner here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto my-8 text-center">
        <p className="text-xl font-semibold text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto my-8 text-center">
        <p className="text-gray-600">No analysis data available. Analysis might not have run yet.</p>
      </div>
    );
  }

  // The main container will no longer have tabs. It will render a collection of reports.
  // The individual report components will be created/updated in subsequent steps.
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto my-8 space-y-8">
      {/*
        The following components are placeholders for now.
        They will be properly implemented and imported in the next steps.
        The props passed to them will be based on the `WritingQualityAnalysis` interface.
      */}

      {analysisData.overallScore && <OverviewReport overallScore={analysisData.overallScore} />}
      {analysisData.showTellIssues && <ShowTellReport issues={analysisData.showTellIssues} />}
      {analysisData.tropeMatches && <TropesReport matches={analysisData.tropeMatches} />}
      {analysisData.purpleProseIssues && <ProseReport issues={analysisData.purpleProseIssues} />}

      {analysisData.readabilityPoints && (
        <ReadabilityReport data={analysisData.readabilityPoints} />
      )}
      {analysisData.colorPalette && (
        <ColorPaletteReport analysis={analysisData.colorPalette} />
      )}
      {analysisData.literaryDevices && (
        <LiteraryDevicesReport devices={analysisData.literaryDevices} />
      )}

      {/* Section for Echo Chamber, if it's to be displayed.
          Assuming it will have its own component: EchoChamberReport
      */}
      {/* {analysisData.echoChamber && analysisData.echoChamber.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Echo Chamber</h2>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(analysisData.echoChamber, null, 2)}</pre>
        </div>
      )} */}
      {/* Removed the raw data display section for Overview, Show/Tell, Tropes, Prose as they now have components */}

      {/* Displaying raw data for Echo Chamber until its specific component is made (if planned) */}
      {analysisData.echoChamber && analysisData.echoChamber.length > 0 && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Echo Chamber Analysis</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">{JSON.stringify(analysisData.echoChamber, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};