import React, { useState, useEffect } from 'react';
import { Headphones, Sparkles, Book, Settings, FileCheck, BarChart3, Mic, FolderOpen, Database, Shield, LogOut } from 'lucide-react';
// User type might still be needed if we pass user object around, but useAuth provides it.
// import { User } from '@supabase/supabase-js';
import { useAuth } from './contexts/AuthContext'; // Import useAuth
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
import { ProjectManager as ProjectManagerService } from './services/implementations/ProjectManager';
// supabaseService direct import might still be needed for non-auth specific calls, if any.
// For auth, useAuth will be the primary interface.
import { supabaseService } from './services/implementations/SupabaseService';
import { secureConfig } from './services/implementations/SecureConfigManager';
// AuthPage import should be from the new location if it was different, but it seems correct.
import AuthPage from './components/auth/AuthPage'; // Corrected path based on earlier step
import UserProfileButton from './components/auth/UserProfileButton'; // Import UserProfileButton
import { StoryInput } from './components/StoryInput';
import { ProcessingStatus } from './components/ProcessingStatus';
import { CharacterList } from './components/CharacterList';
import { AudioPlayer } from './components/AudioPlayer';
import { ElevenLabsSetup } from './components/ElevenLabsSetup';
import { WritingQualityReport } from './components/WritingQualityReport';
import { ProgressDashboard } from './components/ProgressDashboard';
import { VoiceCustomizer } from './components/VoiceCustomizer';
import { ProjectManager } from './components/ProjectManager';
import { ProcessingStatus as ProcessingStatusType, AudioOutput, Character, VoiceAssignment, WritingQualityReport as QualityReportType, VoiceProfile, StoryProject } from './types/contracts';

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
  const [activeView, setActiveView] = useState<'audiobook' | 'analysis' | 'progress' | 'voices'>('audiobook');
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [currentProject, setCurrentProject] = useState<StoryProject | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false); // This can remain for non-auth Supabase features
  const [initializationStatus, setInitializationStatus] = useState<string>('Initializing...');

  const { user, session, isLoading: authIsLoading, error: authError, signOut } = useAuth(); // Use useAuth hook

  // Initialize non-auth services
  useEffect(() => {
    initializeApp();
  }, []);

  // Effect to handle user state changes (e.g., on sign-out)
  useEffect(() => {
    if (!authIsLoading && !user) {
      // User signed out or session expired
      handleStartOver(); // Reset app state
    }
    // Potentially load user-specific data when user object changes and is present
    // if (user) { loadUserProjects(); }
  }, [user, authIsLoading]);

  const initializeApp = async () => {
    try {
      setInitializationStatus('Setting up core services...');
      const seamManager = SeamManager.getInstance();
      // Register core services
      seamManager.registerTextAnalysisEngine(new TextAnalysisEngine());
      seamManager.registerCharacterDetectionSystem(new CharacterDetectionSystem());
      seamManager.registerVoiceAssignmentLogic(new VoiceAssignmentLogic());
      seamManager.registerAudioControlsManager(new AudioControlsManager());
      seamManager.registerVoiceCustomizer(new VoiceCustomizerService());
      seamManager.registerWritingQualityAnalyzer(new WritingQualityAnalyzer());
      seamManager.registerTextEditor(new TextEditor());
      seamManager.registerProjectManager(new ProjectManagerService());
      
      setInitializationStatus('Testing Supabase connection...');
      
      // Test Supabase connection
      const connectionTest = await supabaseService.testConnection();
      if (connectionTest.success) {
        setSupabaseConnected(true);
        setInitializationStatus('✅ Supabase connected successfully!');
      } else {
        console.warn('Supabase connection failed:', connectionTest.error);
        setInitializationStatus('⚠️ Using local storage (Supabase unavailable)');
      }
      
      // Check for ElevenLabs API key
      const elevenLabsKey = await secureConfig.getElevenLabsApiKey();
      if (elevenLabsKey.success && elevenLabsKey.data) {
        setInitializationStatus('Setting up ElevenLabs integration...');
        await setupElevenLabs(elevenLabsKey.data);
      } else {
        // Fallback to browser speech
        seamManager.registerAudioGenerationPipeline(new AudioGenerationPipeline());
        setUseElevenLabs(false);
      }
      
      const orchestratorInstance = new SystemOrchestrator();
      seamManager.registerSystemOrchestrator(orchestratorInstance);
      setOrchestrator(orchestratorInstance);
      
      setInitializationStatus('✅ Story Voice Studio core ready!');
      
      // Short delay before clearing status, allowing auth messages to also appear if quick
      setTimeout(() => {
        if (initializationStatus.includes('ready!')) { // Only clear if it's a success message
          setInitializationStatus('');
        }
      }, 3000);
      
      console.log('✅ All seam components registered successfully');
      console.log(`📊 SeamManager fully configured: ${seamManager.isFullyConfigured()}`);
      
    } catch (error) {
      console.error('App initialization failed:', error);
      setInitializationStatus('❌ Core initialization failed - some features may not work');
    }
  };

  // handleAuthSuccess is no longer needed as AuthProvider manages this.

  const setupElevenLabs = async (apiKey: string) => {
    try {
      const seamManager = SeamManager.getInstance();
      const elevenLabsPipeline = new ElevenLabsAudioPipeline(apiKey);
      
      const initResult = await elevenLabsPipeline.initialize();
      if (initResult.success) {
        seamManager.registerAudioGenerationPipeline(elevenLabsPipeline);
        setUseElevenLabs(true);
        console.log('✅ ElevenLabs initialized successfully!');
      } else {
        console.error('Failed to initialize ElevenLabs:', initResult.error);
        // Fallback to browser speech
        seamManager.registerAudioGenerationPipeline(new AudioGenerationPipeline());
        setUseElevenLabs(false);
      }
    } catch (error) {
      console.error('ElevenLabs setup failed:', error);
      const seamManager = SeamManager.getInstance();
      seamManager.registerAudioGenerationPipeline(new AudioGenerationPipeline());
      setUseElevenLabs(false);
    }
  };

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
    setCurrentProject(null);
    setProcessingStatus({
      stage: 'analyzing',
      progress: 0,
      message: 'Ready to process'
    });
  };

  const handleSetupElevenLabs = () => {
    setShowElevenLabsSetup(true);
  };

  const handleElevenLabsApiKeySet = async (apiKey: string) => {
    // Save API key securely
    await secureConfig.setElevenLabsApiKey(apiKey);
    
    // Setup ElevenLabs with new key
    await setupElevenLabs(apiKey);
    
    setShowElevenLabsSetup(false);
  };

  const handleProjectSelect = async (project: StoryProject) => {
    setCurrentProject(project);
    setOriginalText(project.originalText);
    setCharacters(project.characters);
    setVoiceAssignments(project.voiceAssignments);
    setQualityReport(project.qualityReport || null);
    setAudioOutput(project.audioOutput || null);
    
    if (project.audioOutput) {
      setCurrentStage('complete');
    } else {
      setCurrentStage('input');
    }
  };

  const handleNewProject = () => {
    handleStartOver();
    setShowProjectManager(false);
  };

  const handleSaveProject = async (project: StoryProject) => {
    try {
      // Update project with current state
      const updatedProject: StoryProject = {
        ...project,
        originalText,
        characters,
        voiceAssignments,
        qualityReport: qualityReport || undefined,
        audioOutput: audioOutput || undefined,
        metadata: {
          ...project.metadata,
          modifiedAt: Date.now(),
          wordCount: originalText.trim().split(/\s+/).length,
          characterCount: originalText.length,
          completionStatus: audioOutput ? 'complete' : 'draft'
        }
      };

      // Try Supabase first, fallback to ProjectManager
      if (supabaseConnected) {
        const result = await supabaseService.saveProject(updatedProject);
        if (result.success) {
          setCurrentProject(updatedProject);
          console.log('Project saved to Supabase successfully');
          return;
        } else {
          console.warn('Supabase save failed, falling back to local storage:', result.error);
        }
      }

      // Fallback to local ProjectManager
      const seamManager = SeamManager.getInstance();
      const projectManager = seamManager.getProjectManager();
      const result = await projectManager.saveProject(updatedProject);
      
      if (result.success) {
        setCurrentProject(updatedProject);
        console.log('Project saved locally successfully');
      } else {
        console.error('Failed to save project:', result.error);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  // Conditional Rendering for Auth using useAuth hook
  if (authIsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }} className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Authenticating...</h2>
        {/* Display non-auth init status if it's still relevant */}
        {initializationStatus && !initializationStatus.includes('ready!') && <p className="text-sm text-gray-500 mt-2">{initializationStatus}</p>}
      </div>
    );
  }

  // If not loading and no user, show AuthPage
  // AuthPage no longer needs onAuthSuccess prop
  if (!user) {
    return <AuthPage />;
  }

  // User is authenticated, render the main application
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Initialization Status for non-auth related items */}
      {initializationStatus && !initializationStatus.includes('ready!') && !initializationStatus.includes('Supabase connected') && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">{initializationStatus}</span>
          </div>
        </div>
      )}
       {authError && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 text-red-700 shadow-lg rounded-lg p-4 border-l-4 border-red-500">
          Auth Error: {authError}
        </div>
      )}

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
                  {supabaseConnected && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      <Database className="w-3 h-3 inline mr-1" />
                      Cloud Connected
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Project Management Button */}
              {user && ( // Show only if user is logged in
                <button
                  onClick={() => setShowProjectManager(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Projects</span>
                </button>
              )}

              {/* User Profile/Logout Button */}
              {user && <UserProfileButton />}

              {/* View navigation buttons - show if user is logged in */}
              {user && (currentStage === 'complete' || currentStage === 'input') && (
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

              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {supabaseConnected && (
                  <div className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium flex items-center space-x-1">
                    <Database className="w-3 h-3" />
                    <span>Cloud DB</span>
                  </div>
                )}
                
                {useElevenLabs ? (
                  <div className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>ElevenLabs</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSetupElevenLabs}
                    className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Setup AI Voices</span>
                  </button>
                )}
              </div>
              
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
                {supabaseConnected && (
                  <span className="block mt-2 text-green-600 font-semibold">
                    ☁️ Your projects are automatically saved to the cloud
                  </span>
                )}
              </p>
              {currentProject && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl inline-block">
                  <p className="text-blue-800 font-medium">
                    📁 Current Project: {currentProject.name}
                  </p>
                  <p className="text-blue-600 text-sm">
                    {currentProject.metadata.wordCount.toLocaleString()} words • Modified {new Date(currentProject.metadata.modifiedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <StoryInput 
              onTextSubmit={handleTextSubmit} 
              isProcessing={currentStage === 'processing'}
              initialText={originalText}
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
            <p>© 2024 Story Voice Studio. AI-powered audiobook generation with secure cloud storage.</p>
            {supabaseConnected && user && ( // Check user from useAuth
              <p className="text-sm mt-2 text-green-600">
                <Database className="w-4 h-4 inline mr-1" />
                Logged in as: {user.email} (Cloud Active)
              </p>
            )}
            {supabaseConnected && !user && ( // Check user from useAuth
              <p className="text-sm mt-2 text-yellow-600">
                <Database className="w-4 h-4 inline mr-1" />
                Cloud available. Please login to save projects to the cloud.
              </p>
            )}
            {!supabaseConnected && ( // This part remains the same
              <p className="text-sm mt-2 text-gray-500">
                Local mode. Cloud features disabled.
              </p>
            )}
          </div>
        </div>
      </footer>

      {/* Project Manager Modal */}
      <ProjectManager
        currentProject={currentProject}
        onProjectSelect={handleProjectSelect}
        onNewProject={handleNewProject}
        onSaveProject={currentProject ? handleSaveProject : undefined}
        isVisible={showProjectManager}
        onClose={() => setShowProjectManager(false)}
      />

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