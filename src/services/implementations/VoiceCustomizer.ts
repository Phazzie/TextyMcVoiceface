import { 
  IVoiceCustomizer, 
  ContractResult, 
  VoiceAdjustments, 
  VoiceProfile, 
  VoiceSettings, 
  VoicePreview,
  AudioSegment,
  TextSegment
} from '../../types/contracts';
import { SeamManager } from '../SeamManager';

export class VoiceCustomizer implements IVoiceCustomizer {
  private customVoices = new Map<string, VoiceProfile>();
  private defaultVoices = new Map<string, VoiceProfile>();
  private previewCache = new Map<string, VoicePreview>();
  private isInitialized = false;

  // Voice setting constants
  private static readonly STORAGE_KEY = 'voice_customizer_settings';
  private static readonly FORMAT_VERSION = '1.0.0';
  private static readonly ADJUSTMENT_LIMITS = {
    pitch: { min: -1.0, max: 1.0 },
    speed: { min: -1.0, max: 1.0 },
    emphasis: { min: 0.0, max: 1.0 },
    clarity: { min: 0.0, max: 1.0 }
  };

  // Preview text samples for different character types
  private static readonly PREVIEW_TEXTS = {
    default: "Hello, this is how my voice sounds with these settings.",
    narrator: "Once upon a time, in a land far away, there lived a curious traveler.",
    dialogue: "I'm excited to hear how this sounds!",
    dramatic: "The storm approaches, and destiny awaits us all.",
    warm: "Welcome home, it's wonderful to see you again.",
    cold: "The facts speak for themselves, nothing more needs to be said."
  };

  constructor() {
    this.initializeVoiceCustomizer();
  }

  private async initializeVoiceCustomizer(): Promise<void> {
    try {
      await this.loadStoredSettings();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize voice customizer:', error);
      this.isInitialized = true; // Continue with defaults
    }
  }

  async previewVoiceAdjustment(character: string, adjustments: VoiceAdjustments): Promise<ContractResult<VoicePreview>> {
    try {
      if (!this.isInitialized) {
        await this.initializeVoiceCustomizer();
      }

      // Validate character exists
      if (!character || character.trim().length === 0) {
        return {
          success: false,
          error: 'Character name cannot be empty'
        };
      }

      // Validate adjustments
      const validationResult = await this.validateAdjustments(adjustments);
      if (!validationResult.success) {
        return {
          success: false,
          error: `Invalid adjustments: ${validationResult.error}`
        };
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(character, adjustments);
      
      // Check cache first
      if (this.previewCache.has(cacheKey)) {
        const cachedPreview = this.previewCache.get(cacheKey)!;
        return {
          success: true,
          data: cachedPreview,
          metadata: { cached: true, cacheKey }
        };
      }

      // Get base voice profile
      const baseProfile = await this.getBaseVoiceProfile(character);
      if (!baseProfile.success || !baseProfile.data) {
        return {
          success: false,
          error: `Cannot find base voice profile for character: ${character}`
        };
      }

      // Apply adjustments to create preview profile
      const adjustedProfileResult = await this.applyAdjustments(baseProfile.data, adjustments);
      if (!adjustedProfileResult.success || !adjustedProfileResult.data) {
        return {
          success: false,
          error: `Failed to apply adjustments: ${adjustedProfileResult.error}`
        };
      }

      const adjustedProfile = adjustedProfileResult.data;

      // Generate preview text based on character and voice tone
      const previewText = this.generatePreviewText(character, adjustedProfile);

      // Create text segment for audio generation
      const textSegment: TextSegment = {
        id: `preview-${character}-${Date.now()}`,
        content: previewText,
        speaker: character,
        type: character === 'Narrator' ? 'narration' : 'dialogue',
        startPosition: 0,
        endPosition: previewText.length
      };

      // Generate preview audio
      const audioResult = await this.generatePreviewAudio(textSegment, adjustedProfile);
      if (!audioResult.success || !audioResult.data) {
        return {
          success: false,
          error: `Failed to generate preview audio: ${audioResult.error}`
        };
      }

      const audioSegment = audioResult.data;

      // Create voice preview
      const voicePreview: VoicePreview = {
        audioSegment: audioSegment,
        voiceProfile: adjustedProfile,
        previewText: previewText,
        duration: audioSegment.duration
      };

      // Cache the preview (limit cache size)
      if (this.previewCache.size >= 50) {
        const firstKey = this.previewCache.keys().next().value;
        this.previewCache.delete(firstKey);
      }
      this.previewCache.set(cacheKey, voicePreview);

      return {
        success: true,
        data: voicePreview,
        metadata: {
          cached: false,
          cacheKey,
          previewTextLength: previewText.length,
          audioDuration: audioSegment.duration
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Voice preview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async saveCustomVoice(character: string, profile: VoiceProfile): Promise<ContractResult<boolean>> {
    try {
      if (!character || character.trim().length === 0) {
        return {
          success: false,
          error: 'Character name cannot be empty'
        };
      }

      if (!profile || !profile.id || !profile.name) {
        return {
          success: false,
          error: 'Invalid voice profile provided'
        };
      }

      // Validate voice profile parameters
      if (profile.pitch < 0.1 || profile.pitch > 3.0) {
        return {
          success: false,
          error: 'Voice profile pitch must be between 0.1 and 3.0'
        };
      }

      if (profile.speed < 0.1 || profile.speed > 3.0) {
        return {
          success: false,
          error: 'Voice profile speed must be between 0.1 and 3.0'
        };
      }

      // Create custom voice profile with unique ID
      const customProfile: VoiceProfile = {
        ...profile,
        id: `custom-${character.toLowerCase()}-${Date.now()}`,
        name: `${character} Custom Voice`
      };

      // Store in memory
      this.customVoices.set(character, customProfile);

      // Persist to storage
      await this.saveToStorage();

      // Clear preview cache for this character
      this.clearCharacterPreviewCache(character);

      return {
        success: true,
        data: true,
        metadata: {
          character,
          voiceId: customProfile.id,
          savedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save custom voice: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async resetToDefault(character: string): Promise<ContractResult<VoiceProfile>> {
    try {
      if (!character || character.trim().length === 0) {
        return {
          success: false,
          error: 'Character name cannot be empty'
        };
      }

      // Remove custom voice
      this.customVoices.delete(character);

      // Get default voice profile
      const defaultProfileResult = await this.getBaseVoiceProfile(character);
      if (!defaultProfileResult.success || !defaultProfileResult.data) {
        return {
          success: false,
          error: `Cannot find default voice profile for character: ${character}`
        };
      }

      const defaultProfile = defaultProfileResult.data;

      // Store default as current (in case we need to reload)
      this.defaultVoices.set(character, defaultProfile);

      // Persist changes
      await this.saveToStorage();

      // Clear preview cache for this character
      this.clearCharacterPreviewCache(character);

      return {
        success: true,
        data: defaultProfile,
        metadata: {
          character,
          resetAt: Date.now(),
          wasCustom: this.customVoices.has(character)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to reset voice to default: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async exportVoiceSettings(): Promise<ContractResult<VoiceSettings>> {
    try {
      // Collect all custom voices
      const characters: Record<string, VoiceProfile> = {};
      const customAdjustments: Record<string, VoiceAdjustments> = {};

      for (const [character, profile] of this.customVoices.entries()) {
        characters[character] = profile;
        
        // Calculate adjustments from default if possible
        const defaultProfile = this.defaultVoices.get(character);
        if (defaultProfile) {
          customAdjustments[character] = this.calculateAdjustments(defaultProfile, profile);
        }
      }

      const voiceSettings: VoiceSettings = {
        formatVersion: VoiceCustomizer.FORMAT_VERSION,
        characters,
        customAdjustments,
        metadata: {
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          totalCharacters: Object.keys(characters).length
        }
      };

      return {
        success: true,
        data: voiceSettings,
        metadata: {
          totalCharacters: Object.keys(characters).length,
          formatVersion: VoiceCustomizer.FORMAT_VERSION,
          exportSize: JSON.stringify(voiceSettings).length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export voice settings: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async importVoiceSettings(settings: VoiceSettings): Promise<ContractResult<boolean>> {
    try {
      if (!settings || typeof settings !== 'object') {
        return {
          success: false,
          error: 'Invalid settings format'
        };
      }

      if (!settings.formatVersion || !settings.characters || !settings.metadata) {
        return {
          success: false,
          error: 'Incomplete settings data'
        };
      }

      // Validate format version
      if (settings.formatVersion !== VoiceCustomizer.FORMAT_VERSION) {
        return {
          success: false,
          error: `Unsupported format version: ${settings.formatVersion}. Expected: ${VoiceCustomizer.FORMAT_VERSION}`
        };
      }

      // Validate character profiles
      for (const [character, profile] of Object.entries(settings.characters)) {
        if (!profile.id || !profile.name || !profile.gender || !profile.age) {
          return {
            success: false,
            error: `Invalid voice profile for character: ${character}`
          };
        }

        // Validate profile parameters
        if (profile.pitch < 0.1 || profile.pitch > 3.0 || profile.speed < 0.1 || profile.speed > 3.0) {
          return {
            success: false,
            error: `Invalid voice parameters for character: ${character}`
          };
        }
      }

      // Clear existing custom voices
      this.customVoices.clear();

      // Import new settings
      let importedCount = 0;
      for (const [character, profile] of Object.entries(settings.characters)) {
        this.customVoices.set(character, profile);
        importedCount++;
      }

      // Persist to storage
      await this.saveToStorage();

      // Clear preview cache
      this.previewCache.clear();

      return {
        success: true,
        data: true,
        metadata: {
          importedCharacters: importedCount,
          formatVersion: settings.formatVersion,
          importedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import voice settings: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getCustomVoices(): Promise<ContractResult<Record<string, VoiceProfile>>> {
    try {
      if (!this.isInitialized) {
        await this.initializeVoiceCustomizer();
      }

      const customVoices: Record<string, VoiceProfile> = {};
      for (const [character, profile] of this.customVoices.entries()) {
        customVoices[character] = { ...profile }; // Return copy to prevent mutation
      }

      return {
        success: true,
        data: customVoices,
        metadata: {
          totalCustomVoices: this.customVoices.size,
          retrievedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get custom voices: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async applyAdjustments(baseProfile: VoiceProfile, adjustments: VoiceAdjustments): Promise<ContractResult<VoiceProfile>> {
    try {
      if (!baseProfile) {
        return {
          success: false,
          error: 'Base voice profile is required'
        };
      }

      // Validate adjustments
      const validationResult = await this.validateAdjustments(adjustments);
      if (!validationResult.success) {
        return {
          success: false,
          error: `Invalid adjustments: ${validationResult.error}`
        };
      }

      // Create adjusted profile
      const adjustedProfile: VoiceProfile = {
        ...baseProfile,
        id: `adjusted-${baseProfile.id}-${Date.now()}`,
        name: `${baseProfile.name} (Adjusted)`
      };

      // Apply pitch adjustment
      if (adjustments.pitch !== undefined) {
        adjustedProfile.pitch = Math.max(0.1, Math.min(3.0, 
          baseProfile.pitch + (adjustments.pitch * 0.5) // Scale adjustment
        ));
      }

      // Apply speed adjustment
      if (adjustments.speed !== undefined) {
        adjustedProfile.speed = Math.max(0.1, Math.min(3.0, 
          baseProfile.speed + (adjustments.speed * 0.3) // Scale adjustment
        ));
      }

      // Apply tone adjustment
      if (adjustments.tone !== undefined) {
        adjustedProfile.tone = adjustments.tone;
      }

      // Note: emphasis and clarity are stored but not directly applied to VoiceProfile
      // They would be used during audio generation for ElevenLabs or other advanced systems

      return {
        success: true,
        data: adjustedProfile,
        metadata: {
          originalId: baseProfile.id,
          adjustmentsApplied: Object.keys(adjustments),
          resultingPitch: adjustedProfile.pitch,
          resultingSpeed: adjustedProfile.speed
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to apply adjustments: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async validateAdjustments(adjustments: VoiceAdjustments): Promise<ContractResult<boolean>> {
    try {
      if (!adjustments || typeof adjustments !== 'object') {
        return {
          success: false,
          error: 'Adjustments must be a valid object'
        };
      }

      const errors: string[] = [];

      // Validate pitch
      if (adjustments.pitch !== undefined) {
        const { min, max } = VoiceCustomizer.ADJUSTMENT_LIMITS.pitch;
        if (typeof adjustments.pitch !== 'number' || adjustments.pitch < min || adjustments.pitch > max) {
          errors.push(`Pitch adjustment must be between ${min} and ${max}`);
        }
      }

      // Validate speed
      if (adjustments.speed !== undefined) {
        const { min, max } = VoiceCustomizer.ADJUSTMENT_LIMITS.speed;
        if (typeof adjustments.speed !== 'number' || adjustments.speed < min || adjustments.speed > max) {
          errors.push(`Speed adjustment must be between ${min} and ${max}`);
        }
      }

      // Validate tone
      if (adjustments.tone !== undefined) {
        const validTones = ['warm', 'cold', 'neutral', 'dramatic'];
        if (!validTones.includes(adjustments.tone)) {
          errors.push(`Tone must be one of: ${validTones.join(', ')}`);
        }
      }

      // Validate emphasis
      if (adjustments.emphasis !== undefined) {
        const { min, max } = VoiceCustomizer.ADJUSTMENT_LIMITS.emphasis;
        if (typeof adjustments.emphasis !== 'number' || adjustments.emphasis < min || adjustments.emphasis > max) {
          errors.push(`Emphasis must be between ${min} and ${max}`);
        }
      }

      // Validate clarity
      if (adjustments.clarity !== undefined) {
        const { min, max } = VoiceCustomizer.ADJUSTMENT_LIMITS.clarity;
        if (typeof adjustments.clarity !== 'number' || adjustments.clarity < min || adjustments.clarity > max) {
          errors.push(`Clarity must be between ${min} and ${max}`);
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join('; ')
        };
      }

      return {
        success: true,
        data: true,
        metadata: {
          validatedParameters: Object.keys(adjustments),
          validationPassed: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Private helper methods
  private async getBaseVoiceProfile(character: string): Promise<ContractResult<VoiceProfile>> {
    try {
      // Check if we have a custom voice already
      if (this.customVoices.has(character)) {
        return {
          success: true,
          data: this.customVoices.get(character)!
        };
      }

      // Check if we have a cached default
      if (this.defaultVoices.has(character)) {
        return {
          success: true,
          data: this.defaultVoices.get(character)!
        };
      }

      // Get from voice assignment system
      const seamManager = SeamManager.getInstance();
      try {
        const voiceAssignmentLogic = seamManager.getVoiceAssignmentLogic();
        
        // Create a minimal character object for voice generation
        const mockCharacter = {
          name: character,
          frequency: 1,
          characteristics: [],
          emotionalStates: [],
          isMainCharacter: character === 'Narrator',
          firstAppearance: 0
        };

        const voiceResult = await voiceAssignmentLogic.generateVoiceProfile(mockCharacter);
        if (voiceResult.success && voiceResult.data) {
          // Cache the default voice
          this.defaultVoices.set(character, voiceResult.data);
          return voiceResult;
        }
      } catch (error) {
        console.warn('Failed to get voice from assignment system:', error);
      }

      // Fallback to a generic voice profile
      const fallbackProfile: VoiceProfile = {
        id: `fallback-${character.toLowerCase()}`,
        name: `${character} Voice`,
        gender: 'neutral',
        age: 'adult',
        tone: 'neutral',
        pitch: 1.0,
        speed: 1.0
      };

      this.defaultVoices.set(character, fallbackProfile);

      return {
        success: true,
        data: fallbackProfile
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get base voice profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async generatePreviewAudio(segment: TextSegment, profile: VoiceProfile): Promise<ContractResult<AudioSegment>> {
    try {
      const seamManager = SeamManager.getInstance();
      const audioGeneration = seamManager.getAudioGenerationPipeline();
      
      return await audioGeneration.generateSegmentAudio(segment, profile);
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate preview audio: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generatePreviewText(character: string, profile: VoiceProfile): string {
    // Choose preview text based on character and tone
    if (character === 'Narrator') {
      return VoiceCustomizer.PREVIEW_TEXTS.narrator;
    }

    switch (profile.tone) {
      case 'dramatic':
        return VoiceCustomizer.PREVIEW_TEXTS.dramatic;
      case 'warm':
        return VoiceCustomizer.PREVIEW_TEXTS.warm;
      case 'cold':
        return VoiceCustomizer.PREVIEW_TEXTS.cold;
      default:
        return VoiceCustomizer.PREVIEW_TEXTS.dialogue;
    }
  }

  private generateCacheKey(character: string, adjustments: VoiceAdjustments): string {
    const adjustmentStr = JSON.stringify(adjustments);
    return `${character}-${btoa(adjustmentStr)}`;
  }

  private clearCharacterPreviewCache(character: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.previewCache.keys()) {
      if (key.startsWith(`${character}-`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.previewCache.delete(key));
  }

  private calculateAdjustments(baseProfile: VoiceProfile, customProfile: VoiceProfile): VoiceAdjustments {
    const adjustments: VoiceAdjustments = {};

    // Calculate pitch adjustment
    const pitchDiff = customProfile.pitch - baseProfile.pitch;
    if (Math.abs(pitchDiff) > 0.01) {
      adjustments.pitch = Math.max(-1.0, Math.min(1.0, pitchDiff / 0.5));
    }

    // Calculate speed adjustment
    const speedDiff = customProfile.speed - baseProfile.speed;
    if (Math.abs(speedDiff) > 0.01) {
      adjustments.speed = Math.max(-1.0, Math.min(1.0, speedDiff / 0.3));
    }

    // Compare tone
    if (customProfile.tone !== baseProfile.tone) {
      adjustments.tone = customProfile.tone;
    }

    return adjustments;
  }

  private async saveToStorage(): Promise<void> {
    try {
      const settings: VoiceSettings = {
        formatVersion: VoiceCustomizer.FORMAT_VERSION,
        characters: Object.fromEntries(this.customVoices.entries()),
        customAdjustments: {},
        metadata: {
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          totalCharacters: this.customVoices.size
        }
      };

      localStorage.setItem(VoiceCustomizer.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save voice settings to storage:', error);
    }
  }

  private async loadStoredSettings(): Promise<void> {
    try {
      const stored = localStorage.getItem(VoiceCustomizer.STORAGE_KEY);
      if (!stored) return;

      const settings: VoiceSettings = JSON.parse(stored);
      
      // Validate and load
      if (settings.formatVersion === VoiceCustomizer.FORMAT_VERSION && settings.characters) {
        this.customVoices.clear();
        for (const [character, profile] of Object.entries(settings.characters)) {
          this.customVoices.set(character, profile);
        }
      }
    } catch (error) {
      console.warn('Failed to load stored voice settings:', error);
    }
  }
}