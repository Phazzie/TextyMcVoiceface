import React, { useState, useEffect } from 'react';
import { Eye, Lightbulb, Sparkles, Palette, Zap, LineChart as ReadabilityIcon } from 'lucide-react';
import { 
  WritingQualityReport as QualityReportType, 
  ColorPaletteAnalysis,
  LiteraryDeviceInstance,
  ReadabilityPoint
} from '../types/contracts';
import { ColorPaletteReport } from './reports/ColorPaletteReport';
import { LiteraryDevicesReport } from './reports/LiteraryDevicesReport';
import { ReadabilityReport } from './reports/ReadabilityReport';
import { SeamManager } from '../services/SeamManager';

interface WritingQualityReportProps {
  report: QualityReportType;
  originalText: string;
}

export const WritingQualityReport: React.FC<WritingQualityReportProps> = ({ report, originalText }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'show-tell' | 'tropes' | 'prose' | 'color-palette' | 'literary-devices' | 'readability'>('overview');

  // State for Color Palette
  const [colorPalette, setColorPalette] = useState<ColorPaletteAnalysis | null>(null);
  const [isColorPaletteLoading, setIsColorPaletteLoading] = useState(false);
  const [colorPaletteError, setColorPaletteError] = useState<string | null>(null);

  // State for Literary Devices
  const [literaryDevices, setLiteraryDevices] = useState<LiteraryDeviceInstance[]>([]);
  const [isLiteraryDevicesLoading, setIsLiteraryDevicesLoading] = useState(false);
  const [literaryDevicesError, setLiteraryDevicesError] = useState<string | null>(null);

  // State for Readability
  const [readabilityData, setReadabilityData] = useState<ReadabilityPoint[] | null>(null);
  const [isReadabilityLoading, setIsReadabilityLoading] = useState(false);
  const [readabilityError, setReadabilityError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllAnalysisData = async () => {
      setIsColorPaletteLoading(true);
      setIsLiteraryDevicesLoading(true);
      setIsReadabilityLoading(true);

      try {
        const seamManager = SeamManager.getInstance();
        const qualityAnalyzer = seamManager.getWritingQualityAnalyzer();
        const aiEnhancer = seamManager.getAIEnhancementService();

        const [colorResult, devicesResult, readabilityResult] = await Promise.all([
          qualityAnalyzer.analyzeColorPalette(originalText),
          aiEnhancer.analyzeLiteraryDevices(originalText),
          qualityAnalyzer.analyzeReadabilityRollercoaster(originalText)
        ]);

        // Process color palette results
        if (colorResult.success) {
          setColorPalette(colorResult.data || null);
        } else {
          setColorPaletteError(colorResult.error || 'Failed to fetch color palette.');
        }

        // Process literary devices results
        if (devicesResult.success) {
          setLiteraryDevices(devicesResult.data || []);
        } else {
          setLiteraryDevicesError(devicesResult.error || 'Failed to fetch literary devices.');
        }

        // Process readability results
        if (readabilityResult.success) {
          setReadabilityData(readabilityResult.data || null);
        } else {
          setReadabilityError(readabilityResult.error || 'Failed to fetch readability data.');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setColorPaletteError(errorMessage);
        setLiteraryDevicesError(errorMessage);
        setReadabilityError(errorMessage);
      } finally {
        setIsColorPaletteLoading(false);
        setIsLiteraryDevicesLoading(false);
        setIsReadabilityLoading(false);
      }
    };

    if (originalText) {
      fetchAllAnalysisData();
    }
  }, [originalText]);


  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getOverallGrade = () => {
    const avg = (report.overallScore.showVsTell + report.overallScore.tropeOriginality + report.overallScore.proseClarity) / 3;
    if (avg >= 90) return { grade: 'A+', desc: 'Exceptional' };
    if (avg >= 80) return { grade: 'A', desc: 'Excellent' };
    if (avg >= 70) return { grade: 'B', desc: 'Good' };
    if (avg >= 60) return { grade: 'C', desc: 'Fair' };
    if (avg >= 50) return { grade: 'D', desc: 'Needs Improvement' };
    return { grade: 'F', desc: 'Significant Issues' };
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'show-tell':
        return renderShowTell();
      case 'tropes':
        return renderTropes();
      case 'prose':
        return renderPurpleProse();
      case 'color-palette':
        return <ColorPaletteReport analysis={colorPalette} isLoading={isColorPaletteLoading} error={colorPaletteError} />;
      case 'literary-devices':
        return <LiteraryDevicesReport devices={literaryDevices} isLoading={isLiteraryDevicesLoading} error={literaryDevicesError} />;
      case 'readability':
        return <ReadabilityReport data={readabilityData} isLoading={isReadabilityLoading} error={readabilityError} />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => {
    const overallGrade = getOverallGrade();
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 p-6 bg-gray-50 rounded-lg shadow-inner">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Overall Grade</h3>
          <div className="text-center">
            <p className={`text-7xl font-bold ${getScoreColor(overallGrade.grade.charCodeAt(0))}`}>{overallGrade.grade}</p>
            <p className="text-xl text-gray-600 mt-2">{overallGrade.desc}</p>
          </div>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg text-center ${getScoreColor(report.overallScore.showVsTell)}`}>
            <Eye className="mx-auto h-8 w-8 mb-2" />
            <p className="font-bold">Show vs. Tell</p>
            <p className="text-2xl font-bold">{report.overallScore.showVsTell}/100</p>
          </div>
          <div className={`p-4 rounded-lg text-center ${getScoreColor(report.overallScore.tropeOriginality)}`}>
            <Lightbulb className="mx-auto h-8 w-8 mb-2" />
            <p className="font-bold">Trope Originality</p>
            <p className="text-2xl font-bold">{report.overallScore.tropeOriginality}/100</p>
          </div>
          <div className={`p-4 rounded-lg text-center ${getScoreColor(report.overallScore.proseClarity)}`}>
            <Sparkles className="mx-auto h-8 w-8 mb-2" />
            <p className="font-bold">Prose Clarity</p>
            <p className="text-2xl font-bold">{report.overallScore.proseClarity}/100</p>
          </div>
        </div>
      </div>
    );
  };

  const renderShowTell = () => (
    <div>
      <h3 className="text-xl font-bold mb-4">Show vs. Tell Analysis</h3>
      {report.showTellIssues.length === 0 ? (
        <div className="text-center p-6 bg-green-50 text-green-800 rounded-lg">
          <p className="font-semibold">No significant "telling" statements found. Great job showing the story!</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {report.showTellIssues.map((issue, index) => (
            <li key={index} className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
              <p className="font-semibold text-yellow-800">Telling Statement:</p>
              <blockquote className="italic text-gray-600 border-l-4 border-yellow-400 pl-4 my-2">{issue.text}</blockquote>
              <p className="font-semibold text-green-800 mt-2">Suggestion:</p>
              <p className="text-gray-700">{issue.suggestion}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderTropes = () => (
    <div>
      <h3 className="text-xl font-bold mb-4">Trope Analysis</h3>
      {report.tropeMatches.length === 0 ? (
        <div className="text-center p-6 bg-green-50 text-green-800 rounded-lg">
          <p className="font-semibold">No common tropes detected. Your story is refreshingly original!</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {report.tropeMatches.map((trope, index) => (
            <li key={index} className="p-4 border border-blue-300 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-800">Trope Detected: {trope.name}</p>
              <blockquote className="italic text-gray-600 border-l-4 border-blue-400 pl-4 my-2">{trope.text}</blockquote>
              <p className="font-semibold text-gray-800 mt-2">Confidence: {trope.confidence}</p>
              <p className="text-gray-700">{trope.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderPurpleProse = () => (
    <div>
      <h3 className="text-xl font-bold mb-4">Purple Prose Analysis</h3>
      {report.purpleProseIssues.length === 0 ? (
        <div className="text-center p-6 bg-green-50 text-green-800 rounded-lg">
          <p className="font-semibold">Your prose is clear and concise. No purple prose found!</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {report.purpleProseIssues.map((issue, index) => (
            <li key={index} className="p-4 border border-purple-300 bg-purple-50 rounded-lg">
              <p className="font-semibold text-purple-800">Overly Ornate Phrase:</p>
              <blockquote className="italic text-gray-600 border-l-4 border-purple-400 pl-4 my-2">{issue.text}</blockquote>
              <p className="font-semibold text-green-800 mt-2">Suggestion:</p>
              <p className="text-gray-700">{issue.suggestion}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto my-8">
      <div className="flex border-b mb-6">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 font-semibold ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Overview</button>
        <button onClick={() => setActiveTab('show-tell')} className={`px-4 py-2 font-semibold ${activeTab === 'show-tell' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Show/Tell</button>
        <button onClick={() => setActiveTab('tropes')} className={`px-4 py-2 font-semibold ${activeTab === 'tropes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Tropes</button>
        <button onClick={() => setActiveTab('prose')} className={`px-4 py-2 font-semibold ${activeTab === 'prose' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Prose</button>
        <button onClick={() => setActiveTab('color-palette')} className={`flex items-center px-4 py-2 font-semibold ${activeTab === 'color-palette' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}><Palette className="w-4 h-4 mr-2"/>Color Palette</button>
        <button onClick={() => setActiveTab('literary-devices')} className={`flex items-center px-4 py-2 font-semibold ${activeTab === 'literary-devices' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}><Zap className="w-4 h-4 mr-2"/>Literary Devices</button>
        <button onClick={() => setActiveTab('readability')} className={`flex items-center px-4 py-2 font-semibold ${activeTab === 'readability' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}><ReadabilityIcon className="w-4 h-4 mr-2"/>Readability</button>
      </div>
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};