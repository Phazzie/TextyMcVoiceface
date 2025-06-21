import { 
  IWritingQualityAnalyzer, 
  ContractResult, 
  ReadabilityPoint,
  ShowTellIssue,
  TropeMatch,
  PurpleProseIssue,
  WritingQualityReport,
  EchoChamberResult,
  TextSegment,
  DialogueTurn, // Added DialogueTurn
} from '../../types/contracts';
import { TextAnalysisEngine } from './TextAnalysisEngine'; // Corrected import path

export class WritingQualityAnalyzer implements IWritingQualityAnalyzer {
  private static readonly STOP_WORDS: string[] = [
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
    "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
    "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
    "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
    "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
    "they've", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
    "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
    "yourself", "yourselves",
    // Common contractions often missed
    "ain't", "gonna", "wanna",
    // Single letters that might appear after tokenization if not handled well by regex, though current regex \W+ should prevent most.
    "b", "c", "d", "e", "f", "g", "h", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"
  ];
  private textAnalysisEngine = new TextAnalysisEngine();

  // Method to count syllables in a word (heuristic)
  private countSyllables(word: string): number {
    if (!word) return 0;
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 0;
  }

  // Method to count words in a text
  private countWords(text: string): number {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }

  // Method to count sentences in a text
  private countSentences(text: string): number {
    if (!text.trim()) return 0;
    // Split by sentence-ending punctuation. Filter out empty strings that might result from multiple punctuation marks.
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.length || 1; // Ensure at least 1 sentence if there's text, to avoid division by zero.
  }

  async analyzeReadabilityRollercoaster(text: string): Promise<ContractResult<ReadabilityPoint[]>> {
    try {
      if (!text || text.trim() === "") {
        return { success: true, data: [] };
      }

      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim() !== ""); // Split by one or more empty lines
      const readabilityPoints: ReadabilityPoint[] = [];

      paragraphs.forEach((paragraph, index) => {
        const words = this.countWords(paragraph);
        const sentences = this.countSentences(paragraph);
        let syllables = 0;
        paragraph.trim().split(/\s+/).forEach(word => {
          syllables += this.countSyllables(word);
        });

        let score = 0;
        if (words > 0 && sentences > 0) {
          const wordsPerSentence = words / sentences;
          const syllablesPerWord = syllables / words;
          score = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
        } else if (words > 0) { // Handle case with words but no sentences (e.g. a list) - assign a low score
          score = 30; // Arbitrary low score for paragraphs without sentences
        }
        // If words = 0, score remains 0, which is fine for empty paragraphs (though filtered)

        readabilityPoints.push({
          paragraphIndex: index,
          score: Math.round(score * 100) / 100, // Round to two decimal places
        });
      });

      return { success: true, data: readabilityPoints, metadata: { paragraphCount: paragraphs.length } };
    } catch (error) {
      console.error("Error in analyzeReadabilityRollercoaster:", error);
      return {
        success: false,
        error: `Readability analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

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

  async detectEchoChamber(text: string): Promise<ContractResult<EchoChamberResult[]>> {
    try {
      const segmentsResult = await this.textAnalysisEngine.parseText(text);
      if (!segmentsResult.success || !segmentsResult.data) {
        return { success: false, error: segmentsResult.error || "Failed to parse text for echo chamber detection." };
      }

      const dialogueSegments = segmentsResult.data.filter(
        (segment): segment is TextSegment & { speaker: string } => // Type guard
          segment.type === 'dialogue' &&
          typeof segment.speaker === 'string' && // Ensure speaker is a string
          segment.speaker.trim() !== '' && // Ensure speaker is not empty
          segment.speaker !== 'Narrator'
      );

      if (dialogueSegments.length === 0) {
        return { success: true, data: [] }; // No dialogue, so no echo chamber
      }

      const characterWordCounts = new Map<string, Map<string, number>>();

      for (const segment of dialogueSegments) {
        const speaker = segment.speaker;
        const words = segment.content
          .toLowerCase()
          .split(/\W+/) // Split by non-alphanumeric characters
          .filter(word => word.length > 0); // Remove empty strings

        if (!characterWordCounts.has(speaker)) {
          characterWordCounts.set(speaker, new Map<string, number>());
        }
        const speakerWordMap = characterWordCounts.get(speaker)!;

        for (const word of words) {
          if (!WritingQualityAnalyzer.STOP_WORDS.includes(word)) {
            speakerWordMap.set(word, (speakerWordMap.get(word) || 0) + 1);
          }
        }
      }

      const echoedWordsRaw = new Map<string, { frequency: number; characters: Set<string> }>();

      for (const [character, wordMap] of characterWordCounts) {
        for (const [word, count] of wordMap) {
          if (!echoedWordsRaw.has(word)) {
            echoedWordsRaw.set(word, { frequency: 0, characters: new Set<string>() });
          }
          const currentWordData = echoedWordsRaw.get(word)!;
          currentWordData.frequency += count;
          currentWordData.characters.add(character);
        }
      }

      const echoChamberResultsArray: EchoChamberResult[] = [];
      for (const [word, data] of echoedWordsRaw) {
        if (data.characters.size > 1) { // Word used by more than one character
          echoChamberResultsArray.push({
            word,
            frequency: data.frequency,
            characters: Array.from(data.characters),
          });
        }
      }

      // Sort by frequency (descending) then by word (ascending)
      echoChamberResultsArray.sort((a, b) => {
        if (b.frequency !== a.frequency) {
          return b.frequency - a.frequency;
        }
        return a.word.localeCompare(b.word);
      });

      return { success: true, data: echoChamberResultsArray };
    } catch (error) {
      return {
        success: false,
        error: `Echo chamber detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async analyzeDialoguePowerBalance(sceneText: string): Promise<ContractResult<DialogueTurn[]>> {
    try {
      const segmentsResult = await this.textAnalysisEngine.parseText(sceneText);
      if (!segmentsResult.success || !segmentsResult.data) {
        return { success: false, error: segmentsResult.error || "Failed to parse text for power balance analysis." };
      }

      const dialogueSegments = segmentsResult.data.filter(
        (segment): segment is TextSegment & { speaker: string } =>
          segment.type === 'dialogue' &&
          typeof segment.speaker === 'string' &&
          segment.speaker.trim() !== '' &&
          segment.speaker.toLowerCase() !== 'narrator'
      );

      if (dialogueSegments.length === 0) {
        return { success: true, data: [] };
      }

      const HEDGE_WORDS = ['maybe', 'perhaps', 'sort of', 'kind of', 'i think', 'i guess', 'possibly', 'could be', 'might be', 'a little', 'somewhat', 'arguably', 'potentially', 'presumably'];
      const INTENSIFIER_WORDS = ['very', 'really', 'absolutely', 'definitely', 'totally', 'completely', 'extremely', 'highly', 'never', 'always', 'must', 'certainly', 'undoubtedly'];
      const POLITENESS_KEYWORDS = ['please', 'thank you', 'sir', 'madam', 'ma\'am', 'pardon me', 'excuse me', 'mr.', 'mrs.', 'ms.'];
      const QUESTION_WORDS = ['who', 'what', 'when', 'where', 'why', 'how', 'is', 'are', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'may', 'might'];
      const COMMAND_VERBS = ['go', 'do', 'tell', 'give', 'take', 'bring', 'stop', 'start', 'listen', 'look', 'come', 'leave', 'wait', 'hurry']; // Simple list, could be expanded
      const TERMINATION_PHRASES = ["this conversation is over", "i have nothing more to say", "we're done here", "goodbye", "i'm leaving"];

      const dialogueTurns: DialogueTurn[] = [];
      let previousTurnTopics: Set<string> = new Set();
      let lastSpeaker = "";

      for (let i = 0; i < dialogueSegments.length; i++) {
        const segment = dialogueSegments[i];
        const text = segment.content.toLowerCase();
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;

        let powerScore = 0;
        // Ensure all metric components are initialized for each turn
        let isQuestion = false;
        let interruptions = 0;
        let hedgeCount = 0;
        let intensifierCount = 0;
        let topicChanged = false;
        let detectedTactic: DialogueTurn['detectedTactic'] = undefined;

        // 1. Word Count (Base) & Question Detection
        // Longer sentences can indicate dominance, but questions often cede power.
        if (wordCount > 15) powerScore += 0.5;
        if (wordCount < 5 && wordCount > 0) powerScore -= 0.5;

        if (text.endsWith('?') || QUESTION_WORDS.some(qw => words[0] === qw)) {
          isQuestion = true;
          powerScore -= 1; // Asking a question cedes power
        }

        // 2. Command Detection
        if (COMMAND_VERBS.some(cv => words[0] === cv && !isQuestion)) {
            powerScore += 1.5; // Issuing a command
        }

        // 3. Interruptions (Heuristic)
        // If the speaker changes and the previous segment ended abruptly or the current one starts with an interruption marker.
        if (i > 0) {
            const prevSegment = dialogueSegments[i-1];
            if (segment.speaker !== prevSegment.speaker) { // Speaker changed
                if (prevSegment.content.endsWith("...") || prevSegment.content.endsWith("--")) {
                    interruptions++;
                    powerScore += 0.5; // Successful interruption
                }
                if (segment.content.startsWith("...") || segment.content.startsWith("--")) {
                    // This turn is an interruption itself, or responding to one.
                    // If it *is* an interruption, it's powerful. If it's *responding* to one, less so.
                    // Simplified: let's assume starting with an interrupter is taking control.
                     powerScore += 0.2;
                }
            }
        }


        // 4. Hedge vs. Intensifier Logic
        words.forEach(word => {
          if (HEDGE_WORDS.includes(word)) hedgeCount++;
          if (INTENSIFIER_WORDS.includes(word)) intensifierCount++;
        });
        let hedgeToIntensifierRatio = 0;
        if (hedgeCount + intensifierCount > 0) {
            hedgeToIntensifierRatio = intensifierCount / (hedgeCount + intensifierCount);
        }
        if (intensifierCount > hedgeCount) powerScore += (intensifierCount - hedgeCount) * 0.3;
        else if (hedgeCount > intensifierCount) powerScore -= (hedgeCount - intensifierCount) * 0.3;


        // 5. Topic Control Logic (Simplified Noun Extraction)
        const currentTurnTopics = new Set<string>();
        words.forEach(word => {
          // Simple heuristic: longer words that are not stop words or special words might be nouns/topics
          if (word.length > 4 && !WritingQualityAnalyzer.STOP_WORDS.includes(word) && !HEDGE_WORDS.includes(word) && !INTENSIFIER_WORDS.includes(word) && !POLITENESS_KEYWORDS.includes(word)) {
            currentTurnTopics.add(word);
          }
        });

        if (previousTurnTopics.size > 0 && currentTurnTopics.size > 0) {
          const intersection = new Set([...previousTurnTopics].filter(x => currentTurnTopics.has(x)));
          if (intersection.size === 0 && currentTurnTopics.size > 1) { // Completely new set of topics
            topicChanged = true;
            powerScore += 1; // Successfully changed topic
          } else if (currentTurnTopics.size > intersection.size +1) { // Introduced new topics alongside old ones
            topicChanged = true; // Still counts as changing/guiding topic
            powerScore += 0.5;
          }
        } else if (currentTurnTopics.size > 1 && i > 0) { // Introduced topics where there were none or first substantive turn
            topicChanged = true;
            powerScore += 0.5;
        }
        previousTurnTopics = currentTurnTopics;

        // 6. Pronoun Ratio (I/My vs You/Your)
        let firstPersonCount = 0;
        let secondPersonCount = 0;
        words.forEach(word => {
          if (['i', 'me', 'my', 'mine'].includes(word)) firstPersonCount++;
          if (['you', 'your', 'yours'].includes(word)) secondPersonCount++;
        });
        if (firstPersonCount > secondPersonCount && secondPersonCount === 0 && firstPersonCount > 1) { // High self-focus, potentially dominant if not pleading
            powerScore += 0.3;
        } else if (secondPersonCount > firstPersonCount && firstPersonCount === 0 && secondPersonCount > 1) { // High focus on other, potentially accusatory or commanding
            powerScore += 0.2;
        }


        // 7. Response Latency (Heuristic - check narrative *before* this segment)
        if (i > 0) {
            const textBetween = sceneText.substring(dialogueSegments[i-1].endPosition, segment.startPosition).toLowerCase();
            if (/\b(paused|hesitated|waited|moment of silence|beat)\b/.test(textBetween)) {
                // Pause before speaking could be strategic (power up) or hesitant (power down)
                // For now, let's assume strategic if not a question and not many hedges
                if (!isQuestion && hedgeCount < 2) {
                    powerScore += 0.4;
                } else {
                    powerScore -= 0.4;
                }
            }
        }

        // 8. Weaponized Politeness (Simplified context: if previous turn had high power indicators)
        const usesPoliteness = POLITENESS_KEYWORDS.some(pk => text.includes(pk));
        if (usesPoliteness && dialogueTurns.length > 0) {
            const prevTurn = dialogueTurns[dialogueTurns.length-1];
            // If previous turn was strong (commanding, many intensifiers, changed topic)
            // and current turn is polite, it might be "weaponized"
            // Need to ensure metrics object and its properties exist on prevTurn before accessing
            if (prevTurn.metrics &&
                (prevTurn.powerScore > 1.5 || (prevTurn.metrics.hedgeToIntensifierRatio > 0.6 && prevTurn.metrics.wordCount > 5))) { // Example: more intensifiers than hedges
                detectedTactic = 'weaponizedPoliteness';
                powerScore += 1.2;
            }
        }

        // 9. Exchange Termination
        if (TERMINATION_PHRASES.some(tp => text.includes(tp))) {
            detectedTactic = 'exchangeTermination';
            powerScore += 2.5; // Strong move
        } else if (i === dialogueSegments.length -1 && dialogueSegments.length > 1) { // Last dialogue turn of the scene
            // Check narration immediately after this segment for leaving cues
            const narrationAfter = sceneText.substring(segment.endPosition).toLowerCase().split('\n')[0]; // First line of narration after
            if (/\b(left|walked away|turned away|hung up|closed the door)\b/.test(narrationAfter)) {
                detectedTactic = 'exchangeTermination';
                powerScore += 2.0;
            }
        }

        // Normalize powerScore to be within -5 to +5
        powerScore = Math.max(-5, Math.min(5, parseFloat(powerScore.toFixed(2))));

        dialogueTurns.push({
          characterName: segment.speaker,
          powerScore: powerScore,
          metrics: {
            isQuestion,
            interruptions,
            wordCount,
            hedgeToIntensifierRatio: parseFloat(hedgeToIntensifierRatio.toFixed(2)),
            topicChanged,
          },
          detectedTactic,
        });
        lastSpeaker = segment.speaker;
      }

      return { success: true, data: dialogueTurns };

    } catch (error) {
      console.error("Error in analyzeDialoguePowerBalance:", error);
      return {
        success: false,
        error: `Dialogue power balance analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}