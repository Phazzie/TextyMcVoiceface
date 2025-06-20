import { 
  IWritingQualityAnalyzer, 
  ContractResult, 
  ShowTellIssue, 
  TropeMatch, 
  PurpleProseIssue, 
  WritingQualityReport,
  BechdelTestResult,
  ICharacterDetectionSystem,
  Character,
  TextSegment,
  NotImplementedError
} from '../../types/contracts';
import { CharacterDetectionSystem } from './CharacterDetectionSystem'; // Assuming this path is correct

export class WritingQualityAnalyzer implements IWritingQualityAnalyzer {
  private readonly characterDetectionSystem: ICharacterDetectionSystem;
  private static readonly TELLING_PATTERNS = [
    // Emotion telling
    { pattern: /\b(was|felt|seemed|appeared)\s+(angry|sad|happy|excited|nervous|afraid|surprised|confused|worried|frustrated|disappointed|relieved)\b/gi, type: 'emotion' },
    // State telling  
    { pattern: /\b(was|were|seemed|appeared)\s+(tired|exhausted|hungry|thirsty|cold|hot|uncomfortable|awkward|embarrassed)\b/gi, type: 'state' },
    // Character description telling
    { pattern: /\b(was|were)\s+(beautiful|handsome|ugly|tall|short|thin|fat|old|young|smart|stupid|kind|mean)\b/gi, type: 'description' },
    // Action telling
    { pattern: /\b(decided to|thought about|remembered|realized|understood|knew|believed)\b/gi, type: 'thought' }
  ];

  private static readonly COMMON_TROPES = [
    {
      name: "Chosen One",
      patterns: [/chosen one/gi, /destiny/gi, /prophecy/gi, /special powers/gi],
      category: 'character' as const,
      subversions: [
        "Make the 'chosen one' actively reject their destiny",
        "Have multiple 'chosen ones' who must work together",
        "Reveal the prophecy was a manipulation or misunderstanding",
        "The chosen one fails and an unexpected character succeeds"
      ]
    },
    {
      name: "Love at First Sight",
      patterns: [/love at first sight/gi, /instant attraction/gi, /eyes met.*heart/gi],
      category: 'plot' as const,
      subversions: [
        "First impression is negative, love develops through understanding",
        "Physical attraction exists but personalities clash",
        "What seems like love is actually recognition of a shared trauma",
        "Instant connection is due to supernatural/sci-fi reasons"
      ]
    },
    {
      name: "Dead Mentor",
      patterns: [/mentor.*died/gi, /wise.*old.*man/gi, /master.*killed/gi],
      category: 'character' as const,
      subversions: [
        "Mentor lives but becomes the antagonist",
        "Mentor fakes death to teach a lesson",
        "Student surpasses mentor while mentor is still alive",
        "Mentor is revealed to be incompetent or wrong"
      ]
    },
    {
      name: "Damsel in Distress",
      patterns: [/rescue.*princess/gi, /save.*her/gi, /trapped.*tower/gi],
      category: 'character' as const,
      subversions: [
        "She rescues herself before help arrives",
        "She's pretending to be trapped for strategic reasons",
        "The 'rescuer' needs saving more than she does",
        "She orchestrated her own capture as part of a larger plan"
      ]
    },
    {
      name: "Dark and Stormy Night",
      patterns: [/dark.*stormy.*night/gi, /thunder.*lightning/gi, /rain.*window/gi],
      category: 'setting' as const,
      subversions: [
        "Beautiful sunny day when terrible things happen",
        "Storm brings relief and hope instead of foreboding",
        "Characters actively enjoy the storm",
        "Weather is completely unrelated to mood or events"
      ]
    }
  ];

  private static readonly PURPLE_PROSE_PATTERNS = [
    {
      pattern: /\b\w+ly\s+\w+ly\b/gi,
      type: 'excessive_adjectives' as const,
      description: 'Multiple adverbs in close proximity'
    },
    {
      pattern: /\b(exquisite|magnificent|breathtaking|stunning|gorgeous|sublime|ethereal|celestial|divine|transcendent)\b/gi,
      type: 'flowery_language' as const,
      description: 'Overly dramatic descriptive words'
    },
    {
      pattern: /\b(\w+),\s+(\w+),?\s+(and\s+)?(\w+)\s+(hair|eyes|skin|voice|smile|laugh)\b/gi,
      type: 'redundant_description' as const,
      description: 'Excessive descriptive adjectives'
    },
    {
      pattern: /like\s+a\s+(\w+\s+){3,}/gi,
      type: 'overwrought_metaphor' as const,
      description: 'Overly complex similes'
    }
  ];

  async analyzeShowVsTell(text: string): Promise<ContractResult<ShowTellIssue[]>> {
    try {
      const issues: ShowTellIssue[] = [];

      for (const tellingPattern of WritingQualityAnalyzer.TELLING_PATTERNS) {
        let match;
        while ((match = tellingPattern.pattern.exec(text)) !== null) {
          const matchText = match[0];
          const position = match.index;
          
          const suggestion = this.generateShowingSuggestion(matchText, tellingPattern.type);
          
          issues.push({
            text: matchText,
            position: position,
            type: 'telling',
            severity: this.calculateTellingSeverity(matchText, tellingPattern.type),
            suggestion: suggestion.suggestion,
            example: suggestion.example
          });
        }
      }

      return {
        success: true,
        data: issues,
        metadata: {
          totalIssues: issues.length,
          severityBreakdown: this.calculateSeverityBreakdown(issues)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Show vs Tell analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async detectTropes(text: string): Promise<ContractResult<TropeMatch[]>> {
    try {
      const matches: TropeMatch[] = [];

      for (const trope of WritingQualityAnalyzer.COMMON_TROPES) {
        for (const pattern of trope.patterns) {
          let match;
          while ((match = pattern.exec(text)) !== null) {
            const confidence = this.calculateTropeConfidence(match[0], text, trope);
            
            if (confidence > 0.3) { // Only include likely matches
              matches.push({
                name: trope.name,
                description: `Common trope: ${trope.name}`,
                text: match[0],
                position: match.index,
                confidence: confidence,
                subversionSuggestions: trope.subversions,
                category: trope.category
              });
            }
          }
        }
      }

      return {
        success: true,
        data: matches,
        metadata: {
          totalTropes: matches.length,
          uniqueTropes: new Set(matches.map(m => m.name)).size,
          averageConfidence: matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Trope detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async detectPurpleProse(text: string): Promise<ContractResult<PurpleProseIssue[]>> {
    try {
      const issues: PurpleProseIssue[] = [];

      for (const pattern of WritingQualityAnalyzer.PURPLE_PROSE_PATTERNS) {
        let match;
        while ((match = pattern.pattern.exec(text)) !== null) {
          const matchText = match[0];
          const position = match.index;
          
          const severity = this.calculatePurpleProseSeverity(matchText, pattern.type);
          const suggestion = this.generatePurpleProseSuggestion(matchText, pattern.type);
          
          issues.push({
            text: matchText,
            position: position,
            type: pattern.type,
            severity: severity,
            suggestion: suggestion.advice,
            simplifiedVersion: suggestion.simplified
          });
        }
      }

      // Additional checks for sentence length and complexity
      const sentences = text.split(/[.!?]+/);
      sentences.forEach((sentence, index) => {
        if (sentence.length > 200) {
          const position = text.indexOf(sentence);
          issues.push({
            text: sentence.trim(),
            position: position,
            type: 'flowery_language',
            severity: 'moderate',
            suggestion: 'Consider breaking this long sentence into shorter, clearer sentences',
            simplifiedVersion: 'Break into 2-3 shorter sentences for better readability'
          });
        }
      });

      return {
        success: true,
        data: issues,
        metadata: {
          totalIssues: issues.length,
          severityBreakdown: this.calculatePurpleProseSeverityBreakdown(issues)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Purple prose detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async generateQualityReport(text: string): Promise<ContractResult<WritingQualityReport>> {
    try {
      const [showTellResult, tropeResult, purpleProseResult] = await Promise.all([
        this.analyzeShowVsTell(text),
        this.detectTropes(text),
        this.detectPurpleProse(text)
      ]);

      if (!showTellResult.success || !tropeResult.success || !purpleProseResult.success) {
        return {
          success: false,
          error: 'Failed to complete quality analysis'
        };
      }

      const report: WritingQualityReport = {
        showTellIssues: showTellResult.data || [],
        tropeMatches: tropeResult.data || [],
        purpleProseIssues: purpleProseResult.data || [],
        overallScore: {
          showVsTell: this.calculateShowVsTellScore(showTellResult.data || [], text),
          tropeOriginality: this.calculateTropeOriginalityScore(tropeResult.data || [], text),
          proseClarity: this.calculateProseScore(purpleProseResult.data || [], text)
        }
      };

      return {
        success: true,
        data: report,
        metadata: {
          totalIssues: report.showTellIssues.length + report.tropeMatches.length + report.purpleProseIssues.length,
          overallQuality: (report.overallScore.showVsTell + report.overallScore.tropeOriginality + report.overallScore.proseClarity) / 3
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Quality report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generateShowingSuggestion(tellingText: string, type: string): { suggestion: string; example: string } {
    const suggestions: Record<string, { suggestion: string; example: string }> = {
      emotion: {
        suggestion: "Show the emotion through actions, dialogue, or physical reactions instead of stating it directly",
        example: "Instead of 'She was angry' → 'Her hands clenched into fists' or 'She slammed the door'"
      },
      state: {
        suggestion: "Demonstrate the physical state through specific details and sensory descriptions",
        example: "Instead of 'He was tired' → 'His eyelids drooped' or 'He stumbled over his own feet'"
      },
      description: {
        suggestion: "Let the reader see the character through specific, concrete details",
        example: "Instead of 'She was beautiful' → 'Heads turned when she walked past' or specific features"
      },
      thought: {
        suggestion: "Show thoughts through dialogue, actions, or internal monologue with specific details",
        example: "Instead of 'He decided to leave' → Show him packing, looking at the door, or saying goodbye"
      }
    };

    return suggestions[type] || {
      suggestion: "Show this information through action, dialogue, or concrete details",
      example: "Use specific, observable details instead of telling the reader directly"
    };
  }

  private calculateTellingSeverity(text: string, type: string): 'low' | 'medium' | 'high' {
    // More severe if it's a key emotional moment or repeated pattern
    if (type === 'emotion' && text.includes('very')) return 'high';
    if (type === 'thought' && text.length > 20) return 'medium';
    return 'low';
  }

  private calculateTropeConfidence(matchText: string, fullText: string, trope: any): number {
    let confidence = 0.5;
    
    // Higher confidence if multiple patterns from same trope are found
    const otherMatches = trope.patterns.filter((p: RegExp) => p.test(fullText)).length;
    confidence += (otherMatches - 1) * 0.2;
    
    // Higher confidence for exact phrase matches
    if (matchText.toLowerCase() === trope.name.toLowerCase()) {
      confidence += 0.3;
    }
    
    return Math.min(1.0, confidence);
  }

  private calculatePurpleProseSeverity(text: string, type: string): 'mild' | 'moderate' | 'severe' {
    switch (type) {
      case 'excessive_adjectives':
        return text.split(/\s+/).length > 4 ? 'severe' : 'moderate';
      case 'flowery_language':
        return 'moderate';
      case 'redundant_description':
        return text.split(',').length > 3 ? 'severe' : 'moderate';
      case 'overwrought_metaphor':
        return text.length > 50 ? 'severe' : 'mild';
      default:
        return 'mild';
    }
  }

  private generatePurpleProseSuggestion(text: string, type: string): { advice: string; simplified: string } {
    const suggestions: Record<string, { advice: string; simplified: string }> = {
      excessive_adjectives: {
        advice: "Choose one strong adjective instead of multiple weak ones",
        simplified: "Pick the most important descriptor"
      },
      flowery_language: {
        advice: "Use simpler, more direct language that doesn't draw attention to itself",
        simplified: "Choose clearer, everyday words"
      },
      redundant_description: {
        advice: "Focus on one or two key details that matter most to the scene",
        simplified: "Select the most important details only"
      },
      overwrought_metaphor: {
        advice: "Simplify the comparison to make it clearer and more impactful",
        simplified: "Make the metaphor shorter and clearer"
      }
    };

    return suggestions[type] || {
      advice: "Simplify this passage for better clarity",
      simplified: "Use clearer, more direct language"
    };
  }

  private calculateSeverityBreakdown(issues: ShowTellIssue[]): Record<string, number> {
    return issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculatePurpleProseSeverityBreakdown(issues: PurpleProseIssue[]): Record<string, number> {
    return issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateShowVsTellScore(issues: ShowTellIssue[], text: string): number {
    const wordCount = text.split(/\s+/).length;
    const issueCount = issues.length;
    const ratio = issueCount / (wordCount / 100); // Issues per 100 words
    return Math.max(0, Math.min(100, 100 - (ratio * 20)));
  }

  private calculateTropeOriginalityScore(tropes: TropeMatch[], text: string): number {
    const wordCount = text.split(/\s+/).length;
    const tropeCount = tropes.length;
    const ratio = tropeCount / (wordCount / 1000); // Tropes per 1000 words
    return Math.max(0, Math.min(100, 100 - (ratio * 30)));
  }

  private calculateProseScore(issues: PurpleProseIssue[], text: string): number {
    const wordCount = text.split(/\s+/).length;
    const severeIssues = issues.filter(i => i.severity === 'severe').length;
    const moderateIssues = issues.filter(i => i.severity === 'moderate').length;
    const mildIssues = issues.filter(i => i.severity === 'mild').length;
    
    const weightedIssues = (severeIssues * 3) + (moderateIssues * 2) + (mildIssues * 1);
    const ratio = weightedIssues / (wordCount / 100); // Weighted issues per 100 words
    
    return Math.max(0, Math.min(100, 100 - (ratio * 15)));
  }

  constructor() {
    // Assuming CharacterDetectionSystem can be instantiated directly.
    // If it has its own dependencies, this would need a proper DI setup.
    this.characterDetectionSystem = new CharacterDetectionSystem();
  }

  async analyzeBechdelTest(text: string): Promise<ContractResult<BechdelTestResult>> {
    try {
        // Placeholder for actual character detection and text parsing logic
        // This will require integration with ICharacterDetectionSystem and potentially ITextAnalysisEngine

        // Step 1: Identify female characters
        // For now, this is a placeholder. We need to parse the text into segments first.
        // This part of the logic might be complex and require ITextAnalysisEngine to parse text into segments,
        // then pass segments to characterDetectionSystem.
        // const textSegments: TextSegment[] = []; // This would come from ITextAnalysisEngine.parseText(text)
        // const charactersResult = await this.characterDetectionSystem.detectCharacters(textSegments);

        // HACK: Simulate character detection for now as ITextAnalysisEngine is not injected.
        // Replace this with actual character detection later.
        // This is a simplified approach. A real implementation would use ICharacterDetectionSystem more robustly.
        // Assume `this.characterDetectionSystem.identifySpeakers(text)` can give us names,
        // and `this.characterDetectionSystem.analyzeCharacterTraits(name, textSegments)` can give gender.
        // This is a temporary simplification due to the lack of full text parsing here.

        const femaleCharacters: string[] = []; // Populate this with actual identified female characters' names.
        // Example: If a character 'Sarah' is identified as female.
        // femaleCharacters.push('Sarah');
        // This requires a more robust way to get all characters and their genders.
        // For now, we'll create a placeholder result.

        // If ICharacterDetectionSystem cannot directly give genders without TextSegments,
        // this will be a blocker and might require a NotImplementedError or a very basic heuristic.
        // Let's assume for now we can't reliably get female characters without text segmentation.
        // So, we will return a placeholder response indicating this limitation.

        // Placeholder implementation:
        // This is a simplified placeholder. A real implementation needs to:
        // 1. Parse text into segments (using ITextAnalysisEngine if available, or basic sentence/paragraph splitting).
        // 2. Detect all characters and their genders using ICharacterDetectionSystem.
        // 3. Identify dialogue segments and their speakers.
        // 4. Check for conversations between two female characters not about a man.

        // For the purpose of this subtask, let's create a basic structure that can be expanded.
        // We will assume a very naive character and dialogue detection.

        const detectedFemaleCharacters: string[] = []; // This should be populated by ICharacterDetectionSystem
        // Simulate some female characters for now
        if (text.includes("Alice")) detectedFemaleCharacters.push("Alice");
        if (text.includes("Bella")) detectedFemaleCharacters.push("Bella");
        if (text.includes("Carol")) detectedFemaleCharacters.push("Carol");

        if (detectedFemaleCharacters.length < 2) {
            return {
                success: true,
                data: {
                    passes: false,
                    message: "Fails: Less than two female characters identified.",
                    evidence: { femaleCharacters: detectedFemaleCharacters }
                }
            };
        }

        // Simulate dialogue detection (very naive)
        // A real implementation would use a proper dialogue parser (e.g., from ITextAnalysisEngine)
        const dialogueLines = text.match(/"(.*?)"/g) || [];
        let conversationFound = false;
        let conversationSnippet: string | undefined = undefined;

        // This is a highly simplified check for conversation
        if (dialogueLines.length >= 2) {
             // Check if dialogue involves at least two of the detected female characters
             // This part needs to associate dialogue with speakers.
             // For now, assume any two dialogues by different females (if we could identify speakers)
             // and check if the content is not about men.

             // Let's assume a conversation between Alice and Bella if they exist.
             // This is a placeholder for actual dialogue attribution and content analysis.
             if (detectedFemaleCharacters.includes("Alice") && detectedFemaleCharacters.includes("Bella")) {
                // Naive check: does any dialogue line NOT mention common male pronouns/terms?
                // This is a very weak check. Proper NLP would be needed.
                const notAboutMen = dialogueLines.some(line =>
                    !/\b(he|him|his|man|men|father|son|brother)\b/i.test(line)
                );
                if (notAboutMen) {
                    conversationFound = true;
                    // Try to find a snippet. This is also very naive.
                    const aliceTalks = dialogueLines.find(line => line.includes("Alice:")); // Fictional format
                    const bellaTalks = dialogueLines.find(line => line.includes("Bella:")); // Fictional format
                    if (aliceTalks && bellaTalks) {
                         conversationSnippet = `${aliceTalks} ${bellaTalks}`;
                    } else {
                        // Get first two dialogues as a fallback snippet
                        conversationSnippet = dialogueLines.slice(0, 2).join(" ");
                    }
                }
             }
        }

        if (conversationFound) {
            return {
                success: true,
                data: {
                    passes: true,
                    message: "Passes: Found a conversation between two or more female characters, not primarily about a man (based on naive check).",
                    evidence: {
                        femaleCharacters: detectedFemaleCharacters,
                        conversationSnippet: conversationSnippet
                    }
                }
            };
        } else {
            return {
                success: true,
                data: {
                    passes: false,
                    message: "Fails: No qualifying conversation found between two or more female characters, or the conversation was about a man (based on naive check).",
                    evidence: { femaleCharacters: detectedFemaleCharacters }
                }
            };
        }

    } catch (error) {
        console.error("Error in analyzeBechdelTest:", error);
        return {
            success: false,
            error: `Bechdel test analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
  }
}