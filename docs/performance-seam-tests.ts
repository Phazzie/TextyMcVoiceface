// Performance Optimization Seam - Comprehensive Test Suite
// Following SDD methodology with complete seam integration testing

import { 
  ICacheManager, 
  IPerformanceMonitor, 
  IBackgroundProcessor,
  CacheType,
  PerformanceMetric
} from './performance-contracts';

describe('Performance Optimization Seam Integration Tests', () => {
  let cacheManager: ICacheManager;
  let performanceMonitor: IPerformanceMonitor;
  let backgroundProcessor: IBackgroundProcessor;

  // Define an interface for the test seam manager
  interface ITestSeamManager {
    getCacheManager: () => ICacheManager;
    getPerformanceMonitor: () => IPerformanceMonitor;
    getBackgroundProcessor: () => IBackgroundProcessor;
    getTextAnalysisEngine: () => unknown; // Using unknown for now
    getAudioGenerationPipeline: () => unknown; // Using unknown for now
  }
  let seamManager: ITestSeamManager;

  beforeEach(async () => {
    // Initialize all performance seam components
    seamManager = getTestSeamManager();
    cacheManager = seamManager.getCacheManager();
    performanceMonitor = seamManager.getPerformanceMonitor();
    backgroundProcessor = seamManager.getBackgroundProcessor();
    
    // Clear all caches and reset metrics
    await cacheManager.clearCache(CacheType.ALL);
    await performanceMonitor.stopMonitoring();
  });

  describe('Cache Manager Seam Tests', () => {
    test('Should cache and retrieve audio segments', async () => {
      const segmentId = 'test-segment-1';
      const audioData = new Blob(['test audio data'], { type: 'audio/wav' });
      
      // Cache audio segment
      const cacheResult = await cacheManager.cacheAudioSegment(segmentId, audioData);
      expect(cacheResult.success).toBe(true);
      
      // Retrieve cached segment
      const retrieveResult = await cacheManager.getCachedAudioSegment(segmentId);
      expect(retrieveResult.success).toBe(true);
      expect(retrieveResult.data?.segmentId).toBe(segmentId);
      expect(retrieveResult.data?.audioData.size).toBe(audioData.size);
    });

    test('Should cache and retrieve text analysis results', async () => {
      const textHash = 'hash123';
      const analysisResult = { segments: 5, characters: 3, words: 1500 };
      const analysisType = 'text_parsing';
      
      // Cache analysis result
      const cacheResult = await cacheManager.cacheAnalysisResult(textHash, analysisResult, analysisType);
      expect(cacheResult.success).toBe(true);
      
      // Retrieve cached result
      const retrieveResult = await cacheManager.getCachedAnalysisResult(textHash, analysisType);
      expect(retrieveResult.success).toBe(true);
      expect(retrieveResult.data).toEqual(analysisResult);
    });

    test('Should handle memory optimization correctly', async () => {
      // Fill cache with test data
      for (let i = 0; i < 100; i++) {
        const audioData = new Blob([`test data ${i}`.repeat(1000)], { type: 'audio/wav' });
        await cacheManager.cacheAudioSegment(`segment-${i}`, audioData);
      }
      
      // Get initial memory stats
      const initialStats = await cacheManager.getMemoryStats();
      expect(initialStats.success).toBe(true);
      
      // Perform memory optimization
      const optimizationResult = await cacheManager.optimizeMemoryUsage();
      expect(optimizationResult.success).toBe(true);
      expect(optimizationResult.data?.memoryFreed).toBeGreaterThan(0);
      
      // Verify memory was actually freed
      const finalStats = await cacheManager.getMemoryStats();
      expect(finalStats.data?.totalAllocated).toBeLessThan(initialStats.data?.totalAllocated);
    });

    test('Should handle cache invalidation patterns', async () => {
      // Cache multiple audio segments
      await cacheManager.cacheAudioSegment('voice-john-1', new Blob(['test1']));
      await cacheManager.cacheAudioSegment('voice-john-2', new Blob(['test2']));
      await cacheManager.cacheAudioSegment('voice-mary-1', new Blob(['test3']));
      
      // Invalidate all John's voice cache entries
      const invalidationResult = await cacheManager.invalidateAudioCache('voice-john-*');
      expect(invalidationResult.success).toBe(true);
      expect(invalidationResult.data).toBe(2); // Two entries invalidated
      
      // Verify John's entries are gone but Mary's remains
      const johnResult1 = await cacheManager.getCachedAudioSegment('voice-john-1');
      const johnResult2 = await cacheManager.getCachedAudioSegment('voice-john-2');
      const maryResult = await cacheManager.getCachedAudioSegment('voice-mary-1');
      
      expect(johnResult1.data).toBeNull();
      expect(johnResult2.data).toBeNull();
      expect(maryResult.data).not.toBeNull();
    });

    test('Should enforce cache policies correctly', async () => {
      // Set strict cache policy
      const policy = {
        maxMemoryUsage: 1024 * 1024, // 1MB
        maxCacheAge: 5000, // 5 seconds
        evictionStrategy: 'LRU' as const,
        compressionEnabled: true,
        compressionThreshold: 1024,
        priorityThreshold: 5,
        autoOptimization: true,
        persistToDisk: false
      };
      
      await cacheManager.setCachePolicy(policy);
      
      // Verify policy was set
      const policyResult = await cacheManager.getCachePolicy();
      expect(policyResult.success).toBe(true);
      expect(policyResult.data?.maxMemoryUsage).toBe(1024 * 1024);
      
      // Test cache eviction by exceeding memory limit
      const largeData = new Blob([new ArrayBuffer(512 * 1024)]); // 512KB
      await cacheManager.cacheAudioSegment('large-1', largeData);
      await cacheManager.cacheAudioSegment('large-2', largeData);
      
      // Third large item should trigger eviction
      await cacheManager.cacheAudioSegment('large-3', largeData);
      
      // First item should be evicted (LRU)
      const evictedResult = await cacheManager.getCachedAudioSegment('large-1');
      expect(evictedResult.data).toBeNull();
      
      // Recent items should still exist
      const recentResult = await cacheManager.getCachedAudioSegment('large-3');
      expect(recentResult.data).not.toBeNull();
    });
  });

  describe('Performance Monitor Seam Tests', () => {
    test('Should record and retrieve performance metrics', async () => {
      const metric: PerformanceMetric = {
        id: 'test-metric-1',
        timestamp: Date.now(),
        type: 'processing_time',
        value: 150,
        unit: 'ms',
        context: { operation: 'text_analysis' }
      };
      
      // Record metric
      const recordResult = await performanceMonitor.recordMetric(metric);
      expect(recordResult.success).toBe(true);
      
      // Retrieve metrics
      const metricsResult = await performanceMonitor.getMetrics();
      expect(metricsResult.success).toBe(true);
      expect(metricsResult.data?.length).toBeGreaterThan(0);
      expect(metricsResult.data?.[0].id).toBe('test-metric-1');
    });

    test('Should start and stop monitoring correctly', async () => {
      // Start monitoring
      const startResult = await performanceMonitor.startMonitoring(1000); // 1 second interval
      expect(startResult.success).toBe(true);
      
      // Verify monitoring is active
      const statusResult = await performanceMonitor.getMonitoringStatus();
      expect(statusResult.success).toBe(true);
      expect(statusResult.data?.isActive).toBe(true);
      expect(statusResult.data?.interval).toBe(1000);
      
      // Wait for some metrics to be collected
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Stop monitoring
      const stopResult = await performanceMonitor.stopMonitoring();
      expect(stopResult.success).toBe(true);
      
      // Verify monitoring stopped
      const finalStatusResult = await performanceMonitor.getMonitoringStatus();
      expect(finalStatusResult.data?.isActive).toBe(false);
    });

    test('Should detect performance bottlenecks', async () => {
      // Simulate slow operations by recording high processing times
      for (let i = 0; i < 10; i++) {
        await performanceMonitor.recordMetric({
          id: `slow-metric-${i}`,
          timestamp: Date.now(),
          type: 'processing_time',
          value: 5000 + (i * 100), // Progressively slower
          unit: 'ms',
          context: { operation: 'audio_generation' }
        });
      }
      
      // Analyze performance
      const analysisResult = await performanceMonitor.analyzePerformance();
      expect(analysisResult.success).toBe(true);
      expect(analysisResult.data?.overallScore).toBeLessThan(80); // Poor performance
      
      // Get bottlenecks
      const bottlenecksResult = await performanceMonitor.getBottlenecks();
      expect(bottlenecksResult.success).toBe(true);
      expect(bottlenecksResult.data?.length).toBeGreaterThan(0);
      
      const bottleneck = bottlenecksResult.data?.[0];
      expect(bottleneck?.type).toBe('cpu'); // Should detect CPU bottleneck
      expect(bottleneck?.severity).toBeOneOf(['medium', 'high', 'critical']);
    });

    test('Should generate optimization suggestions', async () => {
      // Record metrics indicating cache issues
      await performanceMonitor.recordMetric({
        id: 'cache-miss-metric',
        timestamp: Date.now(),
        type: 'cache_hit_rate',
        value: 0.3, // Low hit rate
        unit: 'ratio',
        context: { cache_type: 'audio' }
      });
      
      // Get optimization suggestions
      const suggestionsResult = await performanceMonitor.getOptimizationSuggestions();
      expect(suggestionsResult.success).toBe(true);
      expect(suggestionsResult.data?.length).toBeGreaterThan(0);
      
      const suggestion = suggestionsResult.data?.find(s => s.category === 'cache');
      expect(suggestion).toBeDefined();
      expect(suggestion?.expectedImprovement).toBeGreaterThan(0);
    });

    test('Should handle performance thresholds and alerts', async () => {
      // Set performance threshold
      const thresholdResult = await performanceMonitor.setPerformanceThreshold('processing_time', 1000);
      expect(thresholdResult.success).toBe(true);
      
      // Record metric that exceeds threshold
      await performanceMonitor.recordMetric({
        id: 'threshold-exceeded',
        timestamp: Date.now(),
        type: 'processing_time',
        value: 2000, // Exceeds 1000ms threshold
        unit: 'ms',
        threshold: 1000
      });
      
      // Check for alerts
      const alertsResult = await performanceMonitor.getActiveAlerts();
      expect(alertsResult.success).toBe(true);
      expect(alertsResult.data?.length).toBeGreaterThan(0);
      
      const alert = alertsResult.data?.[0];
      expect(alert?.type).toBe('threshold_exceeded');
      expect(alert?.severity).toBeOneOf(['warning', 'critical']);
    });
  });

  describe('Background Processor Seam Tests', () => {
    test('Should process large documents in background', async () => {
      const largeText = 'Lorem ipsum '.repeat(50000); // ~500k characters
      
      // Start background processing
      const jobResult = await backgroundProcessor.processLargeDocument(largeText, {
        chunkSize: 10000,
        priority: 5,
        enableProgressiveResults: true
      });
      
      expect(jobResult.success).toBe(true);
      expect(jobResult.data?.id).toBeDefined();
      expect(jobResult.data?.status).toBe('queued');
      
      const jobId = jobResult.data!.id;
      
      // Poll for completion
      let attempts = 0;
      let finalStatus;
      
      while (attempts < 30) { // Max 30 seconds
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResult = await backgroundProcessor.getProcessingStatus(jobId);
        
        if (statusResult.success && statusResult.data) {
          finalStatus = statusResult.data;
          if (finalStatus.job.status === 'completed' || finalStatus.job.status === 'failed') {
            break;
          }
        }
        attempts++;
      }
      
      expect(finalStatus?.job.status).toBe('completed');
      expect(finalStatus?.job.progress).toBe(100);
      expect(finalStatus?.job.result).toBeDefined();
    });

    test('Should handle job prioritization', async () => {
      // Create multiple jobs with different priorities
      const lowPriorityJob = await backgroundProcessor.processLargeDocument('low priority text', { priority: 1 });
      const highPriorityJob = await backgroundProcessor.processLargeDocument('high priority text', { priority: 10 });
      const mediumPriorityJob = await backgroundProcessor.processLargeDocument('medium priority text', { priority: 5 });
      
      expect(lowPriorityJob.success).toBe(true);
      expect(highPriorityJob.success).toBe(true);
      expect(mediumPriorityJob.success).toBe(true);
      
      // Get processing queue
      const queueResult = await backgroundProcessor.getProcessingQueue();
      expect(queueResult.success).toBe(true);
      
      const queue = queueResult.data!;
      expect(queue.length).toBe(3);
      
      // Verify priority ordering (higher priority first)
      expect(queue[0].priority).toBeGreaterThanOrEqual(queue[1].priority);
      expect(queue[1].priority).toBeGreaterThanOrEqual(queue[2].priority);
      
      // Change priority of low priority job
      const prioritizeResult = await backgroundProcessor.prioritizeJob(lowPriorityJob.data!.id, 15);
      expect(prioritizeResult.success).toBe(true);
      
      // Verify queue reordering
      const newQueueResult = await backgroundProcessor.getProcessingQueue();
      const newQueue = newQueueResult.data!;
      expect(newQueue[0].id).toBe(lowPriorityJob.data!.id);
    });

    test('Should support job cancellation and pause/resume', async () => {
      const largeText = 'test text '.repeat(100000);
      
      // Start a large job
      const jobResult = await backgroundProcessor.processLargeDocument(largeText, {
        chunkSize: 5000,
        priority: 5
      });
      
      const jobId = jobResult.data!.id;
      
      // Wait for job to start processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Pause the job
      const pauseResult = await backgroundProcessor.pauseJob(jobId);
      expect(pauseResult.success).toBe(true);
      
      // Verify job is paused
      const pausedStatusResult = await backgroundProcessor.getProcessingStatus(jobId);
      expect(pausedStatusResult.data?.job.status).toBe('paused');
      
      // Resume the job
      const resumeResult = await backgroundProcessor.resumeJob(jobId);
      expect(resumeResult.success).toBe(true);
      
      // Wait a bit then cancel
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const cancelResult = await backgroundProcessor.cancelJob(jobId);
      expect(cancelResult.success).toBe(true);
      
      // Verify job is cancelled
      const cancelledStatusResult = await backgroundProcessor.getProcessingStatus(jobId);
      expect(cancelledStatusResult.data?.job.status).toBe('cancelled');
    });

    test('Should optimize worker allocation', async () => {
      // Get initial worker stats
      const initialStatsResult = await backgroundProcessor.getWorkerStats();
      expect(initialStatsResult.success).toBe(true);
      
      const initialStats = initialStatsResult.data!;
      expect(initialStats.activeWorkers).toBeGreaterThanOrEqual(0);
      expect(initialStats.maxWorkers).toBeGreaterThan(0);
      
      // Create multiple concurrent jobs
      const jobs = [];
      for (let i = 0; i < 5; i++) {
        const job = await backgroundProcessor.processLargeDocument(`test text ${i}`.repeat(10000));
        jobs.push(job.data!.id);
      }
      
      // Wait for workers to spin up
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Optimize worker allocation
      const optimizeResult = await backgroundProcessor.optimizeWorkerAllocation();
      expect(optimizeResult.success).toBe(true);
      
      // Get updated stats
      const optimizedStatsResult = await backgroundProcessor.getWorkerStats();
      const optimizedStats = optimizedStatsResult.data!;
      
      // Worker utilization should be reasonable
      expect(optimizedStats.workerUtilization).toBeGreaterThan(0);
      expect(optimizedStats.workerUtilization).toBeLessThanOrEqual(1);
      
      // Clean up jobs
      for (const jobId of jobs) {
        await backgroundProcessor.cancelJob(jobId);
      }
    });

    test('Should handle progressive loading configuration', async () => {
      // Enable progressive loading
      const enableResult = await backgroundProcessor.enableProgressiveLoading(true);
      expect(enableResult.success).toBe(true);
      
      // Set chunk size
      const chunkSizeResult = await backgroundProcessor.setChunkSize(5000);
      expect(chunkSizeResult.success).toBe(true);
      
      // Get chunking strategy
      const strategyResult = await backgroundProcessor.getChunkingStrategy();
      expect(strategyResult.success).toBe(true);
      expect(strategyResult.data?.chunkSize).toBe(5000);
      
      // Process document with progressive loading
      const text = 'Progressive loading test '.repeat(2000); // ~40k characters
      const jobResult = await backgroundProcessor.processLargeDocument(text, {
        enableProgressiveResults: true
      });
      
      expect(jobResult.success).toBe(true);
      
      // Monitor for progressive results
      const jobId = jobResult.data!.id;
      let progressUpdates = 0;
      
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const statusResult = await backgroundProcessor.getProcessingStatus(jobId);
        
        if (statusResult.success && statusResult.data) {
          const status = statusResult.data;
          if (status.job.progress > 0 && status.job.progress < 100) {
            progressUpdates++;
          }
          if (status.job.status === 'completed') break;
        }
      }
      
      expect(progressUpdates).toBeGreaterThan(0); // Should have intermediate progress updates
    });
  });

  describe('Cross-Seam Integration Tests', () => {
    test('Should integrate cache manager with existing text analysis engine', async () => {
      const textAnalysisEngine = seamManager.getTextAnalysisEngine();
      const testText = 'This is a test story with dialogue. "Hello," said John. "How are you?"';
      
      // First analysis (cache miss)
      const start1 = Date.now();
      const result1 = await textAnalysisEngine.parseText(testText);
      const time1 = Date.now() - start1;
      
      expect(result1.success).toBe(true);
      
      // Second analysis (should hit cache)
      const start2 = Date.now();
      const result2 = await textAnalysisEngine.parseText(testText);
      const time2 = Date.now() - start2;
      
      expect(result2.success).toBe(true);
      expect(time2).toBeLessThan(time1 / 2); // Should be significantly faster
      
      // Verify cache hit
      const cacheStats = await cacheManager.exportCacheStats();
      expect(cacheStats.data?.hitRate).toBeGreaterThan(0);
    });

    test('Should integrate performance monitoring with audio generation', async () => {
      // const audioPipeline = seamManager.getAudioGenerationPipeline(); // Unused variable
      const testSegment = {
        id: 'test-segment',
        content: 'Hello world',
        speaker: 'John',
        type: 'dialogue' as const,
        startPosition: 0,
        endPosition: 11
      };
      
      const testVoice = {
        id: 'john-voice',
        name: 'John Voice',
        gender: 'male' as const,
        age: 'adult' as const,
        tone: 'neutral' as const,
        pitch: 1.0,
        speed: 1.0
      };
      
      // Start performance monitoring
      await performanceMonitor.startMonitoring(100);
      
      // Generate audio
      const audioResult = await audioPipeline.generateSegmentAudio(testSegment, testVoice);
      expect(audioResult.success).toBe(true);
      
      // Wait for metrics collection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Stop monitoring
      await performanceMonitor.stopMonitoring();
      
      // Check that performance metrics were recorded
      const metricsResult = await performanceMonitor.getMetrics();
      expect(metricsResult.success).toBe(true);
      expect(metricsResult.data?.length).toBeGreaterThan(0);
      
      // Should have audio generation metrics
      const audioMetrics = metricsResult.data?.filter(m => 
        m.context?.operation === 'audio_generation' || 
        m.type === 'processing_time'
      );
      expect(audioMetrics?.length).toBeGreaterThan(0);
    });

    test('Should handle memory pressure across all seams', async () => {
      // Simulate memory pressure by creating lots of cached data
      const textAnalysisEngine = seamManager.getTextAnalysisEngine();
      const audioPipeline = seamManager.getAudioGenerationPipeline();
      
      // Generate lots of analysis and audio data
      for (let i = 0; i < 50; i++) {
        const text = `Story number ${i} with dialogue and characters. "Hello," said Character${i}.`;
        await textAnalysisEngine.parseText(text);
        
        if (i % 10 === 0) {
          // Check memory usage
          const memoryStats = await cacheManager.getMemoryStats();
          if (memoryStats.data?.memoryPressure === 'high' || memoryStats.data?.memoryPressure === 'critical') {
            // Trigger memory optimization
            const optimizationResult = await cacheManager.optimizeMemoryUsage();
            expect(optimizationResult.success).toBe(true);
            expect(optimizationResult.data?.memoryFreed).toBeGreaterThan(0);
          }
        }
      }
      
      // Final memory check - should be under control
      const finalMemoryStats = await cacheManager.getMemoryStats();
      expect(finalMemoryStats.data?.memoryPressure).not.toBe('critical');
    });

    test('Should coordinate background processing with real-time user interactions', async () => {
      // Start a large background job
      const largeText = 'Background processing test '.repeat(10000);
      const backgroundJob = await backgroundProcessor.processLargeDocument(largeText, {
        priority: 3, // Medium priority
        enableProgressiveResults: true
      });
      
      // Simulate user interaction (high priority)
      const userText = 'User typed this text.';
      const userAnalysis = await seamManager.getTextAnalysisEngine().parseText(userText);
      
      // User interaction should complete quickly despite background job
      expect(userAnalysis.success).toBe(true);
      
      // Background job should still be processing or completed
      const jobStatus = await backgroundProcessor.getProcessingStatus(backgroundJob.data!.id);
      expect(jobStatus.success).toBe(true);
      expect(['queued', 'processing', 'completed']).toContain(jobStatus.data?.job.status);
      
      // Clean up
      if (jobStatus.data?.job.status !== 'completed') {
        await backgroundProcessor.cancelJob(backgroundJob.data!.id);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('Should handle cache storage limits gracefully', async () => {
      // Set very small cache limit
      await cacheManager.setCachePolicy({
        maxMemoryUsage: 1024, // 1KB limit
        maxCacheAge: 60000,
        evictionStrategy: 'LRU',
        compressionEnabled: false,
        compressionThreshold: 512,
        priorityThreshold: 5,
        autoOptimization: true,
        persistToDisk: false
      });
      
      // Try to cache large data that exceeds limit
      const largeData = new Blob([new ArrayBuffer(2048)]); // 2KB data
      const cacheResult = await cacheManager.cacheAudioSegment('large-item', largeData);
      
      // Should handle gracefully - either refuse to cache or evict other items
      expect(cacheResult.success).toBe(true);
      
      // Memory usage should respect the limit
      const memoryStats = await cacheManager.getMemoryStats();
      expect(memoryStats.data?.cacheUsage).toBeLessThanOrEqual(1024 * 1.1); // Allow 10% overhead
    });

    test('Should handle corrupted cache data', async () => {
      // Cache valid data
      const validData = new Blob(['valid audio data']);
      await cacheManager.cacheAudioSegment('valid-segment', validData);
      
      // Simulate cache corruption by trying to retrieve non-existent data
      const corruptedResult = await cacheManager.getCachedAudioSegment('non-existent-segment');
      expect(corruptedResult.success).toBe(true);
      expect(corruptedResult.data).toBeNull();
      
      // Cache should still function normally for valid data
      const validResult = await cacheManager.getCachedAudioSegment('valid-segment');
      expect(validResult.success).toBe(true);
      expect(validResult.data).not.toBeNull();
    });

    test('Should handle background processor job failures', async () => {
      // Create a job that will fail (empty text)
      const failedJobResult = await backgroundProcessor.processLargeDocument('', {
        priority: 5
      });
      
      expect(failedJobResult.success).toBe(true); // Job should be accepted
      
      // Monitor job status
      const jobId = failedJobResult.data!.id;
      let finalStatus;
      
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const statusResult = await backgroundProcessor.getProcessingStatus(jobId);
        
        if (statusResult.success && statusResult.data) {
          finalStatus = statusResult.data;
          if (finalStatus.job.status === 'failed' || finalStatus.job.status === 'completed') {
            break;
          }
        }
      }
      
      // Job should fail gracefully
      expect(finalStatus?.job.status).toBe('failed');
      expect(finalStatus?.job.error).toBeDefined();
      
      // Processor should still be functional for other jobs
      const validJobResult = await backgroundProcessor.processLargeDocument('Valid text content');
      expect(validJobResult.success).toBe(true);
    });

    test('Should handle performance monitoring under extreme load', async () => {
      // Start monitoring
      await performanceMonitor.startMonitoring(50); // Very frequent sampling
      
      // Generate extreme load
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(performanceMonitor.recordMetric({
          id: `load-test-${i}`,
          timestamp: Date.now() + i,
          type: 'processing_time',
          value: Math.random() * 1000,
          unit: 'ms'
        }));
      }
      
      // Wait for all metrics to be recorded
      await Promise.all(promises);
      
      // Stop monitoring
      await performanceMonitor.stopMonitoring();
      
      // System should still be responsive
      const analysisResult = await performanceMonitor.analyzePerformance();
      expect(analysisResult.success).toBe(true);
      
      // Should have recorded most metrics
      const metricsResult = await performanceMonitor.getMetrics();
      expect(metricsResult.data?.length).toBeGreaterThan(900); // Allow some loss under extreme load
    });
  });
});

// Test utilities
function getTestSeamManager() {
  // Return a test version of SeamManager with all performance seam components registered
  return {
    getCacheManager: () => new CacheManagerStub(),
    getPerformanceMonitor: () => new PerformanceMonitorStub(),
    getBackgroundProcessor: () => new BackgroundProcessorStub(),
    getTextAnalysisEngine: () => new TextAnalysisEngineStub(),
    getAudioGenerationPipeline: () => new AudioGenerationPipelineStub()
  };
}

// Custom Jest matchers for performance testing
expect.extend({
  toBeOneOf(received: unknown, array: unknown[]) {
    const pass = array.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${array}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${array}`,
        pass: false
      };
    }
  }
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(array: unknown[]): R;
    }
  }
}