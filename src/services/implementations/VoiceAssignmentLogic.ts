import { 
  IVoiceAssignmentLogic, 
  ContractResult, 
  Character, 
  VoiceAssignment, 
  VoiceProfile 
} from '../../types/contracts';

export class VoiceAssignmentLogic implements IVoiceAssignmentLogic {
  private static readonly VOICE_TEMPLATES: VoiceProfile[] = [
    // Narrator voices
    {
      id: 'narrator-1',
      name: 'Classic Narrator',
      gender: 'neutral',
      age: 'adult',
      tone: 'neutral',
      pitch: 1.0,
      speed: 0.9
    },
    {
      id: 'narrator-2',
      name: 'Warm Narrator',
      gender: 'neutral',
      age: 'adult',
      tone: 'warm',
      pitch: 0.95,
      speed: 0.85
    },
    
    // Female voices
    {
      id: 'female-1',
      name: 'Sarah Voice',
      gender: 'female',
      age: 'young',
      tone: 'warm',
      pitch: 1.1,
      speed: 1.0
    },
    {
      id: 'female-2',
      name: 'Emma Voice',
      gender: 'female',
      age: 'adult',
      tone: 'neutral',
      pitch: 1.05,
      speed: 0.95
    },
    {
      id: 'female-3',
      name: 'Grace Voice',
      gender: 'female',
      age: 'elderly',
      tone: 'warm',
      pitch: 0.9,
      speed: 0.8
    },
    {
      id: 'female-4',
      name: 'Lily Voice',
      gender: 'female',
      age: 'child',
      tone: 'warm',
      pitch: 1.3,
      speed: 1.1
    },
    
    // Male voices
    {
      id: 'male-1',
      name: 'John Voice',
      gender: 'male',
      age: 'adult',
      tone: 'neutral',
      pitch: 0.85,
      speed: 0.9
    },
    {
      id: 'male-2',
      name: 'David Voice',
      gender: 'male',
      age: 'young',
      tone: 'warm',
      pitch: 0.9,
      speed: 1.0
    },
    {
      id: 'male-3',
      name: 'Robert Voice',
      gender: 'male',
      age: 'elderly',
      tone: 'warm',
      pitch: 0.75,
      speed: 0.8
    },
    {
      id: 'male-4',
      name: 'Tommy Voice',
      gender: 'male',
      age: 'child',
      tone: 'warm',
      pitch: 1.2,
      speed: 1.15
    },
    
    // Dramatic voices
    {
      id: 'dramatic-1',
      name: 'Dramatic Voice',
      gender: 'neutral',
      age: 'adult',
      tone: 'dramatic',
      pitch: 0.95,
      speed: 0.85
    }
  ];

  private static readonly GENDER_NAMES = {
    female: ['Sarah', 'Emma', 'Grace', 'Lily', 'Anna', 'Maria', 'Lisa', 'Kate', 'Amy', 'Eve'],
    male: ['John', 'David', 'Robert', 'Tommy', 'Michael', 'James', 'William', 'Daniel', 'Thomas', 'Mark']
  };

  async assignVoices(characters: Character[]): Promise<ContractResult<VoiceAssignment[]>> {
    try {
      const assignments: VoiceAssignment[] = [];
      const usedVoices = new Set<string>();

      // Sort characters by importance (main characters first, then by frequency)
      const sortedCharacters = [...characters].sort((a, b) => {
        if (a.isMainCharacter && !b.isMainCharacter) return -1;
        if (!a.isMainCharacter && b.isMainCharacter) return 1;
        return b.frequency - a.frequency;
      });

      for (const character of sortedCharacters) {
        const voiceResult = await this.generateVoiceProfile(character);
        if (!voiceResult.success || !voiceResult.data) {
          return {
            success: false,
            error: `Failed to generate voice for character: ${character.name}`
          };
        }

        let voice = voiceResult.data;
        
        // Ensure voice uniqueness
        if (usedVoices.has(voice.id)) {
          voice = this.findAlternativeVoice(voice, usedVoices);
        }

        usedVoices.add(voice.id);

        assignments.push({
          character: character.name,
          voice: voice,
          confidence: this.calculateAssignmentConfidence(character, voice)
        });
      }

      // Validate assignments
      const validationResult = await this.validateAssignments(assignments);
      if (!validationResult.success) {
        return {
          success: false,
          error: `Voice assignment validation failed: ${validationResult.error}`
        };
      }

      return {
        success: true,
        data: assignments,
        metadata: {
          totalAssignments: assignments.length,
          uniqueVoices: usedVoices.size,
          averageConfidence: assignments.reduce((sum, a) => sum + a.confidence, 0) / assignments.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Voice assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async generateVoiceProfile(character: Character): Promise<ContractResult<VoiceProfile>> {
    try {
      // Special handling for narrator
      if (character.name === 'Narrator') {
        const narratorVoice = VoiceAssignmentLogic.VOICE_TEMPLATES.find(v => v.id === 'narrator-1');
        if (narratorVoice) {
          return { success: true, data: narratorVoice };
        }
      }

      // Determine gender from name
      const gender = this.inferGenderFromName(character.name);
      
      // Determine age from characteristics
      const age = this.inferAgeFromCharacteristics(character.characteristics);
      
      // Determine tone from emotional states
      const tone = this.inferToneFromEmotions(character.emotionalStates);

      // Find matching voice template
      const matchingVoices = VoiceAssignmentLogic.VOICE_TEMPLATES.filter(voice => {
        if (voice.gender !== 'neutral' && voice.gender !== gender) return false;
        if (voice.age !== age && voice.age !== 'adult') return false; // Adult as fallback
        return true;
      });

      let selectedVoice: VoiceProfile;
      
      if (matchingVoices.length > 0) {
        // Prefer voices that match tone
        const toneMatches = matchingVoices.filter(v => v.tone === tone);
        selectedVoice = toneMatches.length > 0 ? toneMatches[0] : matchingVoices[0];
      } else {
        // Fallback to a default voice
        selectedVoice = VoiceAssignmentLogic.VOICE_TEMPLATES.find(v => v.gender === gender) || 
                       VoiceAssignmentLogic.VOICE_TEMPLATES[0];
      }

      // Customize the voice for this character
      const customizedVoice: VoiceProfile = {
        ...selectedVoice,
        id: `${character.name.toLowerCase()}-voice`,
        name: `${character.name} Voice`,
        pitch: this.adjustPitchForCharacter(selectedVoice.pitch, character),
        speed: this.adjustSpeedForCharacter(selectedVoice.speed, character)
      };

      return {
        success: true,
        data: customizedVoice,
        metadata: {
          originalTemplate: selectedVoice.id,
          customizations: ['pitch', 'speed', 'name']
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Voice profile generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async validateAssignments(assignments: VoiceAssignment[]): Promise<ContractResult<boolean>> {
    try {
      // Check for duplicate voice assignments
      const voiceIds = assignments.map(a => a.voice.id);
      const uniqueVoiceIds = new Set(voiceIds);
      
      if (uniqueVoiceIds.size !== voiceIds.length) {
        return {
          success: false,
          error: 'Duplicate voice assignments detected'
        };
      }

      // Check that all assignments have valid confidence scores
      const invalidConfidence = assignments.find(a => a.confidence < 0 || a.confidence > 1);
      if (invalidConfidence) {
        return {
          success: false,
          error: `Invalid confidence score for character: ${invalidConfidence.character}`
        };
      }

      // Check that narrator has appropriate voice
      const narratorAssignment = assignments.find(a => a.character === 'Narrator');
      if (narratorAssignment && !narratorAssignment.voice.id.includes('narrator')) {
        return {
          success: false,
          error: 'Narrator assigned non-narrator voice'
        };
      }

      // Ensure minimum voice diversity for main characters
      const mainCharacterAssignments = assignments.filter(a => a.character !== 'Narrator');
      if (mainCharacterAssignments.length > 1) {
        const genders = new Set(mainCharacterAssignments.map(a => a.voice.gender));
        const ages = new Set(mainCharacterAssignments.map(a => a.voice.age));
        
        // Should have some diversity in voice characteristics
        if (genders.size === 1 && ages.size === 1 && mainCharacterAssignments.length > 2) {
          return {
            success: false,
            error: 'Insufficient voice diversity among main characters'
          };
        }
      }

      return {
        success: true,
        data: true,
        metadata: {
          totalAssignments: assignments.length,
          uniqueVoices: uniqueVoiceIds.size,
          validationsPassed: 4
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Assignment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private inferGenderFromName(name: string): 'male' | 'female' | 'neutral' {
    const femaleNames = VoiceAssignmentLogic.GENDER_NAMES.female;
    const maleNames = VoiceAssignmentLogic.GENDER_NAMES.male;
    
    if (femaleNames.some(n => name.toLowerCase().includes(n.toLowerCase()))) {
      return 'female';
    }
    
    if (maleNames.some(n => name.toLowerCase().includes(n.toLowerCase()))) {
      return 'male';
    }
    
    // Additional heuristics based on name endings
    const lowerName = name.toLowerCase();
    if (lowerName.endsWith('a') || lowerName.endsWith('e') || lowerName.endsWith('i')) {
      return 'female';
    }
    
    return 'neutral';
  }

  private inferAgeFromCharacteristics(characteristics: string[]): 'child' | 'young' | 'adult' | 'elderly' {
    const charLower = characteristics.map(c => c.toLowerCase());
    
    if (charLower.some(c => ['child', 'kid', 'young', 'little'].includes(c))) {
      return 'child';
    }
    
    if (charLower.some(c => ['teenager', 'teen', 'youth'].includes(c))) {
      return 'young';
    }
    
    if (charLower.some(c => ['old', 'elderly', 'senior', 'aged'].includes(c))) {
      return 'elderly';
    }
    
    return 'adult';
  }

  private inferToneFromEmotions(emotionalStates: string[]): 'warm' | 'cold' | 'neutral' | 'dramatic' {
    const emotions = emotionalStates.map(e => e.toLowerCase());
    
    if (emotions.some(e => ['angry', 'frustrated', 'dramatic', 'intense'].includes(e))) {
      return 'dramatic';
    }
    
    if (emotions.some(e => ['happy', 'warm', 'kind', 'gentle', 'caring'].includes(e))) {
      return 'warm';
    }
    
    if (emotions.some(e => ['cold', 'distant', 'harsh', 'stern'].includes(e))) {
      return 'cold';
    }
    
    return 'neutral';
  }

  private adjustPitchForCharacter(basePitch: number, character: Character): number {
    let pitch = basePitch;
    
    // Adjust for emotional characteristics
    if (character.emotionalStates.includes('excited')) {
      pitch += 0.05;
    }
    
    if (character.emotionalStates.includes('sad')) {
      pitch -= 0.05;
    }
    
    if (character.emotionalStates.includes('angry')) {
      pitch += 0.1;
    }
    
    // Ensure pitch stays within reasonable bounds
    return Math.max(0.5, Math.min(2.0, pitch));
  }

  private adjustSpeedForCharacter(baseSpeed: number, character: Character): number {
    let speed = baseSpeed;
    
    // Adjust for emotional characteristics
    if (character.emotionalStates.includes('excited')) {
      speed += 0.1;
    }
    
    if (character.emotionalStates.includes('nervous')) {
      speed += 0.05;
    }
    
    if (character.emotionalStates.includes('sad')) {
      speed -= 0.1;
    }
    
    // Ensure speed stays within reasonable bounds
    return Math.max(0.5, Math.min(1.5, speed));
  }

  private findAlternativeVoice(originalVoice: VoiceProfile, usedVoices: Set<string>): VoiceProfile {
    // Find an unused voice with similar characteristics
    const alternatives = VoiceAssignmentLogic.VOICE_TEMPLATES.filter(v => 
      !usedVoices.has(v.id) && 
      v.gender === originalVoice.gender &&
      v.age === originalVoice.age
    );
    
    if (alternatives.length > 0) {
      return alternatives[0];
    }
    
    // Fallback to any unused voice
    const anyUnused = VoiceAssignmentLogic.VOICE_TEMPLATES.find(v => !usedVoices.has(v.id));
    if (anyUnused) {
      return anyUnused;
    }
    
    // Last resort: modify the original voice
    return {
      ...originalVoice,
      id: `${originalVoice.id}-alt`,
      pitch: originalVoice.pitch + 0.1,
      speed: originalVoice.speed + 0.05
    };
  }

  private calculateAssignmentConfidence(character: Character, voice: VoiceProfile): number {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence for narrator
    if (character.name === 'Narrator' && voice.id.includes('narrator')) {
      confidence = 0.95;
    }
    
    // Higher confidence for gender matches
    const inferredGender = this.inferGenderFromName(character.name);
    if (voice.gender === inferredGender || voice.gender === 'neutral') {
      confidence += 0.1;
    }
    
    // Higher confidence for main characters
    if (character.isMainCharacter) {
      confidence += 0.1;
    }
    
    // Higher confidence if character has many lines
    if (character.frequency > 5) {
      confidence += 0.05;
    }
    
    return Math.min(1.0, confidence);
  }
}