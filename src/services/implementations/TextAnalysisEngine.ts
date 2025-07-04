import { 
  ITextAnalysisEngine, 
  ContractResult, 
  TextSegment, 
  DialogueMatch, 
  AttributionMatch 
} from '../../types/contracts';

export class TextAnalysisEngine implements ITextAnalysisEngine {
  private static readonly DIALOGUE_PATTERNS = [
    /"([^"]+)"/g,           // Standard quotes
    /'([^']+)'/g,           // Single quotes
    /\"([^\"]+)\"/g,        // Escaped quotes
    /['']([^'']+)['']/g,    // Smart quotes
    /[""]([^""]+)["]/g      // Smart double quotes
  ];

  private static readonly ATTRIBUTION_PATTERNS = [
    /\b(said|asked|replied|answered|whispered|shouted|exclaimed|declared|stated|mentioned|noted|observed|remarked|commented|added|continued|concluded|began|started|finished|ended|interrupted|interjected|mumbled|muttered|gasped|sighed|laughed|cried|sobbed|screamed|yelled|called|announced|proclaimed|insisted|demanded|pleaded|begged|suggested|proposed|offered|promised|threatened|warned|advised|explained|described|revealed|admitted|confessed|agreed|disagreed|argued|protested|complained|grumbled|groaned|moaned|chuckled|giggled|snorted|huffed|puffed|breathed|panted|gasped)\b/gi
  ];

  private static readonly THOUGHT_PATTERNS = [
    /\b(thought|wondered|pondered|considered|reflected|mused|contemplated|reasoned|figured|realized|understood|knew|believed|felt|sensed|imagined|dreamed|hoped|wished|feared|worried|doubted|suspected|assumed|supposed|guessed|expected|anticipated|remembered|recalled|forgot|noticed|observed|saw|heard|smelled|tasted|touched)\b/gi
  ];

  async parseText(text: string): Promise<ContractResult<TextSegment[]>> {
    try {
      const segments: TextSegment[] = [];
      let currentPosition = 0;
      let segmentId = 0;

      // First, identify all dialogue matches
      const dialogueMatches = await this.identifyDialogue(text);
      if (!dialogueMatches.success || !dialogueMatches.data) {
        return { success: false, error: 'Failed to identify dialogue' };
      }

      // Get attribution matches
      const attributionMatches = await this.extractAttributions(text);
      if (!attributionMatches.success || !attributionMatches.data) {
        return { success: false, error: 'Failed to extract attributions' };
      }

      const dialogues = dialogueMatches.data;
      const attributions = attributionMatches.data;

      // Sort all matches by position
      const allMatches = [
        ...dialogues.map(d => ({ ...d, matchType: 'dialogue' as const })),
        ...attributions.map(a => ({ ...a, matchType: 'attribution' as const }))
      ].sort((a, b) => a.startIndex - b.startIndex);

      for (let i = 0; i < allMatches.length; i++) {
        const match = allMatches[i];
        
        // Add narration before this match if there's a gap
        if (match.startIndex > currentPosition) {
          const narrationText = text.slice(currentPosition, match.startIndex).trim();
          if (narrationText) {
            segments.push({
              id: `segment-${segmentId++}`,
              content: narrationText,
              speaker: 'Narrator',
              type: 'narration',
              startPosition: currentPosition,
              endPosition: match.startIndex
            });
          }
        }

        // Add the match itself
        if (match.matchType === 'dialogue') {
          const dialogueMatch = match as DialogueMatch & { matchType: 'dialogue' };
          const speaker = this.findSpeakerForDialogue(dialogueMatch, attributions); // Removed 'text'
          
          segments.push({
            id: `segment-${segmentId++}`,
            content: dialogueMatch.content,
            speaker: speaker || 'Unknown',
            type: dialogueMatch.type,
            startPosition: dialogueMatch.startIndex,
            endPosition: dialogueMatch.endIndex
          });
        }

        currentPosition = match.endIndex;
      }

      // Add final narration if there's remaining text
      if (currentPosition < text.length) {
        const remainingText = text.slice(currentPosition).trim();
        if (remainingText) {
          segments.push({
            id: `segment-${segmentId++}`,
            content: remainingText,
            speaker: 'Narrator',
            type: 'narration',
            startPosition: currentPosition,
            endPosition: text.length
          });
        }
      }

      return {
        success: true,
        data: segments,
        metadata: {
          totalSegments: segments.length,
          dialogueSegments: segments.filter(s => s.type === 'dialogue').length,
          narrationSegments: segments.filter(s => s.type === 'narration').length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Text parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async identifyDialogue(text: string): Promise<ContractResult<DialogueMatch[]>> {
    try {
      const matches: DialogueMatch[] = [];

      for (const pattern of TextAnalysisEngine.DIALOGUE_PATTERNS) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(text)) !== null) {
          const content = match[1];
          if (content && content.trim()) {
            matches.push({
              content: content.trim(),
              startIndex: match.index,
              endIndex: match.index + match[0].length,
              type: 'quote'
            });
          }
        }
      }

      // Identify thoughts based on context
      const thoughtMatches = this.identifyThoughts(text);
      matches.push(...thoughtMatches);

      // Remove duplicates and sort by position
      const uniqueMatches = matches
        .filter((match, index, arr) => 
          arr.findIndex(m => m.startIndex === match.startIndex && m.content === match.content) === index
        )
        .sort((a, b) => a.startIndex - b.startIndex);

      return {
        success: true,
        data: uniqueMatches,
        metadata: { totalMatches: uniqueMatches.length }
      };
    } catch (error) {
      return {
        success: false,
        error: `Dialogue identification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async extractAttributions(text: string): Promise<ContractResult<AttributionMatch[]>> {
    try {
      const matches: AttributionMatch[] = [];

      for (const pattern of TextAnalysisEngine.ATTRIBUTION_PATTERNS) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(text)) !== null) {
          const verb = match[1];
          const position = match.index;
          
          // Find the speaker (usually comes before the attribution verb)
          const speaker = this.findSpeakerNearAttribution(text, position);
          
          if (speaker) {
            matches.push({
              verb: verb.toLowerCase(),
              speaker: speaker,
              position: position,
              confidence: this.calculateAttributionConfidence(verb, speaker, text) // Removed 'position'
            });
          }
        }
      }

      return {
        success: true,
        data: matches.sort((a, b) => a.position - b.position),
        metadata: { totalAttributions: matches.length }
      };
    } catch (error) {
      return {
        success: false,
        error: `Attribution extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private identifyThoughts(text: string): DialogueMatch[] {
    const thoughts: DialogueMatch[] = [];
    
    // Look for thought patterns
    for (const pattern of TextAnalysisEngine.THOUGHT_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(text)) !== null) {
        // Look for the thought content after the thought verb
        const afterMatch = text.slice(match.index + match[0].length);
        const thoughtMatch = afterMatch.match(/^\s*[.,:;]?\s*([^.!?]+)/);
        
        if (thoughtMatch) {
          const content = thoughtMatch[1].trim();
          if (content.length > 5) { // Minimum thought length
            thoughts.push({
              content: content,
              startIndex: match.index + match[0].length + thoughtMatch.index! + thoughtMatch[0].indexOf(content),
              endIndex: match.index + match[0].length + thoughtMatch.index! + thoughtMatch[0].length,
              type: 'thought'
            });
          }
        }
      }
    }
    
    return thoughts;
  }

  private findSpeakerForDialogue(dialogue: DialogueMatch, attributions: AttributionMatch[]): string | null { // Removed 'text'
    // Find the closest attribution before or after the dialogue
    const beforeAttributions = attributions.filter(a => a.position < dialogue.startIndex);
    const afterAttributions = attributions.filter(a => a.position > dialogue.endIndex);
    
    // Prefer attribution that comes after the dialogue (more common pattern)
    if (afterAttributions.length > 0) {
      const closest = afterAttributions.reduce((prev, curr) => 
        curr.position - dialogue.endIndex < prev.position - dialogue.endIndex ? curr : prev
      );
      if (closest.position - dialogue.endIndex < 50) { // Within reasonable distance
        return closest.speaker;
      }
    }
    
    // Fall back to attribution before the dialogue
    if (beforeAttributions.length > 0) {
      const closest = beforeAttributions.reduce((prev, curr) => 
        dialogue.startIndex - curr.position < dialogue.startIndex - prev.position ? curr : prev
      );
      if (dialogue.startIndex - closest.position < 50) { // Within reasonable distance
        return closest.speaker;
      }
    }
    
    return null;
  }

  private findSpeakerNearAttribution(text: string, position: number): string | null {
    // Look for a name within 50 characters before the attribution
    const beforeText = text.slice(Math.max(0, position - 50), position);
    
    // Common name patterns (capitalized words that aren't common words)
    const namePattern = /\b([A-Z][a-z]+)\b(?!\s+(said|asked|replied|the|and|but|or|in|on|at|to|for|of|with|by))/g;
    const matches = Array.from(beforeText.matchAll(namePattern));
    
    if (matches.length > 0) {
      // Return the last (closest) name found
      return matches[matches.length - 1][1];
    }
    
    return null;
  }

  private calculateAttributionConfidence(verb: string, speaker: string, text: string): number { // Removed 'position'
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for common speech verbs
    const commonSpeechVerbs = ['said', 'asked', 'replied', 'answered'];
    if (commonSpeechVerbs.includes(verb.toLowerCase())) {
      confidence += 0.3;
    }
    
    // Higher confidence if speaker appears multiple times
    const speakerRegex = new RegExp(`\\b${speaker}\\b`, 'gi');
    const speakerCount = (text.match(speakerRegex) || []).length;
    if (speakerCount > 1) {
      confidence += Math.min(0.2, speakerCount * 0.05);
    }
    
    return Math.min(1.0, confidence);
  }
}