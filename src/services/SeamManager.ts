import { 
  ITextAnalysisEngine, 
  ICharacterDetectionSystem, 
  IVoiceAssignmentLogic, 
  IAudioGenerationPipeline, 
  ISystemOrchestrator,
  IWritingQualityAnalyzer,
  IAudioControlsManager,
  IVoiceCustomizer,
  ITextEditor,
  IProjectManager,
  IAIEnhancementService // Added IAIEnhancementService
} from '../types/contracts';

// Seam Manager for coordinating component communication
export class SeamManager {
  private static instance: SeamManager;
  
  private textAnalysisEngine?: ITextAnalysisEngine;
  private characterDetectionSystem?: ICharacterDetectionSystem;
  private voiceAssignmentLogic?: IVoiceAssignmentLogic;
  private audioGenerationPipeline?: IAudioGenerationPipeline;
  private systemOrchestrator?: ISystemOrchestrator;
  private writingQualityAnalyzer?: IWritingQualityAnalyzer;
  private audioControlsManager?: IAudioControlsManager;
  private voiceCustomizer?: IVoiceCustomizer;
  private textEditor?: ITextEditor;
  private projectManager?: IProjectManager;
  private aiEnhancementService?: IAIEnhancementService; // Added aiEnhancementService

  private constructor() {}

  static getInstance(): SeamManager {
    if (!SeamManager.instance) {
      SeamManager.instance = new SeamManager();
    }
    return SeamManager.instance;
  }

  // Component registration
  registerTextAnalysisEngine(engine: ITextAnalysisEngine): void {
    this.textAnalysisEngine = engine;
  }

  registerCharacterDetectionSystem(system: ICharacterDetectionSystem): void {
    this.characterDetectionSystem = system;
  }

  registerVoiceAssignmentLogic(logic: IVoiceAssignmentLogic): void {
    this.voiceAssignmentLogic = logic;
  }

  registerAudioGenerationPipeline(pipeline: IAudioGenerationPipeline): void {
    this.audioGenerationPipeline = pipeline;
  }

  registerSystemOrchestrator(orchestrator: ISystemOrchestrator): void {
    this.systemOrchestrator = orchestrator;
  }

  registerWritingQualityAnalyzer(analyzer: IWritingQualityAnalyzer): void {
    this.writingQualityAnalyzer = analyzer;
  }

  registerAudioControlsManager(manager: IAudioControlsManager): void {
    this.audioControlsManager = manager;
  }

  registerVoiceCustomizer(customizer: IVoiceCustomizer): void {
    this.voiceCustomizer = customizer;
  }

  registerTextEditor(editor: ITextEditor): void {
    this.textEditor = editor;
  }

  registerProjectManager(manager: IProjectManager): void {
    this.projectManager = manager;
  }

  registerAIEnhancementService(service: IAIEnhancementService): void { // Added registerAIEnhancementService
    this.aiEnhancementService = service;
  }

  // Component access
  getTextAnalysisEngine(): ITextAnalysisEngine {
    if (!this.textAnalysisEngine) {
      throw new Error('TextAnalysisEngine not registered');
    }
    return this.textAnalysisEngine;
  }

  getCharacterDetectionSystem(): ICharacterDetectionSystem {
    if (!this.characterDetectionSystem) {
      throw new Error('CharacterDetectionSystem not registered');
    }
    return this.characterDetectionSystem;
  }

  getVoiceAssignmentLogic(): IVoiceAssignmentLogic {
    if (!this.voiceAssignmentLogic) {
      throw new Error('VoiceAssignmentLogic not registered');
    }
    return this.voiceAssignmentLogic;
  }

  getAudioGenerationPipeline(): IAudioGenerationPipeline {
    if (!this.audioGenerationPipeline) {
      throw new Error('AudioGenerationPipeline not registered');
    }
    return this.audioGenerationPipeline;
  }

  getSystemOrchestrator(): ISystemOrchestrator {
    if (!this.systemOrchestrator) {
      throw new Error('SystemOrchestrator not registered');
    }
    return this.systemOrchestrator;
  }

  getWritingQualityAnalyzer(): IWritingQualityAnalyzer {
    if (!this.writingQualityAnalyzer) {
      throw new Error('WritingQualityAnalyzer not registered');
    }
    return this.writingQualityAnalyzer;
  }

  getAudioControlsManager(): IAudioControlsManager {
    if (!this.audioControlsManager) {
      throw new Error('AudioControlsManager not registered');
    }
    return this.audioControlsManager;
  }

  getVoiceCustomizer(): IVoiceCustomizer {
    if (!this.voiceCustomizer) {
      throw new Error('VoiceCustomizer not registered');
    }
    return this.voiceCustomizer;
  }

  getTextEditor(): ITextEditor {
    if (!this.textEditor) {
      throw new Error('TextEditor not registered');
    }
    return this.textEditor;
  }

  getProjectManager(): IProjectManager {
    if (!this.projectManager) {
      throw new Error('ProjectManager not registered');
    }
    return this.projectManager;
  }

  getAIEnhancementService(): IAIEnhancementService { // Added getAIEnhancementService
    if (!this.aiEnhancementService) {
      throw new Error('AIEnhancementService not registered');
    }
    return this.aiEnhancementService;
  }

  // Health check
  isFullyConfigured(): boolean {
    return !!(
      this.textAnalysisEngine &&
      this.characterDetectionSystem &&
      this.voiceAssignmentLogic &&
      this.audioGenerationPipeline &&
      this.systemOrchestrator &&
      this.writingQualityAnalyzer &&
      this.audioControlsManager &&
      this.voiceCustomizer &&
      this.textEditor &&
      this.projectManager &&
      this.aiEnhancementService // Added aiEnhancementService to check
    );
  }
}