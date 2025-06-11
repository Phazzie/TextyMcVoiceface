import React, { useState, useEffect } from 'react';
import { Headphones, Sparkles, Book, Settings, FileCheck, BarChart3, Mic } from 'lucide-react';
import { SeamManager } from './services/SeamManager';
import { SystemOrchestrator } from './services/implementations/SystemOrchestrator';
import { TextAnalysisEngine } from './services/implementations/TextAnalysisEngine';
import { CharacterDetectionSystem } from './services/implementations/CharacterDetectionSystem';
import { VoiceAssignmentLogic } from './services/implementations/VoiceAssignmentLogic';
import { ElevenLabsAudioPipeline } from './services/implementations/ElevenLabsAudioPipeline';
import { AudioGenerationPipeline } from './services/implementations/AudioGenerationPipeline';
import { WritingQualityAnalyzer } from './services/implementations/WritingQualityAnalyzer';
import { AudioControlsManager } from './services/implementations/AudioControlsManager';
import { VoiceCustomizer as VoiceCustomizerService } from './services/implementations/VoiceCustomizer';
import { TextEditor } from './services/implementations/TextEditor';
import { StoryInput } from './components/StoryInput';
import { ProcessingStatus } from './components/ProcessingStatus';
import { CharacterList } from './components/CharacterList';
import { AudioPlayer } from './components/AudioPlayer';
import { ElevenLabsSetup } from './components/ElevenLabsSetup';
import { WritingQualityReport } from './components/WritingQualityReport';
import { ProgressDashboard } from './components/ProgressDashboard';
import { VoiceCustomizer } from './components/VoiceCustomizer';
import { ProcessingStatus as ProcessingStatusType, AudioOutput, Character, VoiceAssignment, WritingQualityReport as QualityReportType, VoiceProfile } from './types/contracts';

function App() {
  const [currentStage, setCurrentStage] = useState<'input' | 'processing' | 'complete'>('input');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType>({
    stage: 'analyzing',
    progress: 0,
    message: 'Ready to process'
  });
  const [audioOutput, setAudioOutput] = useState<AudioOutput | null>(null);
  const [qualityReport, setQualityReport] = useState<QualityReportType | null>(null);
  const [originalText, setOriginalText] = useState<string>('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [voiceAssignments, setVoiceAssignments] = useState<VoiceAssignment[]>([]);
  const [orchestrator, setOrchestrator] = useState<SystemOrchestrator | null>(null);
  const [showElevenLabsSetup, setShowElevenLabsSetup] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(false);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [activeView, setActiveView] = useState<'audiobook' | 'analysis' | 'progress' | 'voices'>('audiobook');

  // Initialize services
  useEffect(() => {
    const seamManager = SeamManager.getInstance();
    
    // Register core services
    seamManager.registerTextAnalysisEngine(new TextAnalysisEngine());
    seamManager.registerCharacterDetectionSystem(new CharacterDetectionSystem());
    seamManager.registerVoiceAssignmentLogic(new VoiceAssignmentLogic());
    seamManager.registerAudioControlsManager(new AudioControlsManager());
    seamManager.registerVoiceCustomizer(new VoiceCustomizerService());
    seamManager.registerWritingQualityAnalyzer(new WritingQualityAnalyzer());
    
    // Register Interactive Text Editor implementation
    seamManager.registerTextEditor(new TextEditor());
    
    // Set up ElevenLabs API key
    const apiKey = 'sk_4355ab7bfb4da5c4e57bd61adbebf9e719c25f92e32c379e';
    localStorage.setItem('elevenlabs_api_key', apiKey);
    setElevenLabsApiKey(apiKey);
    setUseElevenLabs(true);
    
    // Initialize ElevenLabs pipeline
    const elevenLabsPipeline = new ElevenLabsAudioPipeline(apiKey);
    elevenLabsPipeline.initialize().then(result => {
      if (result.success) {
        seamManager.registerAudioGenerationPipeline(elevenLabsPipeline);
        console.log('✅ ElevenLabs initialized successfully!');
      } else {
        console.error('Failed to initialize ElevenLabs:', result.error);
        // Fallback to browser speech
        seamManager.registerAudioGenerationPipeline(new AudioGenerationPipeline());
        setUseElevenLabs(false);
      }
    });
    
    const orchestratorInstance = new SystemOrchestrator();
    seamManager.registerSystemOrchestrator(orchestratorInstance);
    setOrchestrator(orchestratorInstance);
    
    console.log('✅ All seam components registered successfully');
    console.log(`📊 SeamManager fully configured: ${seamManager.isFullyConfigured()}`);
  }, []);

  // Update audio pipeline when ElevenLabs key changes
  useEffect(() => {
    if (elevenLabsApiKey && elevenLabsApiKey !== 'sk_4355ab7bfb4da5c4e57bd61adbebf9e719c25f92e32c379e') {
      const seamManager = SeamManager.getInstance();
      const elevenLabsPipeline = new ElevenLabsAudioPipeline(elevenLabsApiKey);
      
      // Initialize the pipeline
      elevenLabsPipeline.initialize().then(result => {
        if (result.success) {
          seamManager.registerAudioGenerationPipeline(elevenLabsPipeline);
          setUseElevenLabs(true);
        } else {
          console.error('Failed to initialize ElevenLabs:', result.error);
          // Fallback to browser speech
          seamManager.registerAudioGenerationPipeline(new AudioGenerationPipeline());
          setUseElevenLabs(false);
        }
      });
    }
  }, [elevenLabsApiKey]);

  // Poll processing status
  useEffect(() => {
    if (currentStage !== 'processing' || !orchestrator) return;

    const pollStatus = async () => {
      const statusResult = await orchestrator.getProcessingStatus();
      if (statusResult.success && statusResult.data) {
        setProcessingStatus(statusResult.data);
        
        if (statusResult.data.stage === 'complete') {
          setCurrentStage('complete');
        } else if (statusResult.data.stage === 'error') {
          setCurrentStage('input');
        }
      }
    };

    const interval = setInterval(pollStatus, 500);
    return () => clearInterval(interval);
  }, [currentStage, orchestrator]);

  const handleTextSubmit = async (text: string) => {
    if (!orchestrator) return;

    setOriginalText(text);
    setCurrentStage('processing');
    setProcessingStatus({
      stage: 'analyzing',
      progress: 0,
      message: 'Starting analysis...'
    });

    try {
      // Start processing audiobook
      const result = await orchestrator.processStory(text, {
        enableManualCorrection: false,
        outputFormat: 'mp3',
        includeQualityAnalysis: true
      });

      if (result.success && result.data) {
        setAudioOutput(result.data);
        
        // Extract characters and voice assignments for display
        const seamManager = SeamManager.getInstance();
        const textAnalysisEngine = seamManager.getTextAnalysisEngine();
        const characterDetectionSystem = seamManager.getCharacterDetectionSystem();
        const voiceAssignmentLogic = seamManager.getVoiceAssignmentLogic();

        // Get segments and characters
        const parseResult = await textAnalysisEngine.parseText(text);
        if (parseResult.success && parseResult.data) {
          const charactersResult = await characterDetectionSystem.detectCharacters(parseResult.data);
          if (charactersResult.success && charactersResult.data) {
            setCharacters(charactersResult.data);
            
            const voiceAssignmentsResult = await voiceAssignmentLogic.assignVoices(charactersResult.data);
            if (voiceAssignmentsResult.success && voiceAssignmentsResult.data) {
              setVoiceAssignments(voiceAssignmentsResult.data);
            }
          }
        }

        // Generate writing quality report
        const qualityAnalyzer = new WritingQualityAnalyzer();
        const qualityResult = await qualityAnalyzer.generateQualityReport(text);
        if (qualityResult.success && qualityResult.data) {
          setQualityReport(qualityResult.data);
        }
        
        setCurrentStage('complete');
      } else {
        console.error('Processing failed:', result.error);
        setCurrentStage('input');
      }
    } catch (error) {
      console.error('Processing error:', error);
      setCurrentStage('input');
    }
  };

  const handleCancelProcessing = async () => {
    if (!orchestrator) return;
    
    await orchestrator.cancelProcessing();
    setCurrentStage('input');
  };

  const handleDownload = () => {
    if (!audioOutput) return;

    const url = URL.createObjectURL(audioOutput.audioFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audiobook-${Date.now()}.${useElevenLabs ? 'mp3' : 'wav'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVoicePreview = (character: string, voice: VoiceAssignment['voice']) => {
    if (useElevenLabs) {
      // For ElevenLabs, we'd need to make an API call for preview
      console.log('ElevenLabs voice preview not implemented yet');
      return;
    }

    // Fallback to browser speech synthesis for preview
    const utterance = new SpeechSynthesisUtterance(`Hello, I am ${character}. This is how I sound.`);
    utterance.pitch = voice.pitch;
    utterance.rate = voice.speed;
    
    const voices = speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => 
      v.name.toLowerCase().includes(voice.gender) || 
      v.lang.startsWith('en')
    );
    
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    
    speechSynthesis.speak(utterance);
  };

  const handleVoiceUpdate = (character: string, profile: VoiceProfile) => {
    // Update voice assignments when a custom voice is saved
    setVoiceAssignments(prev => prev.map(va => 
      va.character === character 
        ? { ...va, voice: profile, confidence: 1.0 }
        : va
    ));
  };

  const handleStartOver = () => {
    setCurrentStage('input');
    setAudioOutput(null);
    setQualityReport(null);
    setOriginalText('');
    setCharacters([]);
    setVoiceAssignments([]);
    setActiveView('audiobook');
    setProcessingStatus({
      stage: 'analyzing',
      progress: 0,
      message: 'Ready to process'
    });
  };

  const handleSetupElevenLabs = () => {
    setShowElevenLabsSetup(true);
  };

  const handleElevenLabsApiKeySet = (apiKey: string) => {
    setElevenLabsApiKey(apiKey);
    setShowElevenLabsSetup(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Story Voice Studio</h1>
                <p className="text-sm text-gray-600">
                  Transform stories into multi-voice audiobooks & analyze writing quality
                  {useElevenLabs && (
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      ElevenLabs AI ✨
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {(currentStage === 'complete' || currentStage === 'input') && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveView('audiobook')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      activeView === 'audiobook'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Headphones className="w-4 h-4" />
                    <span>Audiobook</span>
                  </button>
                  {currentStage === 'complete' && (
                    <>
                      <button
                        onClick={() => setActiveView('analysis')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                          activeView === 'analysis'
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'text-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Analysis</span>
                      </button>
                      <button
                        onClick={() => setActiveView('voices')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                          activeView === 'voices'
                            ? 'bg-green-500 text-white shadow-md'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                        <span>Voices</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setActiveView('progress')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      activeView === 'progress'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Progress</span>
                  </button>
                </div>
              )}

              {useElevenLabs && (
                <div className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                  ✅ ElevenLabs Connected
                </div>
              )}
              
              {!useElevenLabs && (
                <button
                  onClick={handleSetupElevenLabs}
                  className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Setup ElevenLabs</span>
                </button>
              )}
              
              {currentStage === 'complete' && (
                <button
                  onClick={handleStartOver}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                >
                  Start Over
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStage === 'input' && activeView !== 'progress' && (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Sparkles className="w-8 h-8 text-yellow-500" />
                <Book className="w-8 h-8 text-blue-500" />
                <Headphones className="w-8 h-8 text-purple-500" />
                <FileCheck className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Bring Your Stories to Life & Perfect Your Craft
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our AI analyzes your narrative text, creates professional audiobooks with unique character voices,
                and provides detailed writing quality feedback including show vs tell analysis, trope detection, and prose clarity.
                {useElevenLabs && (
                  <span className="block mt-2 text-purple-600 font-semibold">
                    ✨ Powered by ElevenLabs AI for ultra-realistic voices
                  </span>
                )}
              </p>
            </div>

            <StoryInput 
              onTextSubmit={handleTextSubmit} 
              isProcessing={currentStage === 'processing'} 
            />

            {/* Features */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Book className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Analysis</h3>
                <p className="text-gray-600">Automatically detects characters, dialogue, and narrative sections</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Headphones className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {useElevenLabs ? 'AI Voices' : 'Multiple Voices'}
                </h3>
                <p className="text-gray-600">
                  {useElevenLabs 
                    ? 'Ultra-realistic AI voices with ElevenLabs technology' 
                    : 'Assigns unique, appropriate voices to each character'
                  }
                </p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Quality</h3>
                <p className="text-gray-600">Generates high-quality audio ready for sharing</p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Writing Analysis</h3>
                <p className="text-gray-600">Detailed feedback on show vs tell, tropes, and prose quality</p>
              </div>
            </div>
          </>
        )}

        {currentStage === 'processing' && (
          <ProcessingStatus 
            status={processingStatus} 
            onCancel={handleCancelProcessing}
          />
        )}

        {currentStage === 'complete' && activeView === 'audiobook' && audioOutput && (
          <>
            <AudioPlayer 
              audioOutput={audioOutput} 
              onDownload={handleDownload}
            />
            
            {characters.length > 0 && (
              <CharacterList 
                characters={characters}
                voiceAssignments={voiceAssignments}
                onVoicePreview={handleVoicePreview}
              />
            )}
          </>
        )}

        {currentStage === 'complete' && activeView === 'analysis' && qualityReport && (
          <WritingQualityReport 
            report={qualityReport}
            originalText={originalText}
          />
        )}

        {currentStage === 'complete' && activeView === 'voices' && (
          <VoiceCustomizer
            characters={characters}
            voiceAssignments={voiceAssignments}
            onVoiceUpdate={handleVoiceUpdate}
          />
        )}

        {activeView === 'progress' && (
          <ProgressDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>© 2024 Story Voice Studio. AI-powered audiobook generation and writing analysis.</p>
          </div>
        </div>
      </footer>

      {/* ElevenLabs Setup Modal */}
      <ElevenLabsSetup
        isVisible={showElevenLabsSetup}
        onClose={() => setShowElevenLabsSetup(false)}
        onApiKeySet={handleElevenLabsApiKeySet}
      />
    </div>
  );
}

export default App;