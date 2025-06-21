import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Eye, Lightbulb, Sparkles, BookOpen, Target, Palette, Zap } from 'lucide-react';
import { WritingQualityReport as QualityReportType, ShowTellIssue, TropeMatch, PurpleProseIssue, LiteraryDeviceInstance } from '../types/contracts';
import ColorPaletteDisplay from './ColorPaletteDisplay';
import LiteraryDeviceReport from './LiteraryDeviceReport';
import { SeamManager } from '../services/SeamManager';
import { AIEnhancementService } from '../services/implementations/AIEnhancementService';

interface WritingQualityReportProps {
  report: QualityReportType;
  originalText: string;
  // literaryDevices?: LiteraryDeviceInstance[]; // Optional: pass devices directly
}

// Mock data for literary devices (can be replaced with actual data fetching)
const mockLiteraryDevices: LiteraryDeviceInstance[] = [
  { deviceType: 'Metaphor', textSnippet: "Her eyes were pools of the deepest blue.", explanation: "Compares eyes to pools without using 'like' or 'as'.", position: 10 },
  { deviceType: 'Simile', textSnippet: "He runs like the wind.", explanation: "Compares running speed to wind using 'like'.", position: 50 },
  { deviceType: 'Alliteration', textSnippet: "Silly snakes slither silently.", explanation: "Repetition of the 's' sound.", position: 100 },
];

export const WritingQualityReport: React.FC<WritingQualityReportProps> = ({ report, originalText }) => {
  // Add both tabs to activeTab state type
  const [activeTab, setActiveTab] = useState<'overview' | 'show-tell' | 'tropes' | 'prose' | 'color-palette' | 'literary-devices'>('overview');
  const [literaryDevices, setLiteraryDevices] = useState<LiteraryDeviceInstance[]>(mockLiteraryDevices); // Initialize with mock
  const [isLoadingLiteraryDevices, setIsLoadingLiteraryDevices] = useState(false);

  useEffect(() => {
    const fetchDevices = async () => {
      setIsLoadingLiteraryDevices(true);
      const aiService = new AIEnhancementService();
      const result = await aiService.analyzeLiteraryDevices(originalText);
      if (result.success && result.data) {
        setLiteraryDevices(result.data);
      } else {
        console.error("Failed to fetch literary devices:", result.error);
        setLiteraryDevices(mockLiteraryDevices); // Fallback to mock on error
      }
      setIsLoadingLiteraryDevices(false);
    };
    // Uncomment to enable API call
    // if (originalText) fetchDevices();
    setLiteraryDevices(mockLiteraryDevices);
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
    return { grade: 'D', desc: 'Needs Work' };
  };

  const overallGrade = getOverallGrade();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Writing Quality Analysis</h3>
        <div className="flex items-center space-x-2">
          <div className={`px-4 py-2 rounded-full font-bold text-lg ${getScoreColor((report.overallScore.showVsTell + report.overallScore.tropeOriginality + report.overallScore.proseClarity) / 3)}`}>
            {overallGrade.grade}
          </div>
          <span className="text-gray-600 font-medium">{overallGrade.desc}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'overview', label: 'Overview', icon: BookOpen },
          { key: 'show-tell', label: 'Show vs Tell', icon: Eye },
          { key: 'tropes', label: 'Trope Analysis', icon: Target },
          { key: 'prose', label: 'Prose Quality', icon: Sparkles },
          { key: 'color-palette', label: 'Color Palette', icon: Palette },
          { key: 'literary-devices', label: 'Literary Devices', icon: Zap }
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

      {/* Render ColorPaletteDisplay when its tab is active */}
      {activeTab === 'color-palette' && (
        <ColorPaletteDisplay />
      )}
      {/* Render LiteraryDeviceReport when its tab is active */}
      {activeTab === 'literary-devices' && (
        isLoadingLiteraryDevices ? (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h4 className="text-xl font-semibold text-gray-800 mb-2">Scanning for Literary Devices...</h4>
            <p className="text-gray-600">This may take a moment.</p>
          </div>
        ) : (
          <LiteraryDeviceReport devices={literaryDevices} />
        )
      )}
    </div>
  );
};

// Existing ShowTellTab, TropeAnalysisTab, ProseQualityTab components remain unchanged
const ShowTellTab: React.FC<{ issues: ShowTellIssue[]; originalText: string }> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h4 className="text-xl font-semibold text-gray-800 mb-2">Excellent Showing!</h4>
        <p className="text-gray-600">No significant "telling" issues detected. Your writing effectively shows rather than tells.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-800">Show vs Tell Analysis</h4>
        <div className="text-sm text-gray-600">{issues.length} issues found</div>
      </div>
      
      {issues.map((issue, index) => (
        <div key={index} className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                  issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {issue.severity}
                </span>
                <span className="text-sm text-gray-600">Position: {issue.position}</span>
              </div>
              <div className="font-mono text-sm bg-white p-2 rounded border mb-2">"{issue.text}"</div>
              <div className="text-sm text-gray-700 mb-2">{issue.suggestion}</div>
              {issue.example && (
                <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                  💡 {issue.example}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const TropeAnalysisTab: React.FC<{ matches: TropeMatch[]; originalText: string }> = ({ matches }) => {
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
      
      {matches.map((match, index) => (
        <div key={index} className="border-l-4 border-purple-400 bg-purple-50 p-4 rounded-r-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h5 className="font-semibold text-gray-800">{match.name}</h5>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="capitalize">{match.category}</span>
                <span>•</span>
                <span>{Math.round(match.confidence * 100)}% confidence</span>
              </div>
            </div>
          </div>
          
          <div className="font-mono text-sm bg-white p-2 rounded border mb-3">"{match.text}"</div>
          
          <div>
            <h6 className="font-medium text-gray-800 mb-2">💡 Subversion Ideas:</h6>
            <ul className="space-y-1 text-sm text-gray-700">
              {match.subversionSuggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

const ProseQualityTab: React.FC<{ issues: PurpleProseIssue[]; originalText: string }> = ({ issues }) => {
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