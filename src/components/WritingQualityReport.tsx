import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Eye, Lightbulb, Sparkles, BookOpen, Target, Palette, Zap, LineChart as ReadabilityIcon, TrendingUp, RefreshCw, Wand2 } from 'lucide-react';
import {
    WritingQualityReport as QualityReportType,
    ShowTellIssue,
    TropeMatch,
    PurpleProseIssue,
    ReadabilityPoint,
    DialogueTurn,
    IWritingQualityAnalyzer,
    IAIEnhancementService,
    LiteraryDeviceInstance,
    ColorPaletteAnalysis
} from '../types/contracts';
import { ColorPaletteReport } from './reports/ColorPaletteReport';
import { LiteraryDevicesReport } from './reports/LiteraryDevicesReport';
import { ReadabilityReport } from './reports/ReadabilityReport';
import { ReadabilityChart } from './ReadabilityChart';
import { PowerBalanceChart } from './reports/PowerBalanceChart';
import { SeamManager } from '../services/SeamManager';
import { WritingQualityAnalyzer } from '../services/implementations/WritingQualityAnalyzer';
import { useNotifier } from '../hooks/useNotifier';

interface WritingQualityReportProps {
  report: QualityReportType;
  originalText: string;
  analyzer?: IWritingQualityAnalyzer;
}

export const WritingQualityReport: React.FC<WritingQualityReportProps> = ({ report, originalText, analyzer: initialAnalyzer }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'show-tell' | 'tropes' | 'prose' | 'color-palette' | 'literary-devices' | 'readability' | 'power-balance'>('overview');

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
  
  // State for Color Palette
  const [colorPalette, setColorPalette] = useState<ColorPaletteAnalysis | null>(null);
  const [isColorPaletteLoading, setIsColorPaletteLoading] = useState(false);
  const [colorPaletteError, setColorPaletteError] = useState<string | null>(null);

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto my-8">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'overview', label: 'Overview', icon: BookOpen },
          { key: 'show-tell', label: 'Show vs Tell', icon: Eye },
          { key: 'tropes', label: 'Trope Analysis', icon: Target },
          { key: 'prose', label: 'Prose Quality', icon: Sparkles },
          { key: 'color-palette', label: 'Color Palette', icon: Palette },
          { key: 'literary-devices', label: 'Literary Devices', icon: Zap },
          { key: 'readability', label: 'Readability', icon: ReadabilityIcon },
          { key: 'power-balance', label: 'Power Balance', icon: TrendingUp }
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
      {activeTab === 'overview' && renderOverview()}

      {activeTab === 'show-tell' && (
        <ShowTellTab issues={report.showTellIssues} />
      )}

      {activeTab === 'tropes' && (
        <TropeAnalysisTab matches={report.tropeMatches} originalText={originalText} />
      )}

      {activeTab === 'prose' && (
        <ProseQualityTab issues={report.purpleProseIssues} />
      )}
      
      {activeTab === 'color-palette' && <ColorPaletteReport analysis={colorPalette} isLoading={isColorPaletteLoading} error={colorPaletteError} />}
      
      {activeTab === 'literary-devices' && <LiteraryDevicesReport devices={literaryDevices} isLoading={isLiteraryDevicesLoading} error={literaryDevicesError} />}

      {activeTab === 'readability' && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Readability Rollercoaster (Flesch-Kincaid)</h4>
          {isReadabilityLoading && <div className="text-center p-4">Loading readability chart...</div>}
          {readabilityError && <div className="text-center p-4 text-red-600">Error: {readabilityError}</div>}
          {readabilityData && readabilityData.length > 0 && !isReadabilityLoading && !readabilityError && (
            <ReadabilityChart data={readabilityData} />
          )}
          {readabilityData && readabilityData.length === 0 && !isReadabilityLoading && !readabilityError && (
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

const ShowTellTab: React.FC<{ issues: ShowTellIssue[] }> = ({ issues }) => (
    <div>
      <h3 className="text-xl font-bold mb-4">Show vs. Tell Analysis</h3>
      {issues.length === 0 ? (
        <div className="text-center p-6 bg-green-50 text-green-800 rounded-lg">
          <p className="font-semibold">No significant "telling" statements found. Great job showing the story!</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {issues.map((issue, index) => (
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

interface TropeInteractionState {
  [tropeNameAndPosition: string]: {
    suggestion?: string;
    isLoading: boolean;
    error?: string;
  };
}

const TropeAnalysisTab: React.FC<{ matches: TropeMatch[]; originalText: string }> = ({ matches, originalText }) => {
  const [aiEnhancementService, setAiEnhancementService] = useState<IAIEnhancementService | undefined>(undefined);
  const [tropeSuggestions, setTropeSuggestions] = useState<TropeInteractionState>({});
  const { addNotification } = useNotifier();

  useEffect(() => {
    const service = SeamManager.getInstance().getAIEnhancementService();
    setAiEnhancementService(service);
  }, []);

  const handleInvertTrope = async (trope: TropeMatch) => {
    if (!aiEnhancementService) {
      addNotification('AI Enhancement Service is not available. Cannot invert trope.', 'error');
      return;
    }

    const tropeKey = `${trope.name}-${trope.position}`;
    setTropeSuggestions(prev => ({
      ...prev,
      [tropeKey]: { isLoading: true, error: undefined, suggestion: undefined }
    }));

    try {
      const result = await aiEnhancementService.invertTrope(originalText, trope);
      if (result.success && result.data) {
        setTropeSuggestions(prev => ({
          ...prev,
          [tropeKey]: { isLoading: false, suggestion: result.data }
        }));
        addNotification(`New subversion idea generated for "${trope.name}"!`, 'success');
      } else {
        setTropeSuggestions(prev => ({
          ...prev,
          [tropeKey]: { isLoading: false, error: result.error || 'Failed to get suggestion.' }
        }));
        addNotification(`Could not generate subversion for "${trope.name}": ${result.error}`, 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setTropeSuggestions(prev => ({
        ...prev,
        [tropeKey]: { isLoading: false, error: errorMessage }
      }));
      addNotification(`Error inverting trope: ${errorMessage}`, 'error');
    }
  };

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h4 className="text-xl font-semibold text-gray-800 mb-2">Highly Original!</h4>
        <p className="text-gray-600">No common tropes detected. Your story shows great originality.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-800">Trope Detection & Subversion Ideas</h4>
        <div className="text-sm text-gray-600">{matches.length} tropes found</div>
      </div>
      
      {matches.map((match) => {
        const tropeKey = `${match.name}-${match.position}`;
        const currentSuggestionState = tropeSuggestions[tropeKey];

        return (
          <div key={tropeKey} className="border-l-4 border-purple-400 bg-purple-50 p-4 rounded-r-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h5 className="font-semibold text-gray-800">{match.name}</h5>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="capitalize">{match.category}</span>
                  <span>•</span>
                  <span>{Math.round(match.confidence * 100)}% confidence</span>
                </div>
              </div>
              <button
                onClick={() => handleInvertTrope(match)}
                disabled={!aiEnhancementService || currentSuggestionState?.isLoading}
                className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-200 rounded-md hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {currentSuggestionState?.isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>{currentSuggestionState?.isLoading ? 'Working...' : 'Invert Trope'}</span>
              </button>
            </div>

            <div className="font-mono text-sm bg-white p-2 rounded border mb-3">"{match.text}"</div>

            {currentSuggestionState?.suggestion && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h6 className="font-medium text-sm text-green-800 mb-1 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2 text-green-600" />
                  AI Subversion Idea:
                </h6>
                <p className="text-sm text-green-700">{currentSuggestionState.suggestion}</p>
              </div>
            )}

            {currentSuggestionState?.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <h6 className="font-medium text-sm text-red-800 mb-1 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                  Error:
                </h6>
                <p className="text-sm text-red-700">{currentSuggestionState.error}</p>
              </div>
            )}

            {!currentSuggestionState?.suggestion && !currentSuggestionState?.error && (
                 <div>
                    <h6 className="font-medium text-gray-800 mb-2 text-sm">💡 Original Subversion Ideas:</h6>
                    {match.subversionSuggestions && match.subversionSuggestions.length > 0 ? (
                        <ul className="space-y-1 text-sm text-gray-700">
                        {match.subversionSuggestions.map((suggestion, i) => (
                            <li key={i} className="flex items-start space-x-2">
                            <span className="text-purple-500 mt-1">•</span>
                            <span>{suggestion}</span>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No pre-defined subversion ideas for this trope.</p>
                    )}
                 </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ProseQualityTab: React.FC<{ issues: PurpleProseIssue[] }> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h4 className="text-xl font-semibold text-gray-800 mb-2">Crystal Clear Prose!</h4>
        <p className="text-gray-600">Your writing style is clear and effective. No purple prose issues detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-800">Prose Clarity Analysis</h4>
        <div className="text-sm text-gray-600">{issues.length} style issues found</div>
      </div>
      
      {issues.map((issue, index) => (
        <div key={index} className="border-l-4 border-indigo-400 bg-indigo-50 p-4 rounded-r-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                issue.severity === 'severe' ? 'bg-red-100 text-red-700' :
                issue.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {issue.severity}
              </span>
              <span className="text-sm text-gray-600 capitalize">{issue.type.replace('_', ' ')}</span>
            </div>
          </div>
          
          <div className="font-mono text-sm bg-white p-2 rounded border mb-3">"{issue.text}"</div>
          
          <div className="text-sm text-gray-700 mb-2">{issue.suggestion}</div>
          
          <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
            💡 Simplified: {issue.simplifiedVersion}
          </div>
        </div>
      ))}
    </div>
  );
};