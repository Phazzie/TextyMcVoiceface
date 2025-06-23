// Core contract types for Seam-Driven Development
export interface ContractResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

// Narrator Mode Configuration Contract
export interface INarratorModeConfig {
  enabled: boolean;
  voice: VoiceProfile;
  speed: number; // 0.5 to 2.0 multiplier
  emphasis: number; // 0.0 to 1.0
  includeCharacterNames: boolean; // Whether to speak character names before dialogue
  characterNameStyle: 'full' | 'short' | 'none'; // How to present character names
  pauseBetweenSpeakers: number; // Milliseconds pause between different speakers
}

// Processing Mode Type
export type IProcessingMode = 'multi-voice' | 'narrator';

// Text Analysis Seam Contracts
export interface TextSegment {
  id: string;
  content: string;
  speaker: string;
  type: 'narration' | 'dialogue' | 'thought';
  mood?: string;
  startPosition: number;
  endPosition: number;
}

export interface ITextAnalysisEngine {
  parseText(text: string): Promise<ContractResult<TextSegment[]>>;
  identifyDialogue(text: string): Promise<ContractResult<DialogueMatch[]>>;
  extractAttributions(text: string): Promise<ContractResult<AttributionMatch[]>>;
}

export interface DialogueMatch {
  content: string;
  startIndex: number;
  endIndex: number;
  type: 'quote' | 'thought' | 'narration';
}

export interface AttributionMatch {
  verb: string;
  speaker: string;
  position: number;
  confidence: number;
}

// Character Detection Seam Contracts
export interface Character {
  name: string;
  frequency: number;
  characteristics: string[];
  emotionalStates: string[];
  isMainCharacter: boolean;
  firstAppearance: number;
}

export enum ActorArchetype {
  MethodActor = "The Method Actor (Subtle, realistic delivery)",
  ShakespeareanVeteran = "The Shakespearean Veteran (Dramatic, powerful delivery)",
  ComedicImproviser = "The Comedic Improviser (Playful, witty delivery)",
  UnderstatedIndieDarling = "The Understated Indie Darling (Quiet, nuanced delivery)",
  ActionHero = "The Action Hero (Tense, forceful delivery)",
}

export interface ICharacterDetectionSystem {
  detectCharacters(segments: TextSegment[]): Promise<ContractResult<Character[]>>;
  identifySpeakers(text: string): Promise<ContractResult<string[]>>;
  analyzeCharacterTraits(name: string, segments: TextSegment[]): Promise<ContractResult<Character>>;
}

// Voice Assignment Seam Contracts
export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'child' | 'young' | 'adult' | 'elderly';
  tone: 'warm' | 'cold' | 'neutral' | 'dramatic';
  pitch: number;
  speed: number;
}

export interface VoiceAssignment {
  character: string;
  voice: VoiceProfile;
  confidence: number;
}

export interface IVoiceAssignmentLogic {
  assignVoices(characters: Character[]): Promise<ContractResult<VoiceAssignment[]>>;
  generateVoiceProfile(character: Character): Promise<ContractResult<VoiceProfile>>;
  validateAssignments(assignments: VoiceAssignment[]): Promise<ContractResult<boolean>>;
}

// Audio Generation Seam Contracts
export interface AudioSegment {
  id: string;
  audioData: Blob;
  duration: number;
  speaker: string;
  text: string;
}

export interface AudioOutput {
  audioFile: Blob;
  duration: number;
  segments: AudioSegment[];
  metadata: {
    characterCount: number;
    totalSegments: number;
    processingTime: number;
  };
}

export interface IAudioGenerationPipeline {
  generateSegmentAudio(segment: TextSegment, voice: VoiceProfile): Promise<ContractResult<AudioSegment>>;
  combineAudioSegments(segments: AudioSegment[]): Promise<ContractResult<AudioOutput>>;
  optimizeAudio(audioData: Blob): Promise<ContractResult<Blob>>;
}

// Project Management Seam Contracts
export interface StoryProject {
  id: string;
  name: string;
  description?: string;
  originalText: string;
  audioOutput?: AudioOutput;
  characters: Character[];
  voiceAssignments: VoiceAssignment[];
  qualityReport?: WritingQualityReport;
  customVoices: Record<string, VoiceProfile>;
  settings: ProjectSettings;
  metadata: ProjectMetadata;
  tags: string[];
  version: string;
}

export interface ProjectSettings {
  useElevenLabs: boolean;
  elevenLabsApiKey?: string;
  outputFormat: 'mp3' | 'wav';
  enableQualityAnalysis: boolean;
  playbackSpeed: number;
  characterVolumes: Record<string, number>;
  bookmarks: Bookmark[];
  lastEditPosition: number;
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  narratorMode?: INarratorModeConfig; // New narrator mode settings
}

export interface ProjectMetadata {
  createdAt: number;
  modifiedAt: number;
  lastOpenedAt: number;
  wordCount: number;
  characterCount: number;
  estimatedDuration: number; // seconds
  completionStatus: 'draft' | 'processing' | 'complete' | 'error';
  processingProgress: number; // 0-100
  fileSize: number; // bytes
  authorName?: string;
  genre?: string;
  language: string;
  version: string;
}

export interface ColorData {
  hex: string;
  name: string;
  prominence: number; // e.g., percentage of use
}

export interface ColorPaletteAnalysis {
  dominantColors: ColorData[];
  accentColors: ColorData[];
  overallMood: string;
}

export interface ProjectHistory {
  id: string;
  projectId: string;
  timestamp: number;
  action: 'created' | 'opened' | 'saved' | 'exported' | 'deleted' | 'renamed';
  description: string;
  metadata?: Record<string, any>;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'fiction' | 'non-fiction' | 'educational' | 'custom';
  defaultSettings: Partial<ProjectSettings>;
  sampleText?: string;
  voiceTemplates: VoiceProfile[];
  tags: string[];
}

export interface ProjectExport {
  format: 'json' | 'zip' | 'backup';
  includeAudio: boolean;
  includeSettings: boolean;
  includeHistory: boolean;
  compression: 'none' | 'low' | 'high';
  encryption?: {
    enabled: boolean;
    password?: string;
  };
}

export interface ProjectImport {
  source: 'file' | 'url' | 'text';
  format: 'json' | 'zip' | 'txt' | 'docx' | 'pdf';
  data: ArrayBuffer | string;
  options: {
    overwriteExisting: boolean;
    mergeSettings: boolean;
    validateData: boolean;
  };
}

export interface IProjectManager {
  // Core project operations
  createProject(name: string, text: string, settings?: Partial<ProjectSettings>): Promise<ContractResult<StoryProject>>;
  saveProject(project: StoryProject): Promise<ContractResult<boolean>>;
  loadProject(projectId: string): Promise<ContractResult<StoryProject>>;
  deleteProject(projectId: string): Promise<ContractResult<boolean>>;
  duplicateProject(projectId: string, newName: string): Promise<ContractResult<StoryProject>>;
  
  // Project listing and search
  listProjects(options?: { sortBy?: 'name' | 'created' | 'modified'; order?: 'asc' | 'desc'; limit?: number }): Promise<ContractResult<StoryProject[]>>;
  searchProjects(query: string, filters?: { tags?: string[]; status?: string; dateRange?: { start: number; end: number } }): Promise<ContractResult<StoryProject[]>>;
  getRecentProjects(limit?: number): Promise<ContractResult<StoryProject[]>>;
  
  // Project metadata management
  updateProjectMetadata(projectId: string, metadata: Partial<ProjectMetadata>): Promise<ContractResult<boolean>>;
  addProjectTags(projectId: string, tags: string[]): Promise<ContractResult<boolean>>;
  removeProjectTags(projectId: string, tags: string[]): Promise<ContractResult<boolean>>;
  renameProject(projectId: string, newName: string): Promise<ContractResult<boolean>>;
  
  // Import/Export functionality
  exportProject(projectId: string, options: ProjectExport): Promise<ContractResult<Blob>>;
  importProject(importData: ProjectImport): Promise<ContractResult<StoryProject>>;
  exportAllProjects(options: ProjectExport): Promise<ContractResult<Blob>>;
  
  // Auto-save and backup
  enableAutoSave(projectId: string, intervalMinutes: number): Promise<ContractResult<boolean>>;
  disableAutoSave(projectId: string): Promise<ContractResult<boolean>>;
  createBackup(projectId: string): Promise<ContractResult<string>>;
  restoreBackup(backupId: string): Promise<ContractResult<StoryProject>>;
  
  // Project templates
  getProjectTemplates(): Promise<ContractResult<ProjectTemplate[]>>;
  createProjectFromTemplate(templateId: string, projectName: string): Promise<ContractResult<StoryProject>>;
  saveAsTemplate(projectId: string, templateName: string, description: string): Promise<ContractResult<ProjectTemplate>>;
  
  // History and analytics
  getProjectHistory(projectId: string): Promise<ContractResult<ProjectHistory[]>>;
  recordProjectAction(projectId: string, action: ProjectHistory['action'], description: string): Promise<ContractResult<boolean>>;
  getStorageStats(): Promise<ContractResult<{ totalProjects: number; totalSize: number; availableSpace: number }>>;
  
  // Cleanup and maintenance
  cleanupOldBackups(olderThanDays: number): Promise<ContractResult<number>>;
  validateProjectData(projectId: string): Promise<ContractResult<{ isValid: boolean; issues: string[] }>>;
  repairProject(projectId: string): Promise<ContractResult<boolean>>;
}

// Voice Customization Seam Contracts
export interface VoiceAdjustments {
  pitch?: number; // -1.0 to 1.0 relative adjustment
  speed?: number; // -1.0 to 1.0 relative adjustment
  tone?: 'warm' | 'cold' | 'neutral' | 'dramatic';
  emphasis?: number; // 0.0 to 1.0
  clarity?: number; // 0.0 to 1.0
}

export interface VoiceSettings {
  formatVersion: string;
  characters: Record<string, VoiceProfile>;
  customAdjustments: Record<string, VoiceAdjustments>;
  metadata: {
    createdAt: number;
    modifiedAt: number;
    totalCharacters: number;
  };
}

export interface VoicePreview {
  audioSegment: AudioSegment;
  voiceProfile: VoiceProfile;
  previewText: string;
  duration: number;
}

export interface IVoiceCustomizer {
  previewVoiceAdjustment(character: string, adjustments: VoiceAdjustments): Promise<ContractResult<VoicePreview>>;
  saveCustomVoice(character: string, profile: VoiceProfile): Promise<ContractResult<boolean>>;
  resetToDefault(character: string): Promise<ContractResult<VoiceProfile>>;
  exportVoiceSettings(): Promise<ContractResult<VoiceSettings>>;
  importVoiceSettings(settings: VoiceSettings): Promise<ContractResult<boolean>>;
  getCustomVoices(): Promise<ContractResult<Record<string, VoiceProfile>>>;
  applyAdjustments(baseProfile: VoiceProfile, adjustments: VoiceAdjustments): Promise<ContractResult<VoiceProfile>>;
  validateAdjustments(adjustments: VoiceAdjustments): Promise<ContractResult<boolean>>;
}

// Advanced Audio Controls Seam Contracts
export interface Bookmark {
  id: string;
  position: number; // Time position in seconds
  label: string;
  timestamp: number; // Creation timestamp
  description?: string;
  segment?: string; // Associated segment ID
  speaker?: string; // Character speaking at this position
}

export interface TimestampedExport {
  format: 'srt' | 'vtt' | 'txt' | 'json';
  content: string;
  metadata: {
    totalDuration: number;
    segmentCount: number;
    characterCount: number;
    exportTime: number;
  };
}

export interface CharacterVolumeSettings {
  character: string;
  volume: number; // 0.0 to 1.0
  muted: boolean;
  solo: boolean;
}

export interface PlaybackSettings {
  speed: number; // 0.25 to 4.0
  globalVolume: number; // 0.0 to 1.0
  characterVolumes: CharacterVolumeSettings[];
  enableEQ: boolean;
  bassBoost: number;
  trebleBoost: number;
}

export interface IAudioControlsManager {
  adjustPlaybackSpeed(speed: number): Promise<ContractResult<boolean>>;
  setVolumeForCharacter(character: string, volume: number): Promise<ContractResult<boolean>>;
  createBookmarks(position: number, label: string): Promise<ContractResult<Bookmark>>;
  exportWithTimestamps(): Promise<ContractResult<TimestampedExport>>;
  getBookmarks(): Promise<ContractResult<Bookmark[]>>;
  deleteBookmark(bookmarkId: string): Promise<ContractResult<boolean>>;
  updateBookmark(bookmarkId: string, updates: Partial<Bookmark>): Promise<ContractResult<Bookmark>>;
  setCharacterVolumes(settings: CharacterVolumeSettings[]): Promise<ContractResult<boolean>>;
  getPlaybackSettings(): Promise<ContractResult<PlaybackSettings>>;
  resetToDefaults(): Promise<ContractResult<PlaybackSettings>>;
}

// Writing Quality Analysis Contracts
export interface ReadabilityPoint {
  paragraphIndex: number;
  score: number; // The Flesch-Kincaid reading ease score
}

export interface ShowTellIssue {
  text: string;
  position: number;
  type: 'telling' | 'showing';
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  example?: string;
}

export interface TropeMatch {
  name: string;
  description: string;
  text: string;
  position: number;
  confidence: number;
  subversionSuggestions: string[];
  category: 'character' | 'plot' | 'dialogue' | 'setting';
}

export interface PurpleProseIssue {
  text: string;
  position: number;
  type: 'excessive_adjectives' | 'flowery_language' | 'redundant_description' | 'overwrought_metaphor';
  severity: 'mild' | 'moderate' | 'severe';
  suggestion: string;
  simplifiedVersion: string;
}

export interface EchoChamberResult {
  word: string;
  frequency: number;
  characters: string[]; // List of characters who used the word.
}

export interface WritingQualityReport {
  readabilityPoints: ReadabilityPoint[];
  showTellIssues: ShowTellIssue[];
  tropeMatches: TropeMatch[];
  purpleProseIssues: PurpleProseIssue[];
  echoChamber: EchoChamberResult[];
  overallScore: OverallScore;
}

export interface OverallScore {
  showVsTell: number; // 0-100
  tropeOriginality: number; // 0-100
  proseClarity: number; // 0-100
}

export interface DialogueTurn {
  characterName: string;
  powerScore: number; // A score from -5 (submissive) to +5 (dominant).
  metrics: {
    isQuestion: boolean;
    interruptions: number; // Count of interruptions initiated by this character in this turn
    wordCount: number;
    hedgeToIntensifierRatio: number; // Ratio of intensifiers to (hedges + intensifiers). Higher means more power.
    topicChanged: boolean; // True if this turn successfully changed the topic
  };
  detectedTactic?: 'weaponizedPoliteness' | 'exchangeTermination'; // Special tactics detected
}

export interface IWritingQualityAnalyzer {
  analyzeShowVsTell(text: string): Promise<ContractResult<ShowTellIssue[]>>;
  analyzeTropes(text: string): Promise<ContractResult<TropeMatch[]>>;
  analyzePurpleProse(text: string): Promise<ContractResult<PurpleProseIssue[]>>;
  analyzeReadabilityRollercoaster(text: string, paragraphsPerPoint?: number): Promise<ContractResult<ReadabilityPoint[]>>;
  analyzeDialoguePowerBalance(sceneText: string): Promise<ContractResult<DialogueTurn[]>>;
  detectTropes(text: string): Promise<ContractResult<TropeMatch[]>>;
  detectPurpleProse(text: string): Promise<ContractResult<PurpleProseIssue[]>>;
  detectEchoChamber(text: string): Promise<ContractResult<EchoChamberResult[]>>;
  analyzeColorPalette(text: string): Promise<ContractResult<ColorPaletteAnalysis>>;
  calculateOverallScore(report: Omit<WritingQualityReport, 'overallScore'>): Promise<ContractResult<OverallScore>>;
  generateFullReport(text: string): Promise<ContractResult<WritingQualityReport>>;
}

export interface IAIEnhancementService {
  invertTrope(context: string, tropeName: string): Promise<ContractResult<string>>;
  rewriteFromNewPerspective(text: string, newCharacterName: string, originalCharacterName: string): Promise<ContractResult<string>>;
  analyzeLiteraryDevices(text: string): Promise<ContractResult<LiteraryDeviceInstance[]>>;
}

// Application Configuration Service Contract
export interface IAppConfigService {
  getOpenAIApiKey(): Promise<ContractResult<string | null>>;
  // Could add other general app config methods here later
}

// Interactive Text Editor Seam Contracts
export interface TextChange {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  length: number;
  oldText: string;
  newText: string;
  timestamp: number;
  userId?: string;
}

export interface TextFix {
  id: string;
  issueId: string;
  issueType: 'show_tell' | 'trope' | 'purple_prose' | 'grammar' | 'style';
  position: number;
  length: number;
  originalText: string;
  suggestedText: string;
  confidence: number;
  description: string;
  category: 'automatic' | 'suggestion' | 'manual';
  metadata?: Record<string, any>;
}

export interface ChangeHistory {
  changes: TextChange[];
  currentVersion: number;
  totalVersions: number;
  undoStack: TextChange[];
  redoStack: TextChange[];
  metadata: {
    createdAt: number;
    lastModified: number;
    totalChanges: number;
    sessionId: string;
  };
}

export interface EditorAnnotation {
  id: string;
  type: 'issue' | 'suggestion' | 'highlight' | 'comment';
  position: number;
  length: number;
  severity: 'info' | 'warning' | 'error';
  message: string;
  category: string;
  data?: any;
  timestamp: number;
}

export interface EditorState {
  text: string;
  cursorPosition: number;
  selection?: {
    start: number;
    end: number;
  };
  annotations: EditorAnnotation[];
  activeIssues: WritingIssue[];
  pendingFixes: TextFix[];
  isAnalyzing: boolean;
  analysisProgress: number;
  metadata: {
    lastAnalysis: number;
    characterCount: number;
    wordCount: number;
    paragraphCount: number;
  };
}

export interface WritingIssue {
  id: string;
  type: 'show_tell' | 'trope' | 'purple_prose' | 'grammar' | 'style' | 'consistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  position: number;
  length: number;
  text: string;
  message: string;
  suggestion?: string;
  fixes: TextFix[];
  category: string;
  confidence: number;
  source: 'writing_analyzer' | 'grammar_check' | 'style_check' | 'manual';
  metadata?: Record<string, any>;
}

export interface EditorSettings {
  realTimeAnalysis: boolean;
  analysisDelay: number; // ms
  showInlineIssues: boolean;
  highlightSeverity: 'all' | 'medium' | 'high' | 'critical';
  enableAutoFix: boolean;
  showSuggestions: boolean;
  fontSize: number;
  theme: 'light' | 'dark' | 'auto';
  lineNumbers: boolean;
  wordWrap: boolean;
}

export interface BulkFixOperation {
  id: string;
  fixes: TextFix[];
  preview: string;
  affectedIssues: number;
  estimatedChanges: number;
  category: 'all' | 'show_tell' | 'trope' | 'purple_prose' | 'selected';
  confirmationRequired: boolean;
}

export interface CollaborationCursor {
  userId: string;
  userName: string;
  position: number;
  selection?: {
    start: number;
    end: number;
  };
  color: string;
  timestamp: number;
}

export interface ITextEditor {
  // Core text editing functionality
  insertText(position: number, text: string): Promise<ContractResult<TextChange>>;
  deleteText(position: number, length: number): Promise<ContractResult<TextChange>>;
  replaceText(position: number, length: number, newText: string): Promise<ContractResult<TextChange>>;
  getText(): Promise<ContractResult<string>>;
  setText(text: string): Promise<ContractResult<boolean>>;
  
  // Issue highlighting and annotation
  highlightIssues(issues: WritingIssue[]): Promise<ContractResult<EditorAnnotation[]>>;
  clearHighlights(issueIds?: string[]): Promise<ContractResult<boolean>>;
  addAnnotation(annotation: EditorAnnotation): Promise<ContractResult<boolean>>;
  removeAnnotation(annotationId: string): Promise<ContractResult<boolean>>;
  getAnnotations(position?: number, length?: number): Promise<ContractResult<EditorAnnotation[]>>;
  
  // Suggestion and fix application
  suggestReplacement(position: number, replacement: string): Promise<ContractResult<TextFix>>;
  applyFix(fix: TextFix): Promise<ContractResult<TextChange>>;
  applyBulkFixes(fixes: TextFix[]): Promise<ContractResult<BulkFixOperation>>;
  previewBulkFixes(fixes: TextFix[]): Promise<ContractResult<string>>;
  rejectFix(fixId: string): Promise<ContractResult<boolean>>;
  
  // Change tracking and history
  trackChanges(): Promise<ContractResult<ChangeHistory>>;
  undo(): Promise<ContractResult<TextChange | null>>;
  redo(): Promise<ContractResult<TextChange | null>>;
  getChangeHistory(): Promise<ContractResult<ChangeHistory>>;
  clearHistory(): Promise<ContractResult<boolean>>;
  
  // Real-time analysis integration
  enableRealTimeAnalysis(enabled: boolean): Promise<ContractResult<boolean>>;
  triggerAnalysis(): Promise<ContractResult<WritingIssue[]>>;
  getAnalysisStatus(): Promise<ContractResult<{ isAnalyzing: boolean; progress: number }>>;
  setAnalysisSettings(settings: Partial<EditorSettings>): Promise<ContractResult<EditorSettings>>;
  
  // Editor state management
  getEditorState(): Promise<ContractResult<EditorState>>;
  setEditorState(state: Partial<EditorState>): Promise<ContractResult<boolean>>;
  setCursorPosition(position: number): Promise<ContractResult<boolean>>;
  setSelection(start: number, end: number): Promise<ContractResult<boolean>>;
  
  // Advanced features
  findText(query: string, options?: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean }): Promise<ContractResult<{ position: number; length: number }[]>>;
  replaceAll(search: string, replace: string, options?: { caseSensitive?: boolean; wholeWord?: boolean }): Promise<ContractResult<number>>;
  getWordCount(): Promise<ContractResult<{ characters: number; words: number; paragraphs: number; lines: number }>>;
  exportWithChanges(format: 'markdown' | 'html' | 'text'): Promise<ContractResult<string>>;
  
  // Collaboration features
  addCollaborationCursor(cursor: CollaborationCursor): Promise<ContractResult<boolean>>;
  removeCollaborationCursor(userId: string): Promise<ContractResult<boolean>>;
  getCollaborationCursors(): Promise<ContractResult<CollaborationCursor[]>>;
  broadcastChange(change: TextChange): Promise<ContractResult<boolean>>;
}

// AI Enhancement Seam Contracts
export interface LiteraryDeviceInstance {
  deviceType: 'Metaphor' | 'Simile' | 'Analogy' | 'Personification' | 'Anthropomorphism' | 'Zoomorphism' | 'Allegory' | 'Juxtaposition' | 'Alliteration' | 'Assonance' | 'Consonance' | 'Onomatopoeia' | 'Cacophony' | 'Euphony' | 'Sibilance' | 'Hyperbole' | 'Understatement' | 'Paradox' | 'Oxymoron' | 'Irony' | 'Foreshadowing' | 'Flashback' | 'Anaphora' | 'Epistrophe' | 'Polysyndeton' | 'Asyndeton' | 'ChekhovsGun' | 'InMediasRes' | 'Imagery' | 'Symbolism' | 'Motif' | 'PatheticFallacy' | 'Metonymy' | 'Synecdoche' | 'Apostrophe' | 'Allusion' | 'Euphemism' | 'Pun';
  textSnippet: string;
  explanation: string;
  position: number;
}

// System Orchestration Seam Contracts
export interface ProcessingStatus {
  stage: 'analyzing' | 'detecting' | 'assigning' | 'generating' | 'quality_check' | 'complete' | 'error';
  progress: number;
  message: string;
  currentItem?: string;
}

export interface ProcessingOptions {
  enableManualCorrection?: boolean;
  voiceCustomization?: Partial<VoiceProfile>;
  outputFormat?: 'mp3' | 'wav';
  includeQualityAnalysis?: boolean;
  mode?: IProcessingMode; // New narrator mode option
  narratorConfig?: INarratorModeConfig; // Narrator mode configuration
}

export interface ISystemOrchestrator {
  processStory(text: string, options?: ProcessingOptions): Promise<ContractResult<AudioOutput>>;
  getProcessingStatus(): Promise<ContractResult<ProcessingStatus>>;
  cancelProcessing(): Promise<ContractResult<boolean>>;
}

// Error types
export class NotImplementedError extends Error {
  constructor(componentName: string, methodName: string) {
    super(`${componentName}.${methodName} is not yet implemented`);
    this.name = 'NotImplementedError';
  }
}