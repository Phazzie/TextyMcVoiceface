// Performance Optimization Seam - Complete Contract Definitions
// Following Seam-Driven Development (SDD) methodology

import { ContractResult } from '../src/types/contracts';

// ===============================
// CORE CACHE MANAGEMENT CONTRACTS
// ===============================

export interface ICacheManager {
  // Audio segment caching
  cacheAudioSegment(segmentId: string, audioData: Blob, metadata?: CacheMetadata): Promise<ContractResult<boolean>>;
  getCachedAudioSegment(segmentId: string): Promise<ContractResult<CachedAudioSegment | null>>;
  invalidateAudioCache(pattern?: string): Promise<ContractResult<number>>;
  
  // Text analysis caching
  cacheAnalysisResult(textHash: string, result: any, analysisType: string): Promise<ContractResult<boolean>>;
  getCachedAnalysisResult(textHash: string, analysisType: string): Promise<ContractResult<any>>;
  
  // Voice profile caching
  cacheVoiceProfile(characterId: string, profile: VoiceProfile): Promise<ContractResult<boolean>>;
  getCachedVoiceProfile(characterId: string): Promise<ContractResult<VoiceProfile | null>>;
  
  // Memory management
  optimizeMemoryUsage(): Promise<ContractResult<MemoryOptimizationResult>>;
  getMemoryStats(): Promise<ContractResult<MemoryStats>>;
  clearCache(cacheType?: CacheType): Promise<ContractResult<boolean>>;
  
  // Cache configuration
  setCachePolicy(policy: CachePolicy): Promise<ContractResult<boolean>>;
  getCachePolicy(): Promise<ContractResult<CachePolicy>>;
  
  // Cache maintenance
  performMaintenance(): Promise<ContractResult<MaintenanceResult>>;
  exportCacheStats(): Promise<ContractResult<CacheStats>>;
}

// ===============================
// PERFORMANCE MONITORING CONTRACTS
// ===============================

export interface IPerformanceMonitor {
  // Metrics collection
  recordMetric(metric: PerformanceMetric): Promise<ContractResult<boolean>>;
  getMetrics(timeRange?: TimeRange): Promise<ContractResult<PerformanceMetric[]>>;
  
  // Real-time monitoring
  startMonitoring(interval?: number): Promise<ContractResult<boolean>>;
  stopMonitoring(): Promise<ContractResult<boolean>>;
  getMonitoringStatus(): Promise<ContractResult<MonitoringStatus>>;
  
  // Performance analysis
  analyzePerformance(): Promise<ContractResult<PerformanceAnalysis>>;
  getBottlenecks(): Promise<ContractResult<PerformanceBottleneck[]>>;
  generatePerformanceReport(): Promise<ContractResult<PerformanceReport>>;
  
  // Optimization suggestions
  getOptimizationSuggestions(): Promise<ContractResult<OptimizationSuggestion[]>>;
  applyOptimization(optimizationId: string): Promise<ContractResult<boolean>>;
  
  // Alerts and thresholds
  setPerformanceThreshold(metric: string, threshold: number): Promise<ContractResult<boolean>>;
  getActiveAlerts(): Promise<ContractResult<PerformanceAlert[]>>;
}

// ===============================
// BACKGROUND PROCESSING CONTRACTS
// ===============================

export interface IBackgroundProcessor {
  // Large document processing
  processLargeDocument(text: string, options: ProcessingOptions): Promise<ContractResult<ProcessingJob>>;
  getProcessingStatus(jobId: string): Promise<ContractResult<ProcessingStatus>>;
  
  // Queue management
  getProcessingQueue(): Promise<ContractResult<ProcessingJob[]>>;
  prioritizeJob(jobId: string, priority: number): Promise<ContractResult<boolean>>;
  cancelJob(jobId: string): Promise<ContractResult<boolean>>;
  pauseJob(jobId: string): Promise<ContractResult<boolean>>;
  resumeJob(jobId: string): Promise<ContractResult<boolean>>;
  
  // Progressive loading
  enableProgressiveLoading(enabled: boolean): Promise<ContractResult<boolean>>;
  setChunkSize(size: number): Promise<ContractResult<boolean>>;
  getChunkingStrategy(): Promise<ContractResult<ChunkingStrategy>>;
  
  // Worker management
  getWorkerStats(): Promise<ContractResult<WorkerStats>>;
  optimizeWorkerAllocation(): Promise<ContractResult<boolean>>;
}

// ===============================
// DATA TYPE DEFINITIONS
// ===============================

// Cache-related types
export interface CacheMetadata {
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  priority: number;
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
  compressionRatio?: number;
}

export interface CachedAudioSegment {
  segmentId: string;
  audioData: Blob;
  metadata: CacheMetadata;
  voiceProfile: VoiceProfile;
  checksum: string;
}

export interface CachePolicy {
  maxMemoryUsage: number; // Bytes
  maxCacheAge: number; // Milliseconds
  evictionStrategy: 'LRU' | 'LFU' | 'TTL' | 'PRIORITY';
  compressionEnabled: boolean;
  compressionThreshold: number; // Minimum size to compress
  priorityThreshold: number;
  autoOptimization: boolean;
  persistToDisk: boolean;
}

export interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  compressionSavings: number;
  averageAccessTime: number;
  lastOptimization: number;
}

export interface MaintenanceResult {
  entriesRemoved: number;
  memoryFreed: number;
  defragmentationTime: number;
  compressionImprovement: number;
  optimizationsApplied: string[];
}

// Memory management types
export interface MemoryStats {
  totalAllocated: number;
  cacheUsage: number;
  availableMemory: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  garbageCollectionStats: {
    collections: number;
    totalTime: number;
    lastCollection: number;
    averageCollectionTime: number;
  };
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
}

export interface MemoryOptimizationResult {
  memoryFreed: number;
  cacheEntriesRemoved: number;
  optimizationsApplied: string[];
  newMemoryUsage: number;
  performanceImprovement: number;
  estimatedTimeSavings: number;
}

// Performance monitoring types
export interface PerformanceMetric {
  id: string;
  timestamp: number;
  type: 'processing_time' | 'memory_usage' | 'cache_hit_rate' | 'user_interaction' | 'network' | 'render_time';
  value: number;
  unit: string;
  context?: Record<string, any>;
  severity?: 'normal' | 'warning' | 'critical';
  threshold?: number;
}

export interface PerformanceAnalysis {
  overallScore: number; // 0-100
  trends: PerformanceTrend[];
  recommendations: string[];
  criticalIssues: string[];
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  improvementAreas: string[];
  strengths: string[];
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'degrading';
  magnitude: number; // Percentage change
  period: string;
  significance: 'low' | 'medium' | 'high';
}

export interface PerformanceBottleneck {
  id: string;
  type: 'memory' | 'cpu' | 'cache' | 'network' | 'rendering' | 'io';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number; // 0-100
  suggestions: string[];
  estimatedFixTime: string;
  detectedAt: number;
  affectedComponents: string[];
}

export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  expectedImprovement: number; // Percentage
  implementationComplexity: 'low' | 'medium' | 'high';
  autoApplicable: boolean;
  category: 'memory' | 'cache' | 'processing' | 'ui' | 'network';
  priority: number; // 1-10
  prerequisites?: string[];
  risks?: string[];
}

export interface PerformanceReport {
  generatedAt: number;
  timeRange: TimeRange;
  summary: PerformanceAnalysis;
  detailedMetrics: PerformanceMetric[];
  recommendations: OptimizationSuggestion[];
  historicalComparison: {
    previousPeriod: PerformanceAnalysis;
    improvement: number;
    regressions: string[];
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'threshold_exceeded' | 'anomaly_detected' | 'system_degradation';
  severity: 'warning' | 'critical';
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  triggeredAt: number;
  acknowledged: boolean;
  resolvedAt?: number;
}

export interface MonitoringStatus {
  isActive: boolean;
  interval: number;
  startedAt: number;
  metricsCollected: number;
  alertsGenerated: number;
  lastUpdate: number;
}

// Background processing types
export interface ProcessingJob {
  id: string;
  type: 'text_analysis' | 'character_detection' | 'audio_generation' | 'quality_analysis';
  status: 'queued' | 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  priority: number; // 1-10
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  currentStep?: string;
  totalSteps?: number;
  result?: any;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  dependencies?: string[];
  tags?: string[];
}

export interface ProcessingOptions {
  chunkSize?: number;
  priority?: number;
  enableProgressiveResults?: boolean;
  maxConcurrency?: number;
  timeoutMs?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
  enableCaching?: boolean;
  tags?: string[];
}

export interface ProcessingStatus {
  job: ProcessingJob;
  currentChunk?: {
    index: number;
    total: number;
    startPosition: number;
    endPosition: number;
  };
  estimatedTimeRemaining?: number;
  averageProcessingSpeed?: number;
  resourceUsage?: {
    cpu: number;
    memory: number;
  };
}

export interface ChunkingStrategy {
  strategy: 'fixed_size' | 'sentence_boundary' | 'paragraph_boundary' | 'adaptive';
  chunkSize: number;
  overlap: number;
  preserveBoundaries: boolean;
  adaptiveThreshold?: number;
}

export interface WorkerStats {
  activeWorkers: number;
  maxWorkers: number;
  queueLength: number;
  averageTaskTime: number;
  workerUtilization: number;
  failureRate: number;
  lastOptimization: number;
}

// Utility types
export interface TimeRange {
  start: number;
  end: number;
}

export enum CacheType {
  AUDIO = 'audio',
  ANALYSIS = 'analysis',
  VOICE_PROFILES = 'voice_profiles',
  PROCESSING_RESULTS = 'processing_results',
  ALL = 'all'
}

// Import VoiceProfile from existing contracts
export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'child' | 'young' | 'adult' | 'elderly';
  tone: 'warm' | 'cold' | 'neutral' | 'dramatic';
  pitch: number;
  speed: number;
}

// Error types specific to performance optimization
export class CacheError extends Error {
  constructor(message: string, public cacheType: CacheType, public operation: string) {
    super(message);
    this.name = 'CacheError';
  }
}

export class MemoryError extends Error {
  constructor(message: string, public currentUsage: number, public limit: number) {
    super(message);
    this.name = 'MemoryError';
  }
}

export class ProcessingError extends Error {
  constructor(message: string, public jobId: string, public stage: string) {
    super(message);
    this.name = 'ProcessingError';
  }
}