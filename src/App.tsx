import React, { useState, useEffect } from 'react';
import { Headphones, Sparkles, Book, Settings, FileCheck, BarChart3, Mic, FolderOpen, Database, Shield, LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';
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
import { AIEnhancementService } from './services/implementations/AIEnhancementService'; // Added import
import { ProjectManager as ProjectManagerService } from './services/implementations/ProjectManager';
import { supabaseService } from './services/implementations/SupabaseService';
import { secureConfig } from './services/implementations/SecureConfigManager';
import { AuthPage } from './components/AuthPage'; // Added AuthPage import
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
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationsContainer from './components/NotificationsContainer';
import { useNotifier } from './hooks/useNotifier';

function App() {
  const { addNotification } = useNotifier();
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
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState<string>('Initializing...');
  const [authUser, setAuthUser] = useState<User | null>(null); // Added authUser state
  const [authLoading, setAuthLoading] = useState(true); // Added authLoading state
  const [unreliableNarratorActive, setUnreliableNarratorActive] = useState(false); // New state for Unreliable Narrator Mode

  // Initialize services and auth
  useEffect(() => {
    // Initialize core app services
    initializeApp();

    // Initialize and manage auth state
    setAuthLoading(true);
    supabaseService.waitForInitialization().then(() => {
      setAuthUser(supabaseService.getCurrentUser());
      setAuthLoading(false);

      const { data: authListener } = supabaseService.supabase.auth.onAuthStateChange(
        (event, session) => {
          setAuthUser(session?.user ?? null);
          if (event === 'SIGNED_OUT') {
            handleStartOver(); // Reset app state on sign out
          }
          // Potentially handle SIGNED_IN for data refresh if needed in future
          // e.g., if (event === 'SIGNED_IN') { loadUserProjects(); }
        }
      );

      return () => {
        // Cleanup listener on component unmount
        authListener?.subscription.unsubscribe();
      };
    });
  }, []); // Empty dependency array means it runs once on mount

  const initializeApp = async () => {
    try {
      setInitializationStatus('Setting up secure configuration...');
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
      seamManager.registerAIEnhancementService(new AIEnhancementService()); // Added registration
      
      setInitializationStatus('Testing Supabase connection...');
      
      // Test Supabase connection
      const connectionTest = await supabaseService.testConnection();
      if (connectionTest.success) {
        setSupabaseConnected(true);
        setInitializationStatus('✅ Supabase connected successfully!');
      } else {
        console.warn('Supabase connection failed:', connectionTest.error);
         addNotification(`Supabase connection failed: ${connectionTest.error}. Some cloud features may be unavailable.`, 'error');
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
       addNotification(`App initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}. Some features may not work correctly.`, 'error');
      setInitializationStatus('❌ Initialization failed - some features may not work');
    }
  };

  const handleAuthSuccess = (user: User) => {
    setAuthUser(user);
    // After successful login, could trigger loading user-specific data if needed
    // e.g., loadUserProjects();
  };

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
         addNotification(`Failed to initialize ElevenLabs AI voices: ${initResult.error}. Falling back to standard voices.`, 'warning');
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

    const seamManager = SeamManager.getInstance(); // Get SeamManager instance

    try {
      // This is a simplified representation. In a full implementation,
      // `processStory` would internally handle iterating through segments,
      // calling `analyzeSubtext` if the mode is active, and then
      // calling `generateSegmentAudio` with the performanceNote.
      // For this example, I'm showing the conceptual logic placement.
      // The actual modification might need to be deeper in the SystemOrchestrator
      // or how it calls the AudioGenerationPipeline.

      // If SystemOrchestrator's processStory is granular enough to take segment-specific notes,
      // we would prepare them here. Otherwise, we might pass unreliableNarratorActive
      // as an option to processStory.

      // For demonstration, let's assume processStory is modified or a new method is used.
      // The current `orchestrator.processStory` doesn't support passing performance notes per segment.
      // This highlights a potential need to refactor `SystemOrchestrator` or how it uses `IAudioGenerationPipeline`.

      // Placeholder: If orchestrator.processStory could take a callback for notes:
      /*
      const getPerformanceNoteForSegment = async (segment: TextSegment) => {
        if (unreliableNarratorActive) {
          const aiService = seamManager.getAIEnhancementService();
          const subtextResult = await aiService.analyzeSubtext(segment.content, originalText);
          if (subtextResult.success && subtextResult.data) {
            return subtextResult.data;
          }
        }
        return undefined;
      };
      */

      // As `SystemOrchestrator.processStory` is a black box for now,
      // and doesn't accept per-segment performance notes, we'll pass a general option.
      // This implies `SystemOrchestrator` itself would need to be aware of this mode
      // and call `AIEnhancementService.analyzeSubtext` internally before generating each segment.
      // This is the most realistic approach given the current `ISystemOrchestrator` contract.

      const processingOptions = {
        enableManualCorrection: false,
        outputFormat: 'mp3' as 'mp3' | 'wav',
        includeQualityAnalysis: true,
        // Add a new option to ProcessingOptions if SystemOrchestrator will handle subtext analysis:
        unreliableNarratorMode: unreliableNarratorActive,
        fullTextContext: unreliableNarratorActive ? text : undefined // Pass full text if mode is active
      };

      // The SystemOrchestrator would then need to be updated:
      // 1. Accept `unreliableNarratorMode` and `fullTextContext` in its `ProcessingOptions`.
      // 2. If `unreliableNarratorMode` is true, before calling `audioPipeline.generateSegmentAudio` for each segment,
      //    it would call `aiEnhancementService.analyzeSubtext(segment.content, fullTextContext)`.
      // 3. It would then pass the result as `performanceNote` to `audioPipeline.generateSegmentAudio`.

      // For now, we call it as is, and the `performanceNote` logic will not be hit in `ElevenLabsAudioPipeline`
      // unless `SystemOrchestrator` is internally changed.
      // This is a limitation of not being able to modify SystemOrchestrator in this step.
      // However, the plan focuses on App.tsx orchestration.

      // const result = await orchestrator.processStory(text, processingOptions);

      // New logic for App.tsx orchestration if unreliableNarratorActive
      if (unreliableNarratorActive) {
        setProcessingStatus({ stage: 'analyzing', progress: 10, message: 'Parsing text for Unreliable Narrator mode...' });
        const textAnalysisEngine = seamManager.getTextAnalysisEngine();
        const parseResult = await textAnalysisEngine.parseText(text);

        if (!parseResult.success || !parseResult.data) {
          throw new Error(`Text parsing failed: ${parseResult.error || 'Unknown error'}`);
        }
        const textSegments = parseResult.data;

        setProcessingStatus({ stage: 'detecting', progress: 20, message: 'Detecting characters...' });
        const characterDetectionSystem = seamManager.getCharacterDetectionSystem();
        const charactersResult = await characterDetectionSystem.detectCharacters(textSegments);
        if (charactersResult.success && charactersResult.data) {
          setCharacters(charactersResult.data);
          const voiceAssignmentLogic = seamManager.getVoiceAssignmentLogic();
          const voiceAssignmentsResult = await voiceAssignmentLogic.assignVoices(charactersResult.data);
          if (voiceAssignmentsResult.success && voiceAssignmentsResult.data) {
            setVoiceAssignments(voiceAssignmentsResult.data);
          }
        } else {
          addNotification('Character detection failed. Proceeding without specific voice assignments.', 'warning');
          setCharacters([]);
          setVoiceAssignments([]);
        }

        const audioPipeline = seamManager.getAudioGenerationPipeline();
        const aiEnhancementService = seamManager.getAIEnhancementService();
        const generatedAudioSegments: AudioSegment[] = [];

        for (let i = 0; i < textSegments.length; i++) {
          const segment = textSegments[i];
          const progress = 30 + Math.round((i / textSegments.length) * 50);
          setProcessingStatus({ stage: 'generating', progress, message: `Analyzing subtext for segment ${i + 1}/${textSegments.length}...` });

          let performanceNote: string | undefined = undefined;
          const subtextResult = await aiEnhancementService.analyzeSubtext(segment.content, text);
          if (subtextResult.success && subtextResult.data) {
            performanceNote = subtextResult.data;
            addNotification(`Subtext for segment ${i+1}: ${performanceNote}`, 'info', 2000);
          } else {
            addNotification(`Subtext analysis failed for segment ${i+1}: ${subtextResult.error}`, 'warning', 2000);
          }

          setProcessingStatus({ stage: 'generating', progress, message: `Generating audio for segment ${i + 1}/${textSegments.length} (Note: ${performanceNote || 'N/A'})...` });

          // Find voice for speaker - simplified, assumes 'Narrator' or first character if no specific assignment
          let voiceProfile = voiceAssignments.find(va => va.character === segment.speaker)?.voice;
          if (!voiceProfile) { // Fallback voice
            voiceProfile = { id: 'default-narrator', name: 'Default Narrator', gender: 'neutral', age: 'adult', tone: 'neutral', pitch: 1.0, speed: 1.0 };
          }

          const audioSegmentResult = await audioPipeline.generateSegmentAudio(segment, voiceProfile, performanceNote);

          if (audioSegmentResult.success && audioSegmentResult.data) {
            generatedAudioSegments.push(audioSegmentResult.data);
          } else {
            throw new Error(`Audio generation failed for segment ${segment.id}: ${audioSegmentResult.error || 'Unknown error'}`);
          }
        }

        setProcessingStatus({ stage: 'generating', progress: 80, message: 'Combining audio segments...' });
        const combinedAudioResult = await audioPipeline.combineAudioSegments(generatedAudioSegments);

        if (combinedAudioResult.success && combinedAudioResult.data) {
          setAudioOutput(combinedAudioResult.data);
        } else {
          throw new Error(`Failed to combine audio segments: ${combinedAudioResult.error || 'Unknown error'}`);
        }

      } else {
        // Original path using SystemOrchestrator
        const result = await orchestrator.processStory(text, processingOptions);
        if (result.success && result.data) {
          setAudioOutput(result.data);
        } else {
          throw new Error(`Processing failed: ${result.error || 'Unknown error'}`);
        }
      }

      // Common post-processing (character detection, quality report)
      // This part might be redundant if already handled in the new path, or needs adjustment
      const textAnalysisEngine = seamManager.getTextAnalysisEngine();
      const characterDetectionSystem = seamManager.getCharacterDetectionSystem();
      const voiceAssignmentLogic = seamManager.getVoiceAssignmentLogic();

      const parseResult = await textAnalysisEngine.parseText(text);
      if (parseResult.success && parseResult.data && characters.length === 0) { // Only if not set by new path
        const charResult = await characterDetectionSystem.detectCharacters(parseResult.data);
        if (charResult.success && charResult.data) {
          setCharacters(charResult.data);
          const vaResult = await voiceAssignmentLogic.assignVoices(charResult.data);
          if (vaResult.success && vaResult.data) {
            setVoiceAssignments(vaResult.data);
          }
        }
      }

      setProcessingStatus({ stage: 'quality_check', progress: 90, message: 'Generating quality report...' });
      const qualityAnalyzer = new WritingQualityAnalyzer();
      const qualityResult = await qualityAnalyzer.generateQualityReport(text);
      if (qualityResult.success && qualityResult.data) {
        setQualityReport(qualityResult.data);
      }

      setCurrentStage('complete');
      setProcessingStatus({ stage: 'complete', progress: 100, message: 'Processing complete!' });

    } catch (error) {
      console.error('Processing error:', error);
      addNotification(`An unexpected error occurred during processing: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`, 'error');
      setCurrentStage('input');
      setProcessingStatus({ stage: 'error', progress: 0, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
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
           addNotification(`Cloud save failed: ${result.error || 'Unknown reason'}. Attempting local save.`, 'warning');
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
         addNotification(`Local save failed: ${result.error || 'Unknown error'}. Please try again.`, 'error');
      }
    } catch (error) {
      console.error('Error saving project:', error);
       addNotification(`An unexpected error occurred while saving the project: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`, 'error');
    }
  };

  const handleToggleUnreliableNarratorMode = () => {
    setUnreliableNarratorActive(prev => !prev);
    addNotification(`Unreliable Narrator Mode ${!unreliableNarratorActive ? 'enabled' : 'disabled'}.`, 'info');
  };

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Initialization Status */}
        {initializationStatus && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">{initializationStatus}</span>
          </div>
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
              <button
                onClick={() => setShowProjectManager(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Projects</span>
              </button>

              {/* Logout Button */}
              {authUser && supabaseConnected && (
                <button
                  onClick={async () => {
                    const { error } = await supabaseService.signOut();
                    if (error) {
                      console.error("Error signing out:", error);
                      // Optionally show an error message to the user
                    }
                    // onAuthStateChange listener in useEffect will handle setAuthUser(null) and handleStartOver()
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout ({authUser.email?.substring(0, authUser.email.indexOf('@'))})</span>
                </button>
              )}

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
            {supabaseConnected && authUser && (
              <p className="text-sm mt-2 text-green-600">
                <Database className="w-4 h-4 inline mr-1" />
                Logged in as: {authUser.email} (Cloud Active)
              </p>
            )}
            {supabaseConnected && !authUser && (
              <p className="text-sm mt-2 text-yellow-600">
                <Database className="w-4 h-4 inline mr-1" />
                Cloud available. Please login to save projects to the cloud.
              </p>
            )}
            {!supabaseConnected && (
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
      <NotificationsContainer />
    </div>
    </NotificationProvider>
  );
}

export default App;