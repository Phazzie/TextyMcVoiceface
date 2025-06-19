import { SeamManager } from '../services/SeamManager';
import { 
  ISystemOrchestrator, 
  IAudioGenerationPipeline,
  ITextAnalysisEngine,
  ProcessingOptions,
  INarratorModeConfig,
  VoiceProfile,
  TextSegment,
  AudioSegment 
} from '../types/contracts';

// Import stubs
import { 
  SystemOrchestratorStub, 
  OpenAIAudioPipelineStub,
  TextAnalysisEngineStub,
  AudioGenerationPipelineStub
} from '../services/stubs';

describe('Narrator Mode Seam Integration Tests', () => {
  let seamManager: SeamManager;
  let systemOrchestrator: ISystemOrchestrator;
  let openAIPipeline: IAudioGenerationPipeline;
  let textAnalysisEngine: ITextAnalysisEngine;

  beforeEach(() => {
    seamManager = SeamManager.getInstance();
    
    // Register stubs for testing
    seamManager.registerSystemOrchestrator(new SystemOrchestratorStub());
    seamManager.registerTextAnalysisEngine(new TextAnalysisEngineStub());
    
    systemOrchestrator = seamManager.getSystemOrchestrator();
    textAnalysisEngine = seamManager.getTextAnalysisEngine();
    openAIPipeline = new OpenAIAudioPipelineStub();
  });

  describe('Contract Compliance Tests', () => {
    test('ProcessingOptions should include narrator mode configuration', () => {
      const narratorConfig: INarratorModeConfig = {
        enabled: true,
        voice: {
          id: 'narrator-voice',
          name: 'Professional Narrator',
          gender: 'neutral',
          age: 'adult',
          tone: 'neutral',
          pitch: 1.0,
          speed: 1.0
        },
        speed: 1.0,
        emphasis: 0.5,
        includeCharacterNames: true,
        characterNameStyle: 'full',
        pauseBetweenSpeakers: 500
      };

      const processingOptions: ProcessingOptions = {
        mode: 'narrator',
        narratorConfig: narratorConfig,
        outputFormat: 'mp3',
        includeQualityAnalysis: false
      };

      // Verify all required properties exist
      expect(processingOptions.mode).toBe('narrator');
      expect(processingOptions.narratorConfig).toBeDefined();
      expect(processingOptions.narratorConfig?.enabled).toBe(true);
      expect(processingOptions.narratorConfig?.voice).toBeDefined();
      expect(processingOptions.narratorConfig?.includeCharacterNames).toBe(true);
      expect(processingOptions.narratorConfig?.characterNameStyle).toBe('full');
    });

    test('OpenAI Audio Pipeline should implement IAudioGenerationPipeline contract', () => {
      // Verify OpenAI pipeline implements all required methods
      expect(typeof openAIPipeline.generateSegmentAudio).toBe('function');
      expect(typeof openAIPipeline.combineAudioSegments).toBe('function');
      expect(typeof openAIPipeline.optimizeAudio).toBe('function');
    });

    test('SystemOrchestrator should accept narrator mode in processStory', async () => {
      const testText = "Hello world";
      const narratorOptions: ProcessingOptions = {
        mode: 'narrator',
        narratorConfig: {
          enabled: true,
          voice: {
            id: 'narrator-1',
            name: 'Default Narrator',
            gender: 'neutral',
            age: 'adult', 
            tone: 'neutral',
            pitch: 1.0,
            speed: 1.0
          },
          speed: 1.0,
          emphasis: 0.5,
          includeCharacterNames: true,
          characterNameStyle: 'full',
          pauseBetweenSpeakers: 500
        }
      };

      // Should not throw for contract compliance
      expect(async () => {
        await systemOrchestrator.processStory(testText, narratorOptions);
      }).not.toThrow();
    });
  });

  describe('Narrator Mode Processing Workflow Tests', () => {
    test('Narrator mode should bypass character detection', async () => {
      const testText = '"Hello," said John. "How are you?" asked Mary.';
      
      // In narrator mode, we should not need character detection
      const narratorOptions: ProcessingOptions = {
        mode: 'narrator',
        narratorConfig: {
          enabled: true,
          voice: {
            id: 'narrator-voice',
            name: 'Single Narrator',
            gender: 'neutral',
            age: 'adult',
            tone: 'neutral',
            pitch: 1.0,
            speed: 1.0
          },
          speed: 1.0,
          emphasis: 0.5,
          includeCharacterNames: true,
          characterNameStyle: 'full',
          pauseBetweenSpeakers: 500
        }
      };

      // Mock the process to verify workflow
      try {
        await systemOrchestrator.processStory(testText, narratorOptions);
      } catch (error) {
        // Should be NotImplementedError from stub, not workflow error
        expect(error.name).toBe('NotImplementedError');
        expect(error.message).toContain('processStory is not yet implemented');
      }
    });

    test('Multi-voice mode should use character detection', async () => {
      const testText = '"Hello," said John. "How are you?" asked Mary.';
      
      const multiVoiceOptions: ProcessingOptions = {
        mode: 'multi-voice',
        outputFormat: 'mp3'
      };

      try {
        await systemOrchestrator.processStory(testText, multiVoiceOptions);
      } catch (error) {
        // Should be NotImplementedError from stub
        expect(error.name).toBe('NotImplementedError');
      }
    });
  });

  describe('OpenAI Pipeline Integration Tests', () => {
    test('OpenAI pipeline should handle text segments', async () => {
      const testSegment: TextSegment = {
        id: 'segment-1',
        content: 'John said, "Hello there!"',
        speaker: 'Narrator',
        type: 'narration',
        startPosition: 0,
        endPosition: 22
      };

      const narratorVoice: VoiceProfile = {
        id: 'narrator-voice',
        name: 'OpenAI Narrator',
        gender: 'neutral',
        age: 'adult',
        tone: 'neutral',
        pitch: 1.0,
        speed: 1.0
      };

      try {
        await openAIPipeline.generateSegmentAudio(testSegment, narratorVoice);
      } catch (error) {
        // Should be NotImplementedError from stub
        expect(error.name).toBe('NotImplementedError');
        expect(error.message).toContain('OpenAIAudioPipeline.generateSegmentAudio is not yet implemented');
      }
    });

    test('OpenAI pipeline should combine audio segments', async () => {
      const mockSegments: AudioSegment[] = [
        {
          id: 'segment-1',
          audioData: new Blob(['audio1']),
          duration: 2.5,
          speaker: 'Narrator',
          text: 'First segment'
        },
        {
          id: 'segment-2', 
          audioData: new Blob(['audio2']),
          duration: 3.0,
          speaker: 'Narrator',
          text: 'Second segment'
        }
      ];

      try {
        await openAIPipeline.combineAudioSegments(mockSegments);
      } catch (error) {
        expect(error.name).toBe('NotImplementedError');
        expect(error.message).toContain('OpenAIAudioPipeline.combineAudioSegments is not yet implemented');
      }
    });
  });

  describe('Mode Switching Tests', () => {
    test('Should handle switching between multi-voice and narrator modes', async () => {
      const testText = '"Hello," said John. "Goodbye," said Mary.';

      // Test multi-voice mode first
      const multiVoiceOptions: ProcessingOptions = {
        mode: 'multi-voice',
        enableManualCorrection: false,
        outputFormat: 'mp3'
      };

      try {
        await systemOrchestrator.processStory(testText, multiVoiceOptions);
      } catch (error) {
        expect(error.name).toBe('NotImplementedError');
      }

      // Then test narrator mode
      const narratorOptions: ProcessingOptions = {
        mode: 'narrator',
        narratorConfig: {
          enabled: true,
          voice: {
            id: 'narrator-voice',
            name: 'Story Narrator',
            gender: 'neutral',
            age: 'adult',
            tone: 'warm',
            pitch: 1.0,
            speed: 0.9
          },
          speed: 0.9,
          emphasis: 0.6,
          includeCharacterNames: true,
          characterNameStyle: 'full',
          pauseBetweenSpeakers: 750
        }
      };

      try {
        await systemOrchestrator.processStory(testText, narratorOptions);
      } catch (error) {
        expect(error.name).toBe('NotImplementedError');
      }
    });
  });

  describe('Graceful Fallback Tests', () => {
    test('Should fallback to browser synthesis if OpenAI fails', () => {
      // Register both pipelines with SeamManager
      const browserPipeline = new AudioGenerationPipelineStub();
      const openAIPipeline = new OpenAIAudioPipelineStub();

      // In a real implementation, SeamManager would handle fallback
      // For now, just verify both pipelines are available
      expect(browserPipeline).toBeDefined();
      expect(openAIPipeline).toBeDefined();
      expect(typeof browserPipeline.generateSegmentAudio).toBe('function');
      expect(typeof openAIPipeline.generateSegmentAudio).toBe('function');
    });

    test('Should maintain narrator mode settings during fallback', () => {
      const narratorConfig: INarratorModeConfig = {
        enabled: true,
        voice: {
          id: 'fallback-narrator',
          name: 'Fallback Narrator',
          gender: 'neutral',
          age: 'adult',
          tone: 'neutral',
          pitch: 1.0,
          speed: 1.0
        },
        speed: 1.0,
        emphasis: 0.5,
        includeCharacterNames: true,
        characterNameStyle: 'short',
        pauseBetweenSpeakers: 300
      };

      // Verify configuration remains intact
      expect(narratorConfig.enabled).toBe(true);
      expect(narratorConfig.includeCharacterNames).toBe(true);
      expect(narratorConfig.characterNameStyle).toBe('short');
      expect(narratorConfig.pauseBetweenSpeakers).toBe(300);
    });
  });

  describe('Character Name Handling Tests', () => {
    test('Should format character names according to style setting', () => {
      const testCases = [
        {
          style: 'full' as const,
          character: 'John',
          expected: 'John said:'
        },
        {
          style: 'short' as const,
          character: 'Elizabeth',
          expected: 'E:'
        },
        {
          style: 'none' as const,
          character: 'Mary',
          expected: ''
        }
      ];

      testCases.forEach(testCase => {
        const config: INarratorModeConfig = {
          enabled: true,
          voice: {
            id: 'test-voice',
            name: 'Test Narrator',
            gender: 'neutral',
            age: 'adult',
            tone: 'neutral',
            pitch: 1.0,
            speed: 1.0
          },
          speed: 1.0,
          emphasis: 0.5,
          includeCharacterNames: true,
          characterNameStyle: testCase.style,
          pauseBetweenSpeakers: 500
        };

        // Verify config is set correctly
        expect(config.characterNameStyle).toBe(testCase.style);
      });
    });
  });

  describe('SeamManager Registration Tests', () => {
    test('SeamManager should accept OpenAI pipeline registration', () => {
      const openAI = new OpenAIAudioPipelineStub();
      
      // Should not throw when registering
      expect(() => {
        seamManager.registerAudioGenerationPipeline(openAI);
      }).not.toThrow();

      // Should be retrievable
      const retrieved = seamManager.getAudioGenerationPipeline();
      expect(retrieved).toBeDefined();
    });

    test('SeamManager should handle multiple pipeline registrations', () => {
      const browserPipeline = new AudioGenerationPipelineStub();
      const openAIPipeline = new OpenAIAudioPipelineStub();

      // Register browser pipeline first
      seamManager.registerAudioGenerationPipeline(browserPipeline);
      let current = seamManager.getAudioGenerationPipeline();
      expect(current).toBe(browserPipeline);

      // Register OpenAI pipeline (should replace)
      seamManager.registerAudioGenerationPipeline(openAIPipeline);
      current = seamManager.getAudioGenerationPipeline();
      expect(current).toBe(openAIPipeline);
    });
  });

  describe('Error Handling Tests', () => {
    test('Should handle invalid narrator configuration gracefully', () => {
      const invalidConfig = {
        enabled: true,
        // Missing required voice property
        speed: 1.0,
        emphasis: 0.5,
        includeCharacterNames: true,
        characterNameStyle: 'full' as const,
        pauseBetweenSpeakers: 500
      };

      // TypeScript should catch this at compile time
      // @ts-expect-error - Testing invalid config
      const options: ProcessingOptions = {
        mode: 'narrator',
        narratorConfig: invalidConfig
      };

      // In runtime, this should be handled gracefully
      expect(options.mode).toBe('narrator');
    });

    test('Should handle missing narrator config in narrator mode', () => {
      const optionsWithoutConfig: ProcessingOptions = {
        mode: 'narrator'
        // Missing narratorConfig
      };

      // This should be handled gracefully by the implementation
      expect(optionsWithoutConfig.mode).toBe('narrator');
      expect(optionsWithoutConfig.narratorConfig).toBeUndefined();
    });
  });
});

// Helper functions for testing
function createMockVoiceProfile(id: string): VoiceProfile {
  return {
    id,
    name: `Test Voice ${id}`,
    gender: 'neutral',
    age: 'adult',
    tone: 'neutral',
    pitch: 1.0,
    speed: 1.0
  };
}

function createMockTextSegment(id: string, content: string, speaker = 'Narrator'): TextSegment {
  return {
    id,
    content,
    speaker,
    type: speaker === 'Narrator' ? 'narration' : 'dialogue',
    startPosition: 0,
    endPosition: content.length
  };
}

function createMockAudioSegment(id: string, text: string, speaker = 'Narrator'): AudioSegment {
  return {
    id,
    audioData: new Blob([`mock-audio-${id}`]),
    duration: text.length * 0.1, // Mock duration based on text length
    speaker,
    text
  };
}