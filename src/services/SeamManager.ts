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
  IAIEnhancementService,
  IAppConfigService
} from '../types/contracts';
// Unused performance contract imports removed:
// import {
//   ICacheManager,
//   IPerformanceMonitor,
//   IBackgroundProcessor
// } from '../../docs/performance-contracts';

// Seam Manager for coordinating component communication
export class SeamManager {
  private static services: Map<string, unknown> = new Map(); // Changed 'any' to 'unknown'
  private static instance: SeamManager;
  // Specific typed members for commonly accessed services for convenience and type safety.
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
  private aiEnhancementService?: IAIEnhancementService;
  private appConfigService?: IAppConfigService;

  private constructor() { }

  static getInstance(): SeamManager {
    if (!SeamManager.instance) {
      SeamManager.instance = new SeamManager();
    }
    return SeamManager.instance;
  }

  // Component registration
  registerTextAnalysisEngine(engine: ITextAnalysisEngine): void {
    this.textAnalysisEngine = engine;
    SeamManager.services.set('TextAnalysisEngine', engine);
  }
  registerCharacterDetectionSystem(system: ICharacterDetectionSystem): void {
    this.characterDetectionSystem = system;
    SeamManager.services.set('CharacterDetectionSystem', system);
  }
  registerVoiceAssignmentLogic(logic: IVoiceAssignmentLogic): void {
    this.voiceAssignmentLogic = logic;
    SeamManager.services.set('VoiceAssignmentLogic', logic);
  }
  registerAudioGenerationPipeline(pipeline: IAudioGenerationPipeline): void {
    this.audioGenerationPipeline = pipeline;
    SeamManager.services.set('AudioGenerationPipeline', pipeline);
  }
  registerSystemOrchestrator(orchestrator: ISystemOrchestrator): void {
    this.systemOrchestrator = orchestrator;
    SeamManager.services.set('SystemOrchestrator', orchestrator);
  }
  registerWritingQualityAnalyzer(analyzer: IWritingQualityAnalyzer): void {
    this.writingQualityAnalyzer = analyzer;
    SeamManager.services.set('WritingQualityAnalyzer', analyzer);
  }
  registerAudioControlsManager(manager: IAudioControlsManager): void {
    this.audioControlsManager = manager;
    SeamManager.services.set('AudioControlsManager', manager);
  }
  registerVoiceCustomizer(customizer: IVoiceCustomizer): void {
    this.voiceCustomizer = customizer;
    SeamManager.services.set('VoiceCustomizer', customizer);
  }
  registerTextEditor(editor: ITextEditor): void {
    this.textEditor = editor;
    SeamManager.services.set('TextEditor', editor);
  }
  registerProjectManager(manager: IProjectManager): void {
    this.projectManager = manager;
    SeamManager.services.set('ProjectManager', manager);
  }
  registerAIEnhancementService(service: IAIEnhancementService): void {
    this.aiEnhancementService = service;
    SeamManager.services.set('AIEnhancementService', service);
  }
  registerAppConfigService(service: IAppConfigService): void {
    this.appConfigService = service;
    SeamManager.services.set('AppConfigService', service);
  }
  // Generic getter
  static get<T>(serviceName: string): T {
    const serviceInstance = SeamManager.services.get(serviceName);
    if (!serviceInstance) {
      throw new Error(`${serviceName} not registered in SeamManager.`);
    }
    return serviceInstance as T;
  }
  static isRegistered(serviceName: string): boolean {
    return SeamManager.services.has(serviceName);
  }

  // Component access
  getTextAnalysisEngine(): ITextAnalysisEngine {
    if (!this.textAnalysisEngine) throw new Error('TextAnalysisEngine not registered');
    return this.textAnalysisEngine;
  }
  getCharacterDetectionSystem(): ICharacterDetectionSystem {
    if (!this.characterDetectionSystem) throw new Error('CharacterDetectionSystem not registered');
    return this.characterDetectionSystem;
  }
  getVoiceAssignmentLogic(): IVoiceAssignmentLogic {
    if (!this.voiceAssignmentLogic) throw new Error('VoiceAssignmentLogic not registered');
    return this.voiceAssignmentLogic;
  }
  getAudioGenerationPipeline(): IAudioGenerationPipeline {
    if (!this.audioGenerationPipeline) throw new Error('AudioGenerationPipeline not registered');
    return this.audioGenerationPipeline;
  }
  getSystemOrchestrator(): ISystemOrchestrator {
    if (!this.systemOrchestrator) throw new Error('SystemOrchestrator not registered');
    return this.systemOrchestrator;
  }
  getWritingQualityAnalyzer(): IWritingQualityAnalyzer {
    if (!this.writingQualityAnalyzer) throw new Error('WritingQualityAnalyzer not registered');
    return this.writingQualityAnalyzer;
  }
  getAudioControlsManager(): IAudioControlsManager {
    if (!this.audioControlsManager) throw new Error('AudioControlsManager not registered');
    return this.audioControlsManager;
  }
  getVoiceCustomizer(): IVoiceCustomizer {
    if (!this.voiceCustomizer) throw new Error('VoiceCustomizer not registered');
    return this.voiceCustomizer;
  }
  getTextEditor(): ITextEditor {
    if (!this.textEditor) throw new Error('TextEditor not registered');
    return this.textEditor;
  }
  getProjectManager(): IProjectManager {
    if (!this.projectManager) throw new Error('ProjectManager not registered');
    return this.projectManager;
  }
  getAIEnhancementService(): IAIEnhancementService {
    if (!this.aiEnhancementService) throw new Error('AIEnhancementService not registered');
    return this.aiEnhancementService;
  }
  getAppConfigService(): IAppConfigService {
    if (!this.appConfigService) {
      throw new Error('AppConfigService not registered');
    }
    return this.appConfigService;
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
      this.aiEnhancementService &&
      this.appConfigService
    );
  }
}
