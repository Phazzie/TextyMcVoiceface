import { 
  ICharacterDetectionSystem, 
  ContractResult, 
  Character, 
  TextSegment 
} from '../../types/contracts';

export class CharacterDetectionSystem implements ICharacterDetectionSystem {
  private static readonly COMMON_WORDS = new Set([
    'the', 'and', 'but', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'said', 'asked', 'replied', 'answered', 'he', 'she', 'it', 'they', 'him', 'her',
    'his', 'hers', 'their', 'this', 'that', 'these', 'those', 'a', 'an', 'was', 'were',
    'is', 'are', 'been', 'being', 'have', 'has', 'had', 'will', 'would', 'could', 'should'
  ]);

  private static readonly EMOTIONAL_INDICATORS = {
    angry: ['shouted', 'yelled', 'screamed', 'snapped', 'growled', 'snarled', 'barked'],
    sad: ['cried', 'sobbed', 'wept', 'whispered', 'sighed', 'moaned'],
    happy: ['laughed', 'giggled', 'chuckled', 'exclaimed', 'cheered'],
    excited: ['exclaimed', 'shouted', 'called', 'announced'],
    nervous: ['stuttered', 'stammered', 'whispered', 'muttered', 'hesitated'],
    confident: ['declared', 'announced', 'stated', 'proclaimed', 'asserted']
  };

  async detectCharacters(segments: TextSegment[]): Promise<ContractResult<Character[]>> {
    try {
      const characterMap = new Map<string, Character>();
      
      // Add narrator as default character
      characterMap.set('Narrator', {
        name: 'Narrator',
        frequency: 0,
        characteristics: ['storyteller', 'neutral'],
        emotionalStates: ['neutral'],
        isMainCharacter: true,
        firstAppearance: 0
      });

      // Analyze each segment for character information
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        if (segment.speaker === 'Narrator') {
          const narrator = characterMap.get('Narrator')!;
          narrator.frequency++;
          continue;
        }

        // Get or create character
        let character = characterMap.get(segment.speaker);
        if (!character) {
          character = {
            name: segment.speaker,
            frequency: 0,
            characteristics: [],
            emotionalStates: [],
            isMainCharacter: false,
            firstAppearance: i
          };
          characterMap.set(segment.speaker, character);
        }

        character.frequency++;

        // Analyze character traits from this segment
        const traits = await this.analyzeCharacterTraits(segment.speaker, [segment]);
        if (traits.success && traits.data) {
          // Merge characteristics without duplicates
          const newCharacteristics = traits.data.characteristics.filter(
            c => !character!.characteristics.includes(c)
          );
          character.characteristics.push(...newCharacteristics);

          // Merge emotional states without duplicates
          const newEmotionalStates = traits.data.emotionalStates.filter(
            e => !character!.emotionalStates.includes(e)
          );
          character.emotionalStates.push(...newEmotionalStates);
        }
      }

      // Determine main characters (appear frequently or early)
      const characters = Array.from(characterMap.values());
      const totalSegments = segments.length;
      const frequencyThreshold = Math.max(2, Math.floor(totalSegments * 0.1)); // At least 10% of segments or 2 appearances

      characters.forEach(character => {
        if (character.name === 'Narrator') {
          character.isMainCharacter = true;
        } else {
          character.isMainCharacter = character.frequency >= frequencyThreshold || character.firstAppearance < 3;
        }
      });

      // Sort by frequency (main characters first, then by appearance order)
      characters.sort((a, b) => {
        if (a.isMainCharacter && !b.isMainCharacter) return -1;
        if (!a.isMainCharacter && b.isMainCharacter) return 1;
        if (a.frequency !== b.frequency) return b.frequency - a.frequency;
        return a.firstAppearance - b.firstAppearance;
      });

      return {
        success: true,
        data: characters,
        metadata: {
          totalCharacters: characters.length,
          mainCharacters: characters.filter(c => c.isMainCharacter).length,
          totalSegments: segments.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Character detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async identifySpeakers(text: string): Promise<ContractResult<string[]>> {
    try {
      const speakers = new Set<string>();
      
      // Find proper nouns (potential character names)
      const namePattern = /\b([A-Z][a-z]+)\b/g;
      let match;
      
      while ((match = namePattern.exec(text)) !== null) {
        const word = match[1];
        
        // Skip common words and short names
        if (!CharacterDetectionSystem.COMMON_WORDS.has(word.toLowerCase()) && word.length > 2) {
          // Check if this word appears in dialogue context
          const beforeContext = text.slice(Math.max(0, match.index - 30), match.index);
          const afterContext = text.slice(match.index + word.length, match.index + word.length + 30);
          
          // Look for speech attribution patterns
          const hasAttributionBefore = /\b(said|asked|replied|answered|whispered|shouted|exclaimed)\s*$/i.test(beforeContext);
          const hasAttributionAfter = /^\s*(said|asked|replied|answered|whispered|shouted|exclaimed)\b/i.test(afterContext);
          
          if (hasAttributionBefore || hasAttributionAfter) {
            speakers.add(word);
          }
        }
      }

      // Always include Narrator
      speakers.add('Narrator');

      return {
        success: true,
        data: Array.from(speakers).sort(),
        metadata: { totalSpeakers: speakers.size }
      };
    } catch (error) {
      return {
        success: false,
        error: `Speaker identification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async analyzeCharacterTraits(name: string, segments: TextSegment[]): Promise<ContractResult<Character>> {
    try {
      const characteristics: string[] = [];
      const emotionalStates: string[] = [];
      
      // Analyze segments where this character appears
      for (const segment of segments) {
        if (segment.speaker !== name) continue;

        const content = segment.content.toLowerCase();
        
        // Analyze emotional states from dialogue content
        if (segment.type === 'dialogue') {
          // Exclamation marks suggest excitement or emotion
          if (content.includes('!')) {
            emotionalStates.push('excited');
          }
          
          // Question marks suggest curiosity or confusion
          if (content.includes('?')) {
            emotionalStates.push('curious');
          }
          
          // All caps suggests shouting
          if (segment.content.match(/[A-Z]{3,}/)) {
            emotionalStates.push('angry');
          }
          
          // Analyze content for emotional keywords
          if (content.includes('please') || content.includes('sorry')) {
            emotionalStates.push('polite');
          }
          
          if (content.includes('damn') || content.includes('hell')) {
            emotionalStates.push('frustrated');
          }
        }

        // Check for mood indicators in the segment
        if (segment.mood) {
          emotionalStates.push(segment.mood);
        }
      }

      // Analyze attribution verbs to determine emotional states
      const characterSegments = segments.filter(s => s.speaker === name);
      for (const segment of characterSegments) {
        for (const [emotion, verbs] of Object.entries(CharacterDetectionSystem.EMOTIONAL_INDICATORS)) {
          for (const verb of verbs) {
            // This would ideally check the surrounding text for attribution verbs
            // For now, we'll use the segment content and mood
            if (segment.content.toLowerCase().includes(verb)) {
              emotionalStates.push(emotion);
            }
          }
        }
      }

      // Determine characteristics based on frequency and patterns
      const frequency = segments.filter(s => s.speaker === name).length;
      const isMainCharacter = frequency > 2;
      
      if (name === 'Narrator') {
        characteristics.push('storyteller', 'neutral', 'observant');
      } else {
        if (isMainCharacter) {
          characteristics.push('protagonist');
        }
        
        // Infer characteristics from emotional patterns
        const emotionCounts = emotionalStates.reduce((acc, emotion) => {
          acc[emotion] = (acc[emotion] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const dominantEmotion = Object.entries(emotionCounts)
          .sort(([,a], [,b]) => b - a)[0];
        
        if (dominantEmotion && dominantEmotion[1] > 1) {
          characteristics.push(dominantEmotion[0]);
        }
      }

      // Remove duplicates
      const uniqueCharacteristics = Array.from(new Set(characteristics));
      const uniqueEmotionalStates = Array.from(new Set(emotionalStates));

      const character: Character = {
        name,
        frequency,
        characteristics: uniqueCharacteristics,
        emotionalStates: uniqueEmotionalStates,
        isMainCharacter,
        firstAppearance: segments.findIndex(s => s.speaker === name)
      };

      return {
        success: true,
        data: character,
        metadata: {
          totalSegments: segments.length,
          characterSegments: characterSegments.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Character trait analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}