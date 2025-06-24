import { 
  ISystemOrchestrator, 
  ContractResult, 
  AudioOutput, 
  ProcessingStatus, 
  ProcessingOptions 
} from '../../types/contracts';
import { SeamManager } from '../SeamManager';
import log from '../../utils/logger';

export class SystemOrchestrator implements ISystemOrchestrator {
  private currentStatus: ProcessingStatus = {
    stage: 'analyzing',
    progress: 0,
    message: 'Ready to process'
  };
  
  private isProcessing = false;
  private shouldCancel = false;

  async processStory(text: string, options?: ProcessingOptions): Promise<ContractResult<AudioOutput>> {
    if (this.isProcessing) {
      return {
        success: false,
        error: 'Processing already in progress'
      };
    }

    this.isProcessing = true;
    this.shouldCancel = false;
    const startTime = Date.now();
    log.info('Starting story processing', { textLength: text.length, options });

    try {
      const seamManager = SeamManager.getInstance();
      
      // Stage 1: Text Analysis
      this.updateStatus('analyzing', 10, 'Analyzing narrative structure...');
      if (this.shouldCancel) throw new Error('Processing cancelled');
      
      const textAnalysisEngine = seamManager.getTextAnalysisEngine();
      const parseResult = await textAnalysisEngine.parseText(text);
      
      if (!parseResult.success || !parseResult.data) {
        log.error('Text analysis failed', { error: parseResult.error, text });
        throw new Error(`Text analysis failed: ${parseResult.error}`);
      }
      
      const segments = parseResult.data;
      this.updateStatus('analyzing', 25, `Identified ${segments.length} text segments`);

      // Stage 2: Character Detection
      this.updateStatus('detecting', 40, 'Detecting characters and speakers...');
      if (this.shouldCancel) throw new Error('Processing cancelled');
      
      const characterDetectionSystem = seamManager.getCharacterDetectionSystem();
      const charactersResult = await characterDetectionSystem.detectCharacters(segments);
      
      if (!charactersResult.success || !charactersResult.data) {
        log.error('Character detection failed', { error: charactersResult.error, segments });
        throw new Error(`Character detection failed: ${charactersResult.error}`);
      }
      
      const characters = charactersResult.data;
      this.updateStatus('detecting', 55, `Found ${characters.length} unique characters`);

      // Stage 3: Voice Assignment
      this.updateStatus('assigning', 70, 'Assigning voices to characters...');
      if (this.shouldCancel) throw new Error('Processing cancelled');
      
      const voiceAssignmentLogic = seamManager.getVoiceAssignmentLogic();
      const voiceAssignmentsResult = await voiceAssignmentLogic.assignVoices(characters);
      
      if (!voiceAssignmentsResult.success || !voiceAssignmentsResult.data) {
        log.error('Voice assignment failed', { error: voiceAssignmentsResult.error, characters });
        throw new Error(`Voice assignment failed: ${voiceAssignmentsResult.error}`);
      }
      
      const voiceAssignments = voiceAssignmentsResult.data;
      this.updateStatus('assigning', 80, `Assigned ${voiceAssignments.length} unique voices`);

      // Stage 4: Audio Generation
      this.updateStatus('generating', 85, 'Generating audio segments...');
      if (this.shouldCancel) throw new Error('Processing cancelled');
      
      const audioGenerationPipeline = seamManager.getAudioGenerationPipeline();
      const audioSegments = [];
      
      // Create a voice lookup map
      const voiceMap = new Map(voiceAssignments.map(va => [va.character, va.voice]));
      
      // Generate audio for each segment
      for (let i = 0; i < segments.length; i++) {
        if (this.shouldCancel) throw new Error('Processing cancelled');
        
        const segment = segments[i];
        const voice = voiceMap.get(segment.speaker);
        
        if (!voice) {
          log.error('No voice assigned for character', { character: segment.speaker, segment });
          throw new Error(`No voice assigned for character: ${segment.speaker}`);
        }
        
        this.updateStatus('generating', 85 + (10 * i / segments.length), `Generating audio for segment ${i + 1}/${segments.length}...`, segment.speaker);
        
        const audioResult = await audioGenerationPipeline.generateSegmentAudio(segment, voice);
        
        if (!audioResult.success || !audioResult.data) {
          log.error('Audio generation failed for segment', { error: audioResult.error, segment, voice });
          throw new Error(`Audio generation failed for segment ${i + 1}: ${audioResult.error}`);
        }
        
        audioSegments.push(audioResult.data);
      }

      // Stage 5: Combine Audio
      this.updateStatus('generating', 95, 'Combining audio segments...');
      if (this.shouldCancel) throw new Error('Processing cancelled');
      
      const combinedAudioResult = await audioGenerationPipeline.combineAudioSegments(audioSegments);
      
      if (!combinedAudioResult.success || !combinedAudioResult.data) {
        log.error('Audio combination failed', { error: combinedAudioResult.error, audioSegmentsCount: audioSegments.length });
        throw new Error(`Audio combination failed: ${combinedAudioResult.error}`);
      }
      
      let finalAudio = combinedAudioResult.data;

      // Stage 6: Optimization (optional)
      if (options?.outputFormat === 'mp3' || audioSegments.length > 5) {
        this.updateStatus('generating', 98, 'Optimizing audio output...');
        if (this.shouldCancel) throw new Error('Processing cancelled');
        
        const optimizedResult = await audioGenerationPipeline.optimizeAudio(finalAudio.audioFile);
        if (optimizedResult.success && optimizedResult.data) {
          finalAudio = {
            ...finalAudio,
            audioFile: optimizedResult.data
          };
        } else if (!optimizedResult.success) {
          log.warn('Audio optimization failed, using unoptimized audio', { error: optimizedResult.error });
        }
      }

      // Complete
      this.updateStatus('complete', 100, 'Audiobook generation complete!');
      log.info('Story processing completed successfully', { processingTime: Date.now() - startTime, segments: segments.length, characters: characters.length });
      
      const processingTime = Date.now() - startTime;
      finalAudio.metadata.processingTime = processingTime;

      return {
        success: true,
        data: finalAudio,
        metadata: {
          processingTime,
          segments: segments.length,
          characters: characters.length,
          duration: finalAudio.duration
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      log.error('Error during story processing pipeline', { error, currentStatus: this.currentStatus });
      this.updateStatus('error', 0, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      this.isProcessing = false;
      this.shouldCancel = false;
    }
  }

  async getProcessingStatus(): Promise<ContractResult<ProcessingStatus>> {
    return {
      success: true,
      data: { ...this.currentStatus }
    };
  }

  async cancelProcessing(): Promise<ContractResult<boolean>> {
    if (!this.isProcessing) {
      return {
        success: false,
        error: 'No processing in progress to cancel'
      };
    }

    this.shouldCancel = true;
    log.info('Processing cancelled by user', { currentStatus: this.currentStatus });
    this.updateStatus('error', 0, 'Processing cancelled by user');
    
    return {
      success: true,
      data: true,
      metadata: { cancelledAt: Date.now() }
    };
  }

  private updateStatus(stage: ProcessingStatus['stage'], progress: number, message: string, currentItem?: string): void {
    this.currentStatus = {
      stage,
      progress,
      message,
      currentItem
    };
  }

  // Public method to check if processing is active
  public isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  // Public method to get current stage
  public getCurrentStage(): ProcessingStatus['stage'] {
    return this.currentStatus.stage;
  }
}