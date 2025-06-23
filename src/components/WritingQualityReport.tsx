import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Eye, Lightbulb, Sparkles, BookOpen, Target, Palette, Zap, LineChart as ReadabilityIcon, TrendingUp } from 'lucide-react';
import { WritingQualityReport as QualityReportType, ShowTellIssue, TropeMatch, PurpleProseIssue, ReadabilityPoint, DialogueTurn, IWritingQualityAnalyzer, ContractResult } from '../types/contracts';
import { ColorPaletteReport } from './reports/ColorPaletteReport';
import { LiteraryDevicesReport } from './reports/LiteraryDevicesReport';
import { ReadabilityReport } from './reports/ReadabilityReport';
import { ReadabilityChart } from './ReadabilityChart';
import { PowerBalanceChart } from './reports/PowerBalanceChart';
import { SeamManager } from '../services/SeamManager';
import { WritingQualityAnalyzer } from '../services/implementations/WritingQualityAnalyzer';

interface WritingQualityReportProps {
  report: QualityReportType;
  originalText: string;
  analyzer?: IWritingQualityAnalyzer;
}

export const WritingQualityReport: React.FC<WritingQualityReportProps> = ({ report, originalText, analyzer: initialAnalyzer }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'show-tell' | 'tropes' | 'prose' | 'color-palette' | 'literary-devices' | 'readability' | 'power-balance'>('overview');

  // State for Color Palette
  const [colorPalette, setColorPalette] = useState<any | null>(null);
  const [isColorPaletteLoading, setIsColorPaletteLoading] = useState(false);
  const [colorPaletteError, setColorPaletteError] = useState<string | null>(null);

  // State for Literary Devices
  const [literaryDevices, setLiteraryDevices] = useState<any[]>([]);
  const [isLiteraryDevicesLoading, setIsLiteraryDevicesLoading] = useState(false);
  const [literaryDevicesError, setLiteraryDevicesError] = useState<string | null>(null);

  // State for Readability
  const [readabilityData, setReadabilityData] = useState<ReadabilityPoint[] | null>(null);
  const [isReadabilityLoading, setIsReadabilityLoading] = useState(false);
  const [readabilityError, setReadabilityError] = useState<string | null>(null);

  // State for Power Balance
  const [powerBalanceData, setPowerBalanceData] = useState<DialogueTurn[] | null>(null);
  const [isLoadingPowerBalance, setIsLoadingPowerBalance] = useState<boolean>(false);
  const [powerBalanceError, setPowerBalanceError] = useState<string | null>(null);

  const analyzer = initialAnalyzer || new WritingQualityAnalyzer();

  useEffect(() => {
    // Fetch color palette, literary devices, and readability data
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

  useEffect(() => {
    // Fetch readability and power balance data for new tabs
    const fetchReadability = async () => {
      setIsReadabilityLoading(true);
      setReadabilityError(null);
      try {
        const result = await analyzer.analyzeReadabilityRollercoaster(originalText);
        if (result.success && result.data) {
          setReadabilityData(result.data);
        } else {
          setReadabilityError(result.error || 'Failed to load readability data.');
          setReadabilityData([]);
        }
      } catch (err) {
        setReadabilityError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setReadabilityData([]);
      } finally {
        setIsReadabilityLoading(false);
      }
    };

    const fetchPowerBalance = async () => {
      setIsLoadingPowerBalance(true);
      setPowerBalanceError(null);
      try {
        const result = await analyzer.analyzeDialoguePowerBalance(originalText);
        if (result.success && result.data) {
          setPowerBalanceData(result.data);
        } else {
          setPowerBalanceError(result.error || 'Failed to load power balance data.');
          setPowerBalanceData([]);
        }
      } catch (err) {
        setPowerBalanceError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setPowerBalanceData([]);
      } finally {
        setIsLoadingPowerBalance(false);
      }
    };

    if (activeTab === 'readability' && !readabilityData && !isReadabilityLoading && !readabilityError) {
      fetchReadability();
    }
    if (activeTab === 'power-balance' && !powerBalanceData && !isLoadingPowerBalance && !powerBalanceError) {
      fetchPowerBalance();
    }
  }, [activeTab, originalText, analyzer, readabilityData, powerBalanceData, isReadabilityLoading, isLoadingPowerBalance, readabilityError, powerBalanceError]);

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
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'overview', label: 'Overview', icon: BookOpen },
          { key: 'show-tell', label: 'Show vs Tell', icon: Eye },
          { key: 'tropes', label: 'Trope Analysis', icon: Target },
          { key: 'prose', label: 'Prose Quality', icon: Sparkles },
          { key: 'readability', label: 'Readability', icon: ReadabilityIcon },
          { key: 'power-balance', label: 'Power Balance', icon: TrendingUp } // Added Power Balance Tab
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Score Overview */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className={`text-3xl font-bold mb-1 ${getScoreColor(report.overallScore.showVsTell).split(' ')[0]}`}>
                {report.overallScore.showVsTell}
              </div>
              <div className="text-sm text-gray-600">Show vs Tell</div>
              <div className="text-xs text-gray-500 mt-1">{report.showTellIssues.length} issues found</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className={`text-3xl font-bold mb-1 ${getScoreColor(report.overallScore.tropeOriginality).split(' ')[0]}`}>
                {report.overallScore.tropeOriginality}
              </div>
              <div className="text-sm text-gray-600">Originality</div>
              <div className="text-xs text-gray-500 mt-1">{report.tropeMatches.length} tropes detected</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <Sparkles className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className={`text-3xl font-bold mb-1 ${getScoreColor(report.overallScore.proseClarity).split(' ')[0]}`}>
                {report.overallScore.proseClarity}
              </div>
              <div className="text-sm text-gray-600">Prose Clarity</div>
              <div className="text-xs text-gray-500 mt-1">{report.purpleProseIssues.length} style issues</div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-800 mb-3">Quick Summary</h4>
            <div className="space-y-2 text-sm">
              {report.showTellIssues.length > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span>Consider showing more emotions and actions through concrete details</span>
                </div>
              )}
              {report.tropeMatches.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-blue-500" />
                  <span>Some common tropes detected - consider creative subversions</span>
                </div>
              )}
              {report.purpleProseIssues.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Prose could be simplified in places for better clarity</span>
                </div>
              )}
              {report.showTellIssues.length === 0 && report.tropeMatches.length === 0 && report.purpleProseIssues.length === 0 && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Great job! Your writing shows strong technical craft</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'show-tell' && (
        <ShowTellTab issues={report.showTellIssues} originalText={originalText} />
      )}

      {activeTab === 'tropes' && (
        <TropeAnalysisTab matches={report.tropeMatches} originalText={originalText} />
      )}

      {activeTab === 'prose' && (
        <ProseQualityTab issues={report.purpleProseIssues} originalText={originalText} />
      )}

      {activeTab === 'readability' && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Readability Rollercoaster (Flesch-Kincaid)</h4>
          {isLoadingReadability && <div className="text-center p-4">Loading readability chart...</div>}
          {readabilityError && <div className="text-center p-4 text-red-600">Error: {readabilityError}</div>}
          {readabilityData && readabilityData.length > 0 && !isLoadingReadability && !readabilityError && (
            <ReadabilityChart data={readabilityData} />
          )}
          {readabilityData && readabilityData.length === 0 && !isLoadingReadability && !readabilityError && (
            <div className="text-center p-4">Not enough text or paragraphs to generate a readability chart.</div>
          )}
        </div>
      )}

      {/* Power Balance Tab Content */}
      {activeTab === 'power-balance' && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Dialogue Power Balance</h4>
          {isLoadingPowerBalance && <div className="text-center p-4">Loading power balance chart...</div>}
          {powerBalanceError && <div className="text-center p-4 text-red-600">Error: {powerBalanceError}</div>}
          {powerBalanceData && powerBalanceData.length > 0 && !isLoadingPowerBalance && !powerBalanceError && (
            <PowerBalanceChart data={powerBalanceData} />
          )}
          {powerBalanceData && powerBalanceData.length === 0 && !isLoadingPowerBalance && !powerBalanceError && (
            <div className="text-center p-4">Not enough dialogue data to generate a power balance chart.</div>
          )}
        </div>
      )}
    </div>
  );
};