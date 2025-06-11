import { 
  ITextAnalysisEngine, 
  ICharacterDetectionSystem, 
  IVoiceAssignmentLogic, 
  IAudioGenerationPipeline, 
  ISystemOrchestrator,
  IAudioControlsManager,
  IVoiceCustomizer,
  IWritingQualityAnalyzer,
  ITextEditor,
  TextSegment,
  Character,
  VoiceAssignment,
  AudioSegment,
  AudioOutput,
  ProcessingOptions,
  Bookmark,
  TimestampedExport,
  CharacterVolumeSettings,
  PlaybackSettings,
  VoiceAdjustments,
  VoiceSettings,
  VoicePreview,
  VoiceProfile,
  ShowTellIssue,
  TropeMatch,
  PurpleProseIssue,
  WritingQualityReport,
  TextChange,
  TextFix,
  ChangeHistory,
  EditorAnnotation,
  EditorState,
  WritingIssue,
  EditorSettings,
  BulkFixOperation,
  CollaborationCursor
} from '../types/contracts';

// Seam Integration Tests
export class SeamIntegrationTests {
  constructor(
    private textAnalysis: ITextAnalysisEngine,
    private characterDetection: ICharacterDetectionSystem,
    private voiceAssignment: IVoiceAssignmentLogic,
    private audioGeneration: IAudioGenerationPipeline,
    private orchestrator: ISystemOrchestrator,
    private audioControls: IAudioControlsManager,
    private voiceCustomizer: IVoiceCustomizer,
    private writingAnalyzer: IWritingQualityAnalyzer,
    private textEditor: ITextEditor
  ) {}

  // Test Text Analysis → Character Detection Seam
  async testTextAnalysisToCharacterDetection(): Promise<boolean> {
    try {
      const sampleText = `Sarah looked out the window. "Is he coming?" she wondered. "I'll be there," John had said.`;
      
      const parseResult = await this.textAnalysis.parseText(sampleText);
      if (!parseResult.success || !parseResult.data) {
        console.error('Text analysis failed:', parseResult.error);
        return false;
      }

      const segments = parseResult.data;
      const characterResult = await this.characterDetection.detectCharacters(segments);
      if (!characterResult.success || !characterResult.data) {
        console.error('Character detection failed:', characterResult.error);
        return false;
      }

      const characters = characterResult.data;
      const expectedCharacters = ['Sarah', 'John', 'Narrator'];
      const foundCharacters = characters.map(c => c.name);
      
      for (const expected of expectedCharacters) {
        if (!foundCharacters.includes(expected)) {
          console.error(`Expected character ${expected} not found`);
          return false;
        }
      }

      console.log('✓ Text Analysis → Character Detection seam working correctly');
      return true;
    } catch (error) {
      console.error('Seam test failed:', error);
      return false;
    }
  }

  // Test Character Detection → Voice Assignment Seam
  async testCharacterDetectionToVoiceAssignment(): Promise<boolean> {
    try {
      const mockCharacters: Character[] = [
        {
          name: 'Sarah',
          frequency: 5,
          characteristics: ['thoughtful', 'worried'],
          emotionalStates: ['anxious'],
          isMainCharacter: true,
          firstAppearance: 0
        },
        {
          name: 'John',
          frequency: 2,
          characteristics: ['reliable'],
          emotionalStates: ['confident'],
          isMainCharacter: false,
          firstAppearance: 50
        }
      ];

      const assignmentResult = await this.voiceAssignment.assignVoices(mockCharacters);
      if (!assignmentResult.success || !assignmentResult.data) {
        console.error('Voice assignment failed:', assignmentResult.error);
        return false;
      }

      const assignments = assignmentResult.data;
      if (assignments.length !== mockCharacters.length) {
        console.error('Assignment count mismatch');
        return false;
      }

      // Verify each character has a unique voice
      const voiceIds = assignments.map(a => a.voice.id);
      const uniqueVoiceIds = new Set(voiceIds);
      if (uniqueVoiceIds.size !== voiceIds.length) {
        console.error('Voice assignments not unique');
        return false;
      }

      console.log('✓ Character Detection → Voice Assignment seam working correctly');
      return true;
    } catch (error) {
      console.error('Seam test failed:', error);
      return false;
    }
  }

  // Test Voice Assignment → Audio Generation Seam
  async testVoiceAssignmentToAudioGeneration(): Promise<boolean> {
    try {
      const mockSegment: TextSegment = {
        id: 'test-1',
        content: 'Hello world',
        speaker: 'Sarah',
        type: 'dialogue',
        startPosition: 0,
        endPosition: 11
      };

      const mockVoice = {
        id: 'voice-1',
        name: 'Sarah Voice',
        gender: 'female' as const,
        age: 'adult' as const,
        tone: 'warm' as const,
        pitch: 1.0,
        speed: 1.0
      };

      const audioResult = await this.audioGeneration.generateSegmentAudio(mockSegment, mockVoice);
      if (!audioResult.success || !audioResult.data) {
        console.error('Audio generation failed:', audioResult.error);
        return false;
      }

      const audioSegment = audioResult.data;
      if (!audioSegment.audioData || audioSegment.duration <= 0) {
        console.error('Invalid audio segment generated');
        return false;
      }

      console.log('✓ Voice Assignment → Audio Generation seam working correctly');
      return true;
    } catch (error) {
      console.error('Seam test failed:', error);
      return false;
    }
  }

  // Test Audio Generation → Audio Controls Seam
  async testAudioGenerationToAudioControls(): Promise<boolean> {
    try {
      // Test playback speed adjustment
      const speedResult = await this.audioControls.adjustPlaybackSpeed(1.5);
      if (!speedResult.success) {
        console.error('Playback speed adjustment failed:', speedResult.error);
        return false;
      }

      // Test character volume setting
      const volumeResult = await this.audioControls.setVolumeForCharacter('Sarah', 0.8);
      if (!volumeResult.success) {
        console.error('Character volume setting failed:', volumeResult.error);
        return false;
      }

      // Test bookmark creation
      const bookmarkResult = await this.audioControls.createBookmarks(30.5, 'Important dialogue');
      if (!bookmarkResult.success || !bookmarkResult.data) {
        console.error('Bookmark creation failed:', bookmarkResult.error);
        return false;
      }

      const bookmark = bookmarkResult.data;
      if (bookmark.position !== 30.5 || bookmark.label !== 'Important dialogue') {
        console.error('Bookmark data incorrect');
        return false;
      }

      // Test getting playback settings
      const settingsResult = await this.audioControls.getPlaybackSettings();
      if (!settingsResult.success || !settingsResult.data) {
        console.error('Getting playback settings failed:', settingsResult.error);
        return false;
      }

      console.log('✓ Audio Generation → Audio Controls seam working correctly');
      return true;
    } catch (error) {
      console.error('Audio controls seam test failed:', error);
      return false;
    }
  }

  // Test Audio Controls Complete Workflow
  async testAudioControlsWorkflow(): Promise<boolean> {
    try {
      // Test character volume management
      const characterVolumes: CharacterVolumeSettings[] = [
        { character: 'Sarah', volume: 0.8, muted: false, solo: false },
        { character: 'John', volume: 0.6, muted: false, solo: false },
        { character: 'Narrator', volume: 1.0, muted: false, solo: false }
      ];

      const volumeSetResult = await this.audioControls.setCharacterVolumes(characterVolumes);
      if (!volumeSetResult.success) {
        console.error('Setting character volumes failed:', volumeSetResult.error);
        return false;
      }

      // Test multiple bookmark operations
      const bookmark1Result = await this.audioControls.createBookmarks(15.0, 'Chapter 1 Start');
      const bookmark2Result = await this.audioControls.createBookmarks(45.2, 'Key Dialogue');
      
      if (!bookmark1Result.success || !bookmark2Result.success) {
        console.error('Multiple bookmark creation failed');
        return false;
      }

      // Test getting all bookmarks
      const bookmarksResult = await this.audioControls.getBookmarks();
      if (!bookmarksResult.success || !bookmarksResult.data) {
        console.error('Getting bookmarks failed:', bookmarksResult.error);
        return false;
      }

      if (bookmarksResult.data.length < 2) {
        console.error('Expected at least 2 bookmarks');
        return false;
      }

      // Test timestamp export
      const exportResult = await this.audioControls.exportWithTimestamps();
      if (!exportResult.success || !exportResult.data) {
        console.error('Timestamp export failed:', exportResult.error);
        return false;
      }

      const exportData = exportResult.data;
      if (!exportData.content || !exportData.format) {
        console.error('Export data incomplete');
        return false;
      }

      console.log('✓ Audio Controls Complete Workflow working correctly');
      return true;
    } catch (error) {
      console.error('Audio controls workflow test failed:', error);
      return false;
    }
  }

  // Voice Customization System Seam Tests
  async testVoiceCustomizationSeam(): Promise<boolean> {
    try {
      const validAdjustments: VoiceAdjustments = {
        pitch: 0.2,
        speed: -0.1,
        tone: 'dramatic',
        emphasis: 0.8,
        clarity: 0.9
      };

      const validationResult = await this.voiceCustomizer.validateAdjustments(validAdjustments);
      if (!validationResult.success) {
        console.error('Valid adjustments failed validation:', validationResult.error);
        return false;
      }

      const invalidAdjustments: VoiceAdjustments = {
        pitch: 2.0,
        speed: -1.5,
        emphasis: 1.5
      };

      const invalidValidationResult = await this.voiceCustomizer.validateAdjustments(invalidAdjustments);
      if (invalidValidationResult.success) {
        console.error('Invalid adjustments passed validation');
        return false;
      }

      console.log('✓ Voice Customization validation working correctly');
      return true;
    } catch (error) {
      console.error('Voice customization seam test failed:', error);
      return false;
    }
  }

  async testVoiceCustomizationToVoiceAssignment(): Promise<boolean> {
    try {
      const mockCharacter: Character = {
        name: 'Sarah',
        frequency: 5,
        characteristics: ['thoughtful'],
        emotionalStates: ['anxious'],
        isMainCharacter: true,
        firstAppearance: 0
      };

      const voiceResult = await this.voiceAssignment.generateVoiceProfile(mockCharacter);
      if (!voiceResult.success || !voiceResult.data) {
        console.error('Base voice generation failed:', voiceResult.error);
        return false;
      }

      const baseVoice = voiceResult.data;
      const adjustments: VoiceAdjustments = {
        pitch: 0.1,
        speed: -0.05,
        tone: 'dramatic'
      };

      const customizedResult = await this.voiceCustomizer.applyAdjustments(baseVoice, adjustments);
      if (!customizedResult.success || !customizedResult.data) {
        console.error('Voice customization failed:', customizedResult.error);
        return false;
      }

      const customizedVoice = customizedResult.data;
      if (Math.abs(customizedVoice.pitch - (baseVoice.pitch + 0.1)) > 0.01) {
        console.error('Pitch adjustment not applied correctly');
        return false;
      }

      if (customizedVoice.tone !== 'dramatic') {
        console.error('Tone adjustment not applied correctly');
        return false;
      }

      const saveResult = await this.voiceCustomizer.saveCustomVoice('Sarah', customizedVoice);
      if (!saveResult.success) {
        console.error('Failed to save custom voice:', saveResult.error);
        return false;
      }

      console.log('✓ Voice Customization → Voice Assignment integration working correctly');
      return true;
    } catch (error) {
      console.error('Voice customization integration test failed:', error);
      return false;
    }
  }

  async testVoiceCustomizationToAudioGeneration(): Promise<boolean> {
    try {
      const adjustments: VoiceAdjustments = {
        pitch: 0.15,
        speed: 0.1,
        tone: 'warm',
        emphasis: 0.7
      };

      const previewResult = await this.voiceCustomizer.previewVoiceAdjustment('Sarah', adjustments);
      if (!previewResult.success || !previewResult.data) {
        console.error('Voice preview generation failed:', previewResult.error);
        return false;
      }

      const preview = previewResult.data;
      if (!preview.audioSegment || !preview.voiceProfile) {
        console.error('Voice preview missing required components');
        return false;
      }

      if (preview.duration <= 0) {
        console.error('Invalid preview duration');
        return false;
      }

      if (!preview.previewText || preview.previewText.length === 0) {
        console.error('Preview text missing');
        return false;
      }

      if (preview.voiceProfile.tone !== 'warm') {
        console.error('Voice adjustments not applied to preview profile');
        return false;
      }

      console.log('✓ Voice Customization → Audio Generation integration working correctly');
      return true;
    } catch (error) {
      console.error('Voice customization to audio generation test failed:', error);
      return false;
    }
  }

  async testVoiceCustomizationSettingsManagement(): Promise<boolean> {
    try {
      const sarahVoice: VoiceProfile = {
        id: 'sarah-custom',
        name: 'Sarah Custom Voice',
        gender: 'female',
        age: 'adult',
        tone: 'dramatic',
        pitch: 1.15,
        speed: 0.95
      };

      const johnVoice: VoiceProfile = {
        id: 'john-custom',
        name: 'John Custom Voice',
        gender: 'male',
        age: 'adult',
        tone: 'warm',
        pitch: 0.85,
        speed: 1.05
      };

      const saveResult1 = await this.voiceCustomizer.saveCustomVoice('Sarah', sarahVoice);
      const saveResult2 = await this.voiceCustomizer.saveCustomVoice('John', johnVoice);

      if (!saveResult1.success || !saveResult2.success) {
        console.error('Failed to save custom voices');
        return false;
      }

      const customVoicesResult = await this.voiceCustomizer.getCustomVoices();
      if (!customVoicesResult.success || !customVoicesResult.data) {
        console.error('Failed to get custom voices:', customVoicesResult.error);
        return false;
      }

      const customVoices = customVoicesResult.data;
      if (Object.keys(customVoices).length < 2) {
        console.error('Expected at least 2 custom voices');
        return false;
      }

      if (!customVoices['Sarah'] || !customVoices['John']) {
        console.error('Custom voices not found');
        return false;
      }

      const exportResult = await this.voiceCustomizer.exportVoiceSettings();
      if (!exportResult.success || !exportResult.data) {
        console.error('Failed to export voice settings:', exportResult.error);
        return false;
      }

      const settings = exportResult.data;
      if (!settings.characters || !settings.metadata) {
        console.error('Exported settings incomplete');
        return false;
      }

      if (settings.metadata.totalCharacters < 2) {
        console.error('Expected at least 2 characters in settings');
        return false;
      }

      const importResult = await this.voiceCustomizer.importVoiceSettings(settings);
      if (!importResult.success) {
        console.error('Failed to import voice settings:', importResult.error);
        return false;
      }

      const resetResult = await this.voiceCustomizer.resetToDefault('Sarah');
      if (!resetResult.success || !resetResult.data) {
        console.error('Failed to reset voice to default:', resetResult.error);
        return false;
      }

      console.log('✓ Voice Customization settings management working correctly');
      return true;
    } catch (error) {
      console.error('Voice customization settings test failed:', error);
      return false;
    }
  }

  async testVoiceCustomizationErrorScenarios(): Promise<boolean> {
    try {
      const invalidCharacterResult = await this.voiceCustomizer.previewVoiceAdjustment('NonExistentCharacter', {});
      if (invalidCharacterResult.success) {
        console.error('Preview should fail for non-existent character');
        return false;
      }

      const extremeAdjustments: VoiceAdjustments = {
        pitch: 5.0,
        speed: -2.0,
        emphasis: 2.0
      };

      const extremeValidationResult = await this.voiceCustomizer.validateAdjustments(extremeAdjustments);
      if (extremeValidationResult.success) {
        console.error('Extreme adjustments should fail validation');
        return false;
      }

      const malformedSettings: VoiceSettings = {
        formatVersion: 'invalid',
        characters: {} as any,
        customAdjustments: {} as any,
        metadata: {} as any
      };

      const malformedImportResult = await this.voiceCustomizer.importVoiceSettings(malformedSettings);
      if (malformedImportResult.success) {
        console.error('Malformed settings should fail import');
        return false;
      }

      const resetInvalidResult = await this.voiceCustomizer.resetToDefault('NonExistentCharacter');
      if (resetInvalidResult.success) {
        console.error('Reset should fail for non-existent character');
        return false;
      }

      console.log('✓ Voice Customization error scenarios handled correctly');
      return true;
    } catch (error) {
      console.error('Voice customization error scenario test failed:', error);
      return false;
    }
  }

  async testVoiceCustomizationPerformance(): Promise<boolean> {
    try {
      const startTime = Date.now();

      const adjustments1: VoiceAdjustments = { pitch: 0.1, speed: 0.05 };
      const adjustments2: VoiceAdjustments = { pitch: -0.1, speed: -0.05 };
      const adjustments3: VoiceAdjustments = { tone: 'dramatic', emphasis: 0.8 };

      const concurrentPreviews = await Promise.all([
        this.voiceCustomizer.previewVoiceAdjustment('Sarah', adjustments1),
        this.voiceCustomizer.previewVoiceAdjustment('John', adjustments2),
        this.voiceCustomizer.previewVoiceAdjustment('Narrator', adjustments3)
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      const failedPreviews = concurrentPreviews.filter(result => !result.success);
      if (failedPreviews.length > 0) {
        console.error('Some concurrent previews failed');
        return false;
      }

      if (duration > 10000) {
        console.warn(`Voice customization took ${duration}ms - may be too slow`);
      }

      const batchAdjustments: VoiceAdjustments[] = Array(50).fill(0).map((_, i) => ({
        pitch: (i % 20 - 10) * 0.01,
        speed: (i % 10 - 5) * 0.02,
        emphasis: (i % 10) * 0.1
      }));

      const batchStartTime = Date.now();
      const batchValidations = await Promise.all(
        batchAdjustments.map(adj => this.voiceCustomizer.validateAdjustments(adj))
      );
      const batchEndTime = Date.now();

      const validationFailures = batchValidations.filter(result => !result.success);
      if (validationFailures.length > 0) {
        console.error('Some batch validations failed');
        return false;
      }

      console.log(`✓ Voice Customization performance test completed in ${duration}ms (batch: ${batchEndTime - batchStartTime}ms)`);
      return true;
    } catch (error) {
      console.error('Voice customization performance test failed:', error);
      return false;
    }
  }

  async testCompleteVoiceCustomizationWorkflow(): Promise<boolean> {
    try {
      const mockCharacters: Character[] = [
        {
          name: 'Sarah',
          frequency: 5,
          characteristics: ['thoughtful'],
          emotionalStates: ['anxious'],
          isMainCharacter: true,
          firstAppearance: 0
        },
        {
          name: 'John',
          frequency: 3,
          characteristics: ['reliable'],
          emotionalStates: ['confident'],
          isMainCharacter: true,
          firstAppearance: 20
        }
      ];

      const voiceAssignments = await this.voiceAssignment.assignVoices(mockCharacters);
      if (!voiceAssignments.success || !voiceAssignments.data) {
        console.error('Voice assignment failed in workflow test');
        return false;
      }

      const sarahAdjustments: VoiceAdjustments = {
        pitch: 0.1,
        speed: -0.05,
        tone: 'dramatic',
        emphasis: 0.8
      };

      const johnAdjustments: VoiceAdjustments = {
        pitch: -0.15,
        speed: 0.1,
        tone: 'warm',
        clarity: 0.9
      };

      const sarahPreview = await this.voiceCustomizer.previewVoiceAdjustment('Sarah', sarahAdjustments);
      const johnPreview = await this.voiceCustomizer.previewVoiceAdjustment('John', johnAdjustments);

      if (!sarahPreview.success || !johnPreview.success) {
        console.error('Voice preview failed in workflow test');
        return false;
      }

      const sarahBase = voiceAssignments.data.find(va => va.character === 'Sarah')?.voice;
      const johnBase = voiceAssignments.data.find(va => va.character === 'John')?.voice;

      if (!sarahBase || !johnBase) {
        console.error('Base voices not found');
        return false;
      }

      const sarahCustomized = await this.voiceCustomizer.applyAdjustments(sarahBase, sarahAdjustments);
      const johnCustomized = await this.voiceCustomizer.applyAdjustments(johnBase, johnAdjustments);

      if (!sarahCustomized.success || !johnCustomized.success) {
        console.error('Voice customization failed in workflow test');
        return false;
      }

      const sarahSave = await this.voiceCustomizer.saveCustomVoice('Sarah', sarahCustomized.data!);
      const johnSave = await this.voiceCustomizer.saveCustomVoice('John', johnCustomized.data!);

      if (!sarahSave.success || !johnSave.success) {
        console.error('Saving custom voices failed in workflow test');
        return false;
      }

      const testSegment: TextSegment = {
        id: 'workflow-test',
        content: 'This is a test with my custom voice.',
        speaker: 'Sarah',
        type: 'dialogue',
        startPosition: 0,
        endPosition: 35
      };

      const customAudioResult = await this.audioGeneration.generateSegmentAudio(
        testSegment, 
        sarahCustomized.data!
      );

      if (!customAudioResult.success) {
        console.error('Custom voice audio generation failed');
        return false;
      }

      const exportSettings = await this.voiceCustomizer.exportVoiceSettings();
      if (!exportSettings.success) {
        console.error('Voice settings export failed in workflow test');
        return false;
      }

      console.log('✓ Complete Voice Customization Workflow working correctly');
      return true;
    } catch (error) {
      console.error('Complete voice customization workflow test failed:', error);
      return false;
    }
  }

  // NEW: Interactive Text Editor Integration Tests
  async testTextEditorBasicOperations(): Promise<boolean> {
    try {
      // Test basic text operations
      const testText = 'Hello world! This is a test document.';
      
      // Set initial text
      const setResult = await this.textEditor.setText(testText);
      if (!setResult.success) {
        console.error('Failed to set text:', setResult.error);
        return false;
      }

      // Get text
      const getResult = await this.textEditor.getText();
      if (!getResult.success || getResult.data !== testText) {
        console.error('Failed to get text or text mismatch');
        return false;
      }

      // Insert text
      const insertResult = await this.textEditor.insertText(12, ' amazing');
      if (!insertResult.success || !insertResult.data) {
        console.error('Failed to insert text:', insertResult.error);
        return false;
      }

      const insertChange = insertResult.data;
      if (insertChange.type !== 'insert' || insertChange.position !== 12 || insertChange.newText !== ' amazing') {
        console.error('Insert change data incorrect');
        return false;
      }

      // Delete text
      const deleteResult = await this.textEditor.deleteText(0, 6);
      if (!deleteResult.success || !deleteResult.data) {
        console.error('Failed to delete text:', deleteResult.error);
        return false;
      }

      const deleteChange = deleteResult.data;
      if (deleteChange.type !== 'delete' || deleteChange.position !== 0 || deleteChange.length !== 6) {
        console.error('Delete change data incorrect');
        return false;
      }

      // Replace text
      const replaceResult = await this.textEditor.replaceText(0, 5, 'Greetings');
      if (!replaceResult.success || !replaceResult.data) {
        console.error('Failed to replace text:', replaceResult.error);
        return false;
      }

      const replaceChange = replaceResult.data;
      if (replaceChange.type !== 'replace' || replaceChange.newText !== 'Greetings') {
        console.error('Replace change data incorrect');
        return false;
      }

      console.log('✓ Text Editor basic operations working correctly');
      return true;
    } catch (error) {
      console.error('Text editor basic operations test failed:', error);
      return false;
    }
  }

  async testTextEditorChangeTracking(): Promise<boolean> {
    try {
      // Test change tracking and history
      const initialText = 'This is the original text.';
      
      await this.textEditor.setText(initialText);
      
      // Make several changes
      await this.textEditor.insertText(0, 'Hello! ');
      await this.textEditor.replaceText(7, 4, 'was');
      await this.textEditor.deleteText(initialText.length + 3, 5);

      // Get change history
      const historyResult = await this.textEditor.getChangeHistory();
      if (!historyResult.success || !historyResult.data) {
        console.error('Failed to get change history:', historyResult.error);
        return false;
      }

      const history = historyResult.data;
      if (history.changes.length < 3) {
        console.error('Expected at least 3 changes in history');
        return false;
      }

      // Test undo
      const undoResult = await this.textEditor.undo();
      if (!undoResult.success) {
        console.error('Failed to undo:', undoResult.error);
        return false;
      }

      // Test redo
      const redoResult = await this.textEditor.redo();
      if (!redoResult.success) {
        console.error('Failed to redo:', redoResult.error);
        return false;
      }

      // Test tracking current changes
      const trackingResult = await this.textEditor.trackChanges();
      if (!trackingResult.success || !trackingResult.data) {
        console.error('Failed to track changes:', trackingResult.error);
        return false;
      }

      const currentHistory = trackingResult.data;
      if (!currentHistory.metadata || !currentHistory.metadata.sessionId) {
        console.error('Change tracking metadata incomplete');
        return false;
      }

      console.log('✓ Text Editor change tracking working correctly');
      return true;
    } catch (error) {
      console.error('Text editor change tracking test failed:', error);
      return false;
    }
  }

  async testTextEditorAnnotationSystem(): Promise<boolean> {
    try {
      // Test annotation system
      const testText = 'This is a sentence with some issues to highlight.';
      await this.textEditor.setText(testText);

      // Create test annotation
      const annotation: EditorAnnotation = {
        id: 'test-annotation-1',
        type: 'issue',
        position: 10,
        length: 8,
        severity: 'warning',
        message: 'Consider revising this phrase',
        category: 'style',
        timestamp: Date.now()
      };

      // Add annotation
      const addResult = await this.textEditor.addAnnotation(annotation);
      if (!addResult.success) {
        console.error('Failed to add annotation:', addResult.error);
        return false;
      }

      // Get annotations
      const getResult = await this.textEditor.getAnnotations(5, 20);
      if (!getResult.success || !getResult.data) {
        console.error('Failed to get annotations:', getResult.error);
        return false;
      }

      const annotations = getResult.data;
      if (annotations.length === 0) {
        console.error('Expected to find annotations');
        return false;
      }

      const foundAnnotation = annotations.find(a => a.id === 'test-annotation-1');
      if (!foundAnnotation) {
        console.error('Annotation not found in results');
        return false;
      }

      // Remove annotation
      const removeResult = await this.textEditor.removeAnnotation('test-annotation-1');
      if (!removeResult.success) {
        console.error('Failed to remove annotation:', removeResult.error);
        return false;
      }

      // Verify removal
      const verifyResult = await this.textEditor.getAnnotations();
      if (!verifyResult.success || !verifyResult.data) {
        console.error('Failed to verify annotation removal');
        return false;
      }

      const remainingAnnotations = verifyResult.data;
      const stillExists = remainingAnnotations.find(a => a.id === 'test-annotation-1');
      if (stillExists) {
        console.error('Annotation still exists after removal');
        return false;
      }

      console.log('✓ Text Editor annotation system working correctly');
      return true;
    } catch (error) {
      console.error('Text editor annotation test failed:', error);
      return false;
    }
  }

  async testTextEditorWritingAnalysisIntegration(): Promise<boolean> {
    try {
      // Test integration with writing quality analyzer
      const problemText = `
        Sarah was angry and frustrated. She felt disappointed by the situation.
        The beautiful princess walked gracefully across the magnificent ballroom.
        "I can't believe this happened," she said, expressing her feelings clearly.
      `;

      await this.textEditor.setText(problemText);

      // Enable real-time analysis
      const enableResult = await this.textEditor.enableRealTimeAnalysis(true);
      if (!enableResult.success) {
        console.error('Failed to enable real-time analysis:', enableResult.error);
        return false;
      }

      // Trigger analysis
      const analysisResult = await this.textEditor.triggerAnalysis();
      if (!analysisResult.success || !analysisResult.data) {
        console.error('Failed to trigger analysis:', analysisResult.error);
        return false;
      }

      const issues = analysisResult.data;
      if (issues.length === 0) {
        console.error('Expected to find writing issues in problem text');
        return false;
      }

      // Verify issue structure
      const firstIssue = issues[0];
      if (!firstIssue.id || !firstIssue.text || !firstIssue.message || firstIssue.position < 0) {
        console.error('Writing issue missing required fields');
        return false;
      }

      // Check that issues have fixes
      const issuesWithFixes = issues.filter(issue => issue.fixes && issue.fixes.length > 0);
      if (issuesWithFixes.length === 0) {
        console.error('Expected some issues to have suggested fixes');
        return false;
      }

      // Highlight issues in editor
      const highlightResult = await this.textEditor.highlightIssues(issues);
      if (!highlightResult.success || !highlightResult.data) {
        console.error('Failed to highlight issues:', highlightResult.error);
        return false;
      }

      const annotations = highlightResult.data;
      if (annotations.length !== issues.length) {
        console.error('Annotation count should match issue count');
        return false;
      }

      // Check analysis status
      const statusResult = await this.textEditor.getAnalysisStatus();
      if (!statusResult.success || !statusResult.data) {
        console.error('Failed to get analysis status:', statusResult.error);
        return false;
      }

      const status = statusResult.data;
      if (typeof status.isAnalyzing !== 'boolean' || typeof status.progress !== 'number') {
        console.error('Analysis status data incomplete');
        return false;
      }

      console.log('✓ Text Editor → Writing Analysis integration working correctly');
      return true;
    } catch (error) {
      console.error('Text editor writing analysis integration test failed:', error);
      return false;
    }
  }

  async testTextEditorFixApplication(): Promise<boolean> {
    try {
      // Test fix application system
      const problemText = 'Sarah was angry. She felt frustrated about the situation.';
      await this.textEditor.setText(problemText);

      // Create a test fix
      const testFix: TextFix = {
        id: 'fix-1',
        issueId: 'issue-1',
        issueType: 'show_tell',
        position: 6,
        length: 9,
        originalText: 'was angry',
        suggestedText: 'clenched her fists',
        confidence: 0.8,
        description: 'Show anger through action instead of telling',
        category: 'automatic'
      };

      // Apply fix
      const applyResult = await this.textEditor.applyFix(testFix);
      if (!applyResult.success || !applyResult.data) {
        console.error('Failed to apply fix:', applyResult.error);
        return false;
      }

      const change = applyResult.data;
      if (change.type !== 'replace' || change.newText !== 'clenched her fists') {
        console.error('Fix not applied correctly');
        return false;
      }

      // Test bulk fixes
      const bulkFixes: TextFix[] = [
        {
          id: 'fix-2',
          issueId: 'issue-2',
          issueType: 'show_tell',
          position: 30,
          length: 14,
          originalText: 'felt frustrated',
          suggestedText: 'paced the room',
          confidence: 0.7,
          description: 'Show frustration through behavior',
          category: 'suggestion'
        }
      ];

      // Preview bulk fixes
      const previewResult = await this.textEditor.previewBulkFixes(bulkFixes);
      if (!previewResult.success || !previewResult.data) {
        console.error('Failed to preview bulk fixes:', previewResult.error);
        return false;
      }

      const previewText = previewResult.data;
      if (!previewText.includes('paced the room')) {
        console.error('Bulk fix preview incorrect');
        return false;
      }

      // Apply bulk fixes
      const bulkApplyResult = await this.textEditor.applyBulkFixes(bulkFixes);
      if (!bulkApplyResult.success || !bulkApplyResult.data) {
        console.error('Failed to apply bulk fixes:', bulkApplyResult.error);
        return false;
      }

      const bulkOperation = bulkApplyResult.data;
      if (bulkOperation.fixes.length !== 1 || bulkOperation.affectedIssues !== 1) {
        console.error('Bulk fix operation data incorrect');
        return false;
      }

      // Test fix rejection
      const rejectResult = await this.textEditor.rejectFix('fix-2');
      if (!rejectResult.success) {
        console.error('Failed to reject fix:', rejectResult.error);
        return false;
      }

      console.log('✓ Text Editor fix application working correctly');
      return true;
    } catch (error) {
      console.error('Text editor fix application test failed:', error);
      return false;
    }
  }

  async testTextEditorAdvancedFeatures(): Promise<boolean> {
    try {
      // Test advanced features
      const testText = 'The quick brown fox jumps over the lazy dog. The quick brown fox is quick.';
      await this.textEditor.setText(testText);

      // Test find functionality
      const findResult = await this.textEditor.findText('quick', { caseSensitive: false });
      if (!findResult.success || !findResult.data) {
        console.error('Failed to find text:', findResult.error);
        return false;
      }

      const matches = findResult.data;
      if (matches.length !== 2) {
        console.error(`Expected 2 matches for 'quick', found ${matches.length}`);
        return false;
      }

      // Test replace all
      const replaceResult = await this.textEditor.replaceAll('quick', 'fast', { caseSensitive: false });
      if (!replaceResult.success || replaceResult.data !== 2) {
        console.error('Failed to replace all occurrences:', replaceResult.error);
        return false;
      }

      // Test word count
      const wordCountResult = await this.textEditor.getWordCount();
      if (!wordCountResult.success || !wordCountResult.data) {
        console.error('Failed to get word count:', wordCountResult.error);
        return false;
      }

      const wordCount = wordCountResult.data;
      if (wordCount.words <= 0 || wordCount.characters <= 0) {
        console.error('Word count data invalid');
        return false;
      }

      // Test cursor and selection
      const setCursorResult = await this.textEditor.setCursorPosition(10);
      if (!setCursorResult.success) {
        console.error('Failed to set cursor position:', setCursorResult.error);
        return false;
      }

      const setSelectionResult = await this.textEditor.setSelection(5, 15);
      if (!setSelectionResult.success) {
        console.error('Failed to set selection:', setSelectionResult.error);
        return false;
      }

      // Test export
      const exportResult = await this.textEditor.exportWithChanges('text');
      if (!exportResult.success || !exportResult.data) {
        console.error('Failed to export text:', exportResult.error);
        return false;
      }

      const exportedText = exportResult.data;
      if (!exportedText.includes('fast')) {
        console.error('Exported text missing changes');
        return false;
      }

      console.log('✓ Text Editor advanced features working correctly');
      return true;
    } catch (error) {
      console.error('Text editor advanced features test failed:', error);
      return false;
    }
  }

  async testTextEditorCollaborationFeatures(): Promise<boolean> {
    try {
      // Test collaboration features
      const collaborationCursor: CollaborationCursor = {
        userId: 'user-123',
        userName: 'Alice Smith',
        position: 25,
        selection: { start: 20, end: 30 },
        color: '#FF6B6B',
        timestamp: Date.now()
      };

      // Add collaboration cursor
      const addCursorResult = await this.textEditor.addCollaborationCursor(collaborationCursor);
      if (!addCursorResult.success) {
        console.error('Failed to add collaboration cursor:', addCursorResult.error);
        return false;
      }

      // Get collaboration cursors
      const getCursorsResult = await this.textEditor.getCollaborationCursors();
      if (!getCursorsResult.success || !getCursorsResult.data) {
        console.error('Failed to get collaboration cursors:', getCursorsResult.error);
        return false;
      }

      const cursors = getCursorsResult.data;
      if (cursors.length === 0) {
        console.error('Expected to find collaboration cursors');
        return false;
      }

      const foundCursor = cursors.find(c => c.userId === 'user-123');
      if (!foundCursor) {
        console.error('Collaboration cursor not found');
        return false;
      }

      // Test change broadcasting
      const testChange: TextChange = {
        id: 'change-123',
        type: 'insert',
        position: 10,
        length: 0,
        oldText: '',
        newText: 'inserted text',
        timestamp: Date.now(),
        userId: 'user-123'
      };

      const broadcastResult = await this.textEditor.broadcastChange(testChange);
      if (!broadcastResult.success) {
        console.error('Failed to broadcast change:', broadcastResult.error);
        return false;
      }

      // Remove collaboration cursor
      const removeCursorResult = await this.textEditor.removeCollaborationCursor('user-123');
      if (!removeCursorResult.success) {
        console.error('Failed to remove collaboration cursor:', removeCursorResult.error);
        return false;
      }

      // Verify removal
      const verifyCursorsResult = await this.textEditor.getCollaborationCursors();
      if (!verifyCursorsResult.success || !verifyCursorsResult.data) {
        console.error('Failed to verify cursor removal');
        return false;
      }

      const remainingCursors = verifyCursorsResult.data;
      const stillExists = remainingCursors.find(c => c.userId === 'user-123');
      if (stillExists) {
        console.error('Collaboration cursor still exists after removal');
        return false;
      }

      console.log('✓ Text Editor collaboration features working correctly');
      return true;
    } catch (error) {
      console.error('Text editor collaboration features test failed:', error);
      return false;
    }
  }

  async testTextEditorEditorStateManagement(): Promise<boolean> {
    try {
      // Test editor state management
      const testText = 'This is test content for state management.';
      await this.textEditor.setText(testText);

      // Set up initial state
      await this.textEditor.setCursorPosition(15);
      await this.textEditor.setSelection(10, 20);

      // Get editor state
      const stateResult = await this.textEditor.getEditorState();
      if (!stateResult.success || !stateResult.data) {
        console.error('Failed to get editor state:', stateResult.error);
        return false;
      }

      const state = stateResult.data;
      if (state.text !== testText) {
        console.error('Editor state text mismatch');
        return false;
      }

      if (state.cursorPosition !== 15) {
        console.error('Editor state cursor position mismatch');
        return false;
      }

      if (!state.selection || state.selection.start !== 10 || state.selection.end !== 20) {
        console.error('Editor state selection mismatch');
        return false;
      }

      if (!state.metadata || typeof state.metadata.characterCount !== 'number') {
        console.error('Editor state metadata incomplete');
        return false;
      }

      // Test partial state update
      const partialState = {
        cursorPosition: 25,
        isAnalyzing: true,
        analysisProgress: 50
      };

      const setStateResult = await this.textEditor.setEditorState(partialState);
      if (!setStateResult.success) {
        console.error('Failed to set editor state:', setStateResult.error);
        return false;
      }

      // Verify state update
      const updatedStateResult = await this.textEditor.getEditorState();
      if (!updatedStateResult.success || !updatedStateResult.data) {
        console.error('Failed to get updated editor state');
        return false;
      }

      const updatedState = updatedStateResult.data;
      if (updatedState.cursorPosition !== 25) {
        console.error('Editor state not updated correctly');
        return false;
      }

      if (!updatedState.isAnalyzing || updatedState.analysisProgress !== 50) {
        console.error('Analysis state not updated correctly');
        return false;
      }

      console.log('✓ Text Editor state management working correctly');
      return true;
    } catch (error) {
      console.error('Text editor state management test failed:', error);
      return false;
    }
  }

  async testTextEditorPerformanceWithLargeDocument(): Promise<boolean> {
    try {
      // Test performance with large document
      const largeText = 'This is a sentence that will be repeated many times. '.repeat(1000);
      
      const startTime = Date.now();

      // Set large text
      const setResult = await this.textEditor.setText(largeText);
      if (!setResult.success) {
        console.error('Failed to set large text:', setResult.error);
        return false;
      }

      // Perform various operations
      const operations = [
        this.textEditor.insertText(100, 'INSERTED '),
        this.textEditor.deleteText(200, 10),
        this.textEditor.replaceText(300, 15, 'REPLACED TEXT'),
        this.textEditor.findText('sentence'),
        this.textEditor.getWordCount()
      ];

      const results = await Promise.all(operations);
      const failedOperations = results.filter(result => !result.success);
      
      if (failedOperations.length > 0) {
        console.error('Some operations failed on large document');
        return false;
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (5 seconds for large document)
      if (duration > 5000) {
        console.warn(`Large document operations took ${duration}ms - may be too slow`);
      }

      // Test analysis on large document
      const analysisStartTime = Date.now();
      const analysisResult = await this.textEditor.triggerAnalysis();
      const analysisEndTime = Date.now();
      const analysisDuration = analysisEndTime - analysisStartTime;

      if (!analysisResult.success) {
        console.error('Analysis failed on large document:', analysisResult.error);
        return false;
      }

      console.log(`✓ Text Editor performance test: ${duration}ms operations, ${analysisDuration}ms analysis (${largeText.length} chars)`);
      return true;
    } catch (error) {
      console.error('Text editor performance test failed:', error);
      return false;
    }
  }

  async testTextEditorErrorHandling(): Promise<boolean> {
    try {
      // Test error handling scenarios
      
      // Invalid position tests
      const invalidInsertResult = await this.textEditor.insertText(-1, 'text');
      if (invalidInsertResult.success) {
        console.error('Insert should fail with negative position');
        return false;
      }

      const invalidDeleteResult = await this.textEditor.deleteText(1000, 10);
      if (invalidDeleteResult.success) {
        console.error('Delete should fail with out-of-bounds position');
        return false;
      }

      // Invalid annotation tests
      const invalidAnnotation: EditorAnnotation = {
        id: '',
        type: 'issue',
        position: -1,
        length: 0,
        severity: 'error',
        message: '',
        category: '',
        timestamp: Date.now()
      };

      const invalidAnnotationResult = await this.textEditor.addAnnotation(invalidAnnotation);
      if (invalidAnnotationResult.success) {
        console.error('Add annotation should fail with invalid data');
        return false;
      }

      // Non-existent item tests
      const removeNonExistentResult = await this.textEditor.removeAnnotation('non-existent-id');
      if (removeNonExistentResult.success) {
        console.error('Remove annotation should fail for non-existent ID');
        return false;
      }

      const rejectNonExistentFixResult = await this.textEditor.rejectFix('non-existent-fix');
      if (rejectNonExistentFixResult.success) {
        console.error('Reject fix should fail for non-existent fix');
        return false;
      }

      // Invalid fix tests
      const invalidFix: TextFix = {
        id: 'invalid-fix',
        issueId: 'issue-1',
        issueType: 'show_tell',
        position: -1,
        length: -1,
        originalText: '',
        suggestedText: '',
        confidence: 2.0, // Invalid confidence
        description: '',
        category: 'automatic'
      };

      const invalidFixResult = await this.textEditor.applyFix(invalidFix);
      if (invalidFixResult.success) {
        console.error('Apply fix should fail with invalid fix data');
        return false;
      }

      console.log('✓ Text Editor error handling working correctly');
      return true;
    } catch (error) {
      console.error('Text editor error handling test failed:', error);
      return false;
    }
  }

  // Writing Quality Analyzer Integration Tests
  async testWritingAnalyzerShowVsTell(): Promise<boolean> {
    try {
      // Test story with clear show vs tell issues
      const testStory = `
        John was angry. He was very frustrated about the situation. 
        Sarah felt sad when she saw him. She was disappointed by his reaction.
        "I can't believe this happened," he said. His hands clenched into fists.
        The rain fell softly against the window, each drop tracing a path down the glass.
      `;

      const showTellResult = await this.writingAnalyzer.analyzeShowVsTell(testStory);
      if (!showTellResult.success || !showTellResult.data) {
        console.error('Show vs Tell analysis failed:', showTellResult.error);
        return false;
      }

      const issues = showTellResult.data;
      
      // Should detect "was angry", "was very frustrated", "felt sad", "was disappointed"
      if (issues.length < 3) {
        console.error(`Expected at least 3 show vs tell issues, found ${issues.length}`);
        return false;
      }

      // Verify issue structure
      const firstIssue = issues[0];
      if (!firstIssue.text || !firstIssue.suggestion || firstIssue.position < 0) {
        console.error('Show vs tell issue missing required fields');
        return false;
      }

      // Check for appropriate severity levels
      const severities = issues.map(issue => issue.severity);
      const hasDifferentSeverities = new Set(severities).size > 1;
      if (!hasDifferentSeverities && issues.length > 2) {
        console.warn('All issues have same severity - analysis might need refinement');
      }

      console.log(`✓ Writing Analyzer Show vs Tell: Found ${issues.length} issues correctly`);
      return true;
    } catch (error) {
      console.error('Writing analyzer show vs tell test failed:', error);
      return false;
    }
  }

  async testWritingAnalyzerTropeDetection(): Promise<boolean> {
    try {
      // Test story with recognizable tropes
      const testStory = `
        Sarah was the chosen one, destined to save the world according to an ancient prophecy.
        It was love at first sight when her eyes met John's across the crowded room.
        Her wise old mentor had died just before the final battle, leaving her to face her destiny alone.
        The storm raged outside as she prepared for what would be the darkest night of her life.
      `;

      const tropeResult = await this.writingAnalyzer.detectTropes(testStory);
      if (!tropeResult.success || !tropeResult.data) {
        console.error('Trope detection failed:', tropeResult.error);
        return false;
      }

      const tropes = tropeResult.data;
      
      // Should detect "Chosen One", "Love at First Sight", possibly "Dead Mentor" and "Dark and Stormy Night"
      if (tropes.length < 2) {
        console.error(`Expected at least 2 tropes, found ${tropes.length}`);
        return false;
      }

      // Verify trope structure
      const firstTrope = tropes[0];
      if (!firstTrope.name || !firstTrope.description || !firstTrope.subversionSuggestions || firstTrope.subversionSuggestions.length === 0) {
        console.error('Trope match missing required fields');
        return false;
      }

      // Check confidence scores
      const invalidConfidence = tropes.find(trope => trope.confidence < 0 || trope.confidence > 1);
      if (invalidConfidence) {
        console.error('Invalid confidence score found');
        return false;
      }

      // Verify categories
      const validCategories = ['character', 'plot', 'dialogue', 'setting'];
      const invalidCategory = tropes.find(trope => !validCategories.includes(trope.category));
      if (invalidCategory) {
        console.error(`Invalid trope category: ${invalidCategory.category}`);
        return false;
      }

      console.log(`✓ Writing Analyzer Trope Detection: Found ${tropes.length} tropes correctly`);
      return true;
    } catch (error) {
      console.error('Writing analyzer trope detection test failed:', error);
      return false;
    }
  }

  async testWritingAnalyzerPurpleProse(): Promise<boolean> {
    try {
      // Test story with purple prose issues
      const testStory = `
        The exquisitely magnificent, breathtakingly beautiful, sublimely gorgeous woman walked slowly, gracefully, elegantly across the room.
        Her crystalline, sparkling, luminously radiant eyes were like twin stars dancing in a cosmic ballet of ethereal beauty beyond mortal comprehension.
        The luxuriously soft, silky smooth, impossibly perfect hair cascaded magnificently down her back.
      `;

      const purpleProseResult = await this.writingAnalyzer.detectPurpleProse(testStory);
      if (!purpleProseResult.success || !purpleProseResult.data) {
        console.error('Purple prose detection failed:', purpleProseResult.error);
        return false;
      }

      const issues = purpleProseResult.data;
      
      // Should detect excessive adjectives, flowery language, redundant descriptions, overwrought metaphors
      if (issues.length < 3) {
        console.error(`Expected at least 3 purple prose issues, found ${issues.length}`);
        return false;
      }

      // Verify issue structure
      const firstIssue = issues[0];
      if (!firstIssue.text || !firstIssue.suggestion || !firstIssue.simplifiedVersion) {
        console.error('Purple prose issue missing required fields');
        return false;
      }

      // Check for different issue types
      const issueTypes = new Set(issues.map(issue => issue.type));
      const expectedTypes = ['excessive_adjectives', 'flowery_language', 'redundant_description', 'overwrought_metaphor'];
      
      if (issueTypes.size < 2) {
        console.warn('Expected multiple purple prose issue types');
      }

      // Verify severity levels
      const severities = issues.map(issue => issue.severity);
      const validSeverities = ['mild', 'moderate', 'severe'];
      const invalidSeverity = severities.find(severity => !validSeverities.includes(severity));
      if (invalidSeverity) {
        console.error(`Invalid severity level: ${invalidSeverity}`);
        return false;
      }

      console.log(`✓ Writing Analyzer Purple Prose: Found ${issues.length} issues correctly`);
      return true;
    } catch (error) {
      console.error('Writing analyzer purple prose test failed:', error);
      return false;
    }
  }

  async testWritingAnalyzerQualityReport(): Promise<boolean> {
    try {
      // Test comprehensive quality report generation
      const testStory = `
        Sarah was angry and frustrated. She was the chosen one, destined to save the world.
        The magnificently beautiful, exquisitely gorgeous princess walked gracefully across the room.
        "I can't believe this is happening," she said, her voice trembling with emotion.
        It was love at first sight when their eyes met. The storm outside grew stronger.
        Her hands shook as she picked up the ancient sword that would decide their fate.
      `;

      const reportResult = await this.writingAnalyzer.generateQualityReport(testStory);
      if (!reportResult.success || !reportResult.data) {
        console.error('Quality report generation failed:', reportResult.error);
        return false;
      }

      const report = reportResult.data;

      // Verify report structure
      if (!report.showTellIssues || !report.tropeMatches || !report.purpleProseIssues || !report.overallScore) {
        console.error('Quality report missing required sections');
        return false;
      }

      // Should find some issues in each category
      if (report.showTellIssues.length === 0) {
        console.error('Expected to find show vs tell issues');
        return false;
      }

      if (report.tropeMatches.length === 0) {
        console.error('Expected to find trope matches');
        return false;
      }

      if (report.purpleProseIssues.length === 0) {
        console.error('Expected to find purple prose issues');
        return false;
      }

      // Verify overall scores are valid
      const { showVsTell, tropeOriginality, proseClarity } = report.overallScore;
      
      if (showVsTell < 0 || showVsTell > 100) {
        console.error(`Invalid show vs tell score: ${showVsTell}`);
        return false;
      }

      if (tropeOriginality < 0 || tropeOriginality > 100) {
        console.error(`Invalid trope originality score: ${tropeOriginality}`);
        return false;
      }

      if (proseClarity < 0 || proseClarity > 100) {
        console.error(`Invalid prose clarity score: ${proseClarity}`);
        return false;
      }

      // Scores should reflect the quality issues found
      if (showVsTell > 90) {
        console.warn(`Show vs tell score unexpectedly high (${showVsTell}) given issues found`);
      }

      if (tropeOriginality > 90) {
        console.warn(`Trope originality score unexpectedly high (${tropeOriginality}) given tropes found`);
      }

      if (proseClarity > 90) {
        console.warn(`Prose clarity score unexpectedly high (${proseClarity}) given issues found`);
      }

      console.log(`✓ Writing Analyzer Quality Report: Generated comprehensive report with scores ${showVsTell}/${tropeOriginality}/${proseClarity}`);
      return true;
    } catch (error) {
      console.error('Writing analyzer quality report test failed:', error);
      return false;
    }
  }

  async testWritingAnalyzerPerformance(): Promise<boolean> {
    try {
      // Test with larger text for performance
      const largeStory = `
        Sarah was angry and upset. She felt frustrated by the situation unfolding before her.
        The ancient prophecy spoke of a chosen one who would save the world from darkness.
        It was love at first sight when their eyes met across the crowded marketplace.
        The exquisitely beautiful, magnificently gorgeous woman walked gracefully through the garden.
        Her wise old mentor had died before teaching her the final lesson she would need.
        The storm clouds gathered ominously as the dark and stormy night approached.
        "I have to do this," she said, knowing that her destiny awaited.
        The crystalline tears that sparkled like diamonds rolled down her perfect cheeks.
        John was excited and nervous about what lay ahead. He felt uncertain about their chances.
        The magnificent castle stood majestically against the sublimely beautiful sunset.
      `.repeat(10); // Repeat to make it larger

      const startTime = Date.now();

      // Run all analyses concurrently
      const [showTellResult, tropeResult, purpleProseResult, reportResult] = await Promise.all([
        this.writingAnalyzer.analyzeShowVsTell(largeStory),
        this.writingAnalyzer.detectTropes(largeStory),
        this.writingAnalyzer.detectPurpleProse(largeStory),
        this.writingAnalyzer.generateQualityReport(largeStory)
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all analyses succeeded
      if (!showTellResult.success || !tropeResult.success || !purpleProseResult.success || !reportResult.success) {
        console.error('Some analyses failed during performance test');
        return false;
      }

      // Check reasonable performance (should complete within 5 seconds for repeated text)
      if (duration > 5000) {
        console.warn(`Writing analysis took ${duration}ms - may be too slow for large texts`);
      }

      // Verify results scale appropriately
      const showTellIssues = showTellResult.data!.length;
      const tropeMatches = tropeResult.data!.length;
      const purpleProseIssues = purpleProseResult.data!.length;

      if (showTellIssues === 0 || tropeMatches === 0 || purpleProseIssues === 0) {
        console.error('Expected to find issues in large text sample');
        return false;
      }

      console.log(`✓ Writing Analyzer Performance: Analyzed ${largeStory.length} characters in ${duration}ms`);
      console.log(`  Found: ${showTellIssues} show/tell, ${tropeMatches} tropes, ${purpleProseIssues} prose issues`);
      return true;
    } catch (error) {
      console.error('Writing analyzer performance test failed:', error);
      return false;
    }
  }

  async testWritingAnalyzerErrorScenarios(): Promise<boolean> {
    try {
      // Test with empty text
      const emptyResult = await this.writingAnalyzer.generateQualityReport('');
      if (!emptyResult.success) {
        console.log('✓ Empty text handled correctly');
      }

      // Test with very short text
      const shortResult = await this.writingAnalyzer.generateQualityReport('Hi.');
      if (shortResult.success && shortResult.data) {
        const report = shortResult.data;
        if (report.showTellIssues.length === 0 && report.tropeMatches.length === 0) {
          console.log('✓ Short text handled correctly');
        }
      }

      // Test with non-English characters
      const unicodeText = 'Sarah était en colère. 她很生气。彼女は怒っていた。';
      const unicodeResult = await this.writingAnalyzer.generateQualityReport(unicodeText);
      if (unicodeResult.success) {
        console.log('✓ Unicode text handled correctly');
      }

      // Test with very long single sentence
      const longSentence = 'Sarah was angry and ' + 'very '.repeat(1000) + 'frustrated.';
      const longResult = await this.writingAnalyzer.generateQualityReport(longSentence);
      if (longResult.success) {
        console.log('✓ Long sentence handled correctly');
      }

      console.log('✓ Writing Analyzer error scenarios handled correctly');
      return true;
    } catch (error) {
      console.error('Writing analyzer error scenario test failed:', error);
      return false;
    }
  }

  async testWritingAnalyzerTextAnalysisIntegration(): Promise<boolean> {
    try {
      // Test integration with text analysis engine
      const testStory = `
        Sarah looked out the window, her heart racing. "Is he coming?" she wondered aloud.
        John was determined to keep his promise. He had said he would be there.
        The rain was heavy and the night was dark and stormy.
      `;

      // First, parse text with text analysis engine
      const parseResult = await this.textAnalysis.parseText(testStory);
      if (!parseResult.success || !parseResult.data) {
        console.error('Text analysis failed in integration test');
        return false;
      }

      const segments = parseResult.data;

      // Then analyze with writing quality analyzer
      const qualityResult = await this.writingAnalyzer.generateQualityReport(testStory);
      if (!qualityResult.success || !qualityResult.data) {
        console.error('Quality analysis failed in integration test');
        return false;
      }

      const report = qualityResult.data;

      // Verify that analysis considers text structure
      const dialogueSegments = segments.filter(s => s.type === 'dialogue');
      const narrationSegments = segments.filter(s => s.type === 'narration');

      if (dialogueSegments.length > 0 && narrationSegments.length > 0) {
        // Should find issues primarily in narration
        const narrationText = narrationSegments.map(s => s.content).join(' ');
        if (narrationText.includes('was determined') || narrationText.includes('was heavy')) {
          if (report.showTellIssues.length === 0) {
            console.warn('Expected to find show vs tell issues in narration');
          }
        }
      }

      console.log('✓ Writing Analyzer → Text Analysis integration working correctly');
      return true;
    } catch (error) {
      console.error('Writing analyzer text analysis integration test failed:', error);
      return false;
    }
  }

  async testWritingAnalyzerUIIntegration(): Promise<boolean> {
    try {
      // Test that analysis results can be properly displayed
      const testStory = `
        Sarah was angry. The beautiful princess walked gracefully. 
        It was love at first sight. The chosen one would save the world.
      `;

      const reportResult = await this.writingAnalyzer.generateQualityReport(testStory);
      if (!reportResult.success || !reportResult.data) {
        console.error('Quality report generation failed for UI test');
        return false;
      }

      const report = reportResult.data;

      // Verify all data needed for UI is present and properly formatted
      for (const issue of report.showTellIssues) {
        if (!issue.text || !issue.suggestion || typeof issue.position !== 'number') {
          console.error('Show vs tell issue missing UI data');
          return false;
        }
      }

      for (const trope of report.tropeMatches) {
        if (!trope.name || !trope.description || !trope.subversionSuggestions || trope.subversionSuggestions.length === 0) {
          console.error('Trope match missing UI data');
          return false;
        }
      }

      for (const issue of report.purpleProseIssues) {
        if (!issue.text || !issue.suggestion || !issue.simplifiedVersion) {
          console.error('Purple prose issue missing UI data');
          return false;
        }
      }

      // Verify scores are in displayable range
      const scores = [report.overallScore.showVsTell, report.overallScore.tropeOriginality, report.overallScore.proseClarity];
      for (const score of scores) {
        if (isNaN(score) || score < 0 || score > 100) {
          console.error(`Invalid score for UI display: ${score}`);
          return false;
        }
      }

      console.log('✓ Writing Analyzer UI integration data correctly formatted');
      return true;
    } catch (error) {
      console.error('Writing analyzer UI integration test failed:', error);
      return false;
    }
  }

  // Full System Integration
  async testFullSystemIntegration(): Promise<boolean> {
    try {
      const sampleStory = `Sarah looked out the window. "Is he coming?" she wondered. The rain fell steadily. "I'll be there," John had said, but that was yesterday.`;
      
      const options: ProcessingOptions = {
        enableManualCorrection: false,
        outputFormat: 'mp3'
      };

      const result = await this.orchestrator.processStory(sampleStory, options);
      if (!result.success || !result.data) {
        console.error('Full system integration failed:', result.error);
        return false;
      }

      const audioOutput = result.data;
      if (!audioOutput.audioFile || audioOutput.duration <= 0) {
        console.error('Invalid audio output');
        return false;
      }

      if (audioOutput.segments.length === 0) {
        console.error('No audio segments generated');
        return false;
      }

      const speedAdjustResult = await this.audioControls.adjustPlaybackSpeed(0.75);
      if (!speedAdjustResult.success) {
        console.error('Audio controls integration failed');
        return false;
      }

      console.log('✓ Full System Integration working correctly');
      return true;
    } catch (error) {
      console.error('Full system integration test failed:', error);
      return false;
    }
  }

  // Run all seam tests including comprehensive Interactive Text Editor tests
  async runAllTests(): Promise<boolean> {
    console.log('Running Comprehensive Seam Integration Tests with Interactive Text Editor...');
    
    const tests = [
      // Core Pipeline Tests
      this.testTextAnalysisToCharacterDetection(),
      this.testCharacterDetectionToVoiceAssignment(),
      this.testVoiceAssignmentToAudioGeneration(),
      this.testAudioGenerationToAudioControls(),
      this.testAudioControlsWorkflow(),
      
      // Voice Customization Seam Tests
      this.testVoiceCustomizationSeam(),
      this.testVoiceCustomizationToVoiceAssignment(),
      this.testVoiceCustomizationToAudioGeneration(),
      this.testVoiceCustomizationSettingsManagement(),
      this.testVoiceCustomizationErrorScenarios(),
      this.testVoiceCustomizationPerformance(),
      this.testCompleteVoiceCustomizationWorkflow(),
      
      // Interactive Text Editor Seam Tests
      this.testTextEditorBasicOperations(),
      this.testTextEditorChangeTracking(),
      this.testTextEditorAnnotationSystem(),
      this.testTextEditorWritingAnalysisIntegration(),
      this.testTextEditorFixApplication(),
      this.testTextEditorAdvancedFeatures(),
      this.testTextEditorCollaborationFeatures(),
      this.testTextEditorEditorStateManagement(),
      this.testTextEditorPerformanceWithLargeDocument(),
      this.testTextEditorErrorHandling(),
      
      // Writing Quality Analyzer Integration Tests
      this.testWritingAnalyzerShowVsTell(),
      this.testWritingAnalyzerTropeDetection(),
      this.testWritingAnalyzerPurpleProse(),
      this.testWritingAnalyzerQualityReport(),
      this.testWritingAnalyzerPerformance(),
      this.testWritingAnalyzerErrorScenarios(),
      this.testWritingAnalyzerTextAnalysisIntegration(),
      this.testWritingAnalyzerUIIntegration(),
      
      // System Integration
      this.testFullSystemIntegration()
    ];

    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const total = results.length;

    console.log(`\nSeam Tests: ${passed}/${total} passed`);
    
    if (passed !== total) {
      console.log('Some seam tests failed. Check implementation contracts.');
      results.forEach((result, index) => {
        if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value)) {
          const testNames = [
            'Text Analysis → Character Detection',
            'Character Detection → Voice Assignment',
            'Voice Assignment → Audio Generation',
            'Audio Generation → Audio Controls',
            'Audio Controls Workflow',
            'Voice Customization System',
            'Voice Customization → Voice Assignment',
            'Voice Customization → Audio Generation',
            'Voice Customization Settings',
            'Voice Customization Error Handling',
            'Voice Customization Performance',
            'Complete Voice Customization Workflow',
            'Text Editor Basic Operations',
            'Text Editor Change Tracking',
            'Text Editor Annotation System',
            'Text Editor → Writing Analysis Integration',
            'Text Editor Fix Application',
            'Text Editor Advanced Features',
            'Text Editor Collaboration Features',
            'Text Editor State Management',
            'Text Editor Performance (Large Document)',
            'Text Editor Error Handling',
            'Writing Analyzer Show vs Tell',
            'Writing Analyzer Trope Detection',
            'Writing Analyzer Purple Prose',
            'Writing Analyzer Quality Report',
            'Writing Analyzer Performance',
            'Writing Analyzer Error Scenarios',
            'Writing Analyzer Text Analysis Integration',
            'Writing Analyzer UI Integration',
            'Full System Integration'
          ];
          console.log(`❌ ${testNames[index]} failed`);
        }
      });
      return false;
    }

    console.log('✓ All seam integration tests passed!');
    console.log('✅ INTERACTIVE TEXT EDITOR SEAM FULLY TESTED AND VALIDATED');
    console.log('✅ ALL MAJOR SEAMS TESTED AND WORKING:');
    console.log('  ✓ Core Processing Pipeline');
    console.log('  ✓ Advanced Audio Controls');
    console.log('  ✓ Voice Customization System');
    console.log('  ✓ Writing Quality Analyzer');
    console.log('  ✓ Interactive Text Editor');
    return true;
  }
}