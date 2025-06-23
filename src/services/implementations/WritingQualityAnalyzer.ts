import {
  IWritingQualityAnalyzer,
  ContractResult,
  ReadabilityPoint,
  ShowTellIssue,
  TropeMatch,
  PurpleProseIssue,
  WritingQualityReport,
  ColorPaletteAnalysis,
  OverallScore,
  EchoChamberResult,
  TextSegment,
  DialogueTurn,
} from '../../types/contracts';
import { TextAnalysisEngine } from './TextAnalysisEngine';

export class WritingQualityAnalyzer implements IWritingQualityAnalyzer {
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
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    return sentences.length || 1; // Ensure at least 1 sentence if there's text
  }

  async analyzeShowVsTell(text: string): Promise<ContractResult<ShowTellIssue[]>> {
    const tellingPhrases = [
      'he felt',
      'she felt',
      'he saw',
      'she saw',
      'he heard',
      'she heard',
      'he knew',
      'she knew',
      'it was obvious',
      'clearly',
      'she realized',
      'he realized',
    ];
    const issues: ShowTellIssue[] = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach((sentence) => {
      for (const phrase of tellingPhrases) {
        const position = sentence.toLowerCase().indexOf(phrase);
        if (position !== -1) {
          issues.push({
            text: sentence,
            position: text.indexOf(sentence), // Approximate position in full text
            type: 'telling',
            severity: 'medium',
            suggestion: `Instead of stating the character's realization or feeling, try to describe the sensory details or actions that lead to it.`,
            example: `Instead of "She felt sad," try "A tear traced a path down her cheek."`,
          });
          // Avoid adding multiple issues for the same sentence
          break;
        }
      }
    });

    return { success: true, data: issues };
  }

  async analyzeTropes(text: string): Promise<ContractResult<TropeMatch[]>> {
    console.log('Detecting tropes for text:', text.substring(0, 50));
    const mockResult: TropeMatch[] = [];
    if (text.toLowerCase().includes('star-crossed lovers')) {
      mockResult.push({
        name: 'Star-Crossed Lovers',
        description: 'The narrative contains elements of a romantic relationship hindered by external forces.',
        text: 'Their families were sworn enemies, yet they couldn\'t deny their love.',
        position: text.toLowerCase().indexOf('star-crossed lovers'),
        confidence: 0.85,
        subversionSuggestions: [
          'The families reconcile after seeing their children\'s love.',
          'One of them fakes their death to escape.',
        ],
        category: 'plot',
      });
    }
    return Promise.resolve({ success: true, data: mockResult });
  }

  async analyzePurpleProse(text: string): Promise<ContractResult<PurpleProseIssue[]>> {
    const issues: PurpleProseIssue[] = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach((sentence) => {
      const words = sentence.trim().split(/\s+/);
      const longWords = words.filter((w) => w.length > 12); // Arbitrary length for "long" words
      const adverbs = words.filter((w) => /ly$/.test(w)); // Simple check for adverbs, often overused

      if (longWords.length > 2 || adverbs.length > 3) {
        issues.push({
          text: sentence,
          position: text.indexOf(sentence),
          type: 'flowery_language',
          severity: 'mild',
          suggestion: 'This sentence seems overly descriptive or uses complex words. Consider simplifying for clarity.',
          simplifiedVersion: 'The core idea of the sentence, but simpler.',
        });
      }
    });

    return { success: true, data: issues };
  }

  async analyzeReadabilityRollercoaster(text: string, paragraphsPerPoint: number = 1): Promise<ContractResult<ReadabilityPoint[]>> {
    try {
      if (!text || text.trim() === '') {
        return { success: true, data: [] };
      }

      const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim() !== '');
      const readabilityPoints: ReadabilityPoint[] = [];

      for (let i = 0; i < paragraphs.length; i += paragraphsPerPoint) {
        const chunk = paragraphs.slice(i, i + paragraphsPerPoint).join('\n\n');
        const words = this.countWords(chunk);
        const sentences = this.countSentences(chunk);
        let syllables = 0;
        chunk
          .trim()
          .split(/\s+/)
          .forEach((word) => {
            syllables += this.countSyllables(word);
          });

        let score = 0;
        if (words > 0 && sentences > 0) {
          const wordsPerSentence = words / sentences;
          const syllablesPerWord = syllables / words;
          score = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
        }

        readabilityPoints.push({
          paragraphIndex: i,
          score: Math.max(0, Math.round(score)), // Ensure score is not negative and is rounded
        });
      }

      return { success: true, data: readabilityPoints };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: `Error in readability analysis: ${message}` };
    }
  }

  async analyzeColorPalette(text: string): Promise<ContractResult<ColorPaletteAnalysis>> {
    if (!text || text.trim() === '') {
      return { success: true, data: { dominantColors: [], accentColors: [], overallMood: 'Neutral' } };
    }

    // A simple map of color names to hex codes. A real implementation could be much more extensive.
    const colorMap: Record<string, string> = {
      // Primary & Common
      red: '#FF0000',
      blue: '#0000FF',
      green: '#008000',
      black: '#000000',
      white: '#FFFFFF',
      yellow: '#FFFF00',
      orange: '#FFA500',
      purple: '#800080',
      grey: '#808080',
      brown: '#A52A2A',
      // Shades & Tones
      scarlet: '#FF2400',
      crimson: '#DC143C',
      ruby: '#E0115F',
      navy: '#000080',
      azure: '#007FFF',
      cerulean: '#007BA7',
      indigo: '#4B0082',
      emerald: '#50C878',
      olive: '#808000',
      lime: '#00FF00',
      violet: '#8F00FF',
      lilac: '#C8A2C8',
      lavender: '#E6E6FA',
      mauve: '#E0B0FF',
      gold: '#FFD700',
      silver: '#C0C0C0',
      bronze: '#CD7F32',
      copper: '#B87333',
      amber: '#FFBF00',
      ochre: '#CC7722',
      sienna: '#882D17',
      ivory: '#FFFFF0',
      cream: '#FFFDD0',
      beige: '#F5F5DC',
      charcoal: '#36454F',
      slate: '#708090',
      jet: '#343434',
      sable: '#000000',
    };

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const foundColors: Record<string, number> = {};
    let totalColorMentions = 0;

    for (const word of words) {
      if (colorMap[word]) {
        foundColors[word] = (foundColors[word] || 0) + 1;
        totalColorMentions++;
      }
    }

    if (totalColorMentions === 0) {
      return { success: true, data: { dominantColors: [], accentColors: [], overallMood: 'Neutral' } };
    }

    const sortedColors = Object.entries(foundColors)
      .sort(([, a], [, b]) => b - a)
      .map(([name, frequency]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        hex: colorMap[name],
        prominence: frequency / totalColorMentions,
      }));

    const dominantColors = sortedColors.slice(0, 3);
    const accentColors = sortedColors.slice(3, 5);

    // Basic mood detection based on dominant colors
    const mood = dominantColors.length > 0 ? (dominantColors[0].name === 'Red' ? 'Passionate/Angry' : 'Calm') : 'Neutral';

    const analysis: ColorPaletteAnalysis = {
      dominantColors,
      accentColors,
      overallMood: mood,
    };

    return { success: true, data: analysis };
  }

  async calculateOverallScore(report: Omit<WritingQualityReport, 'overallScore'>): Promise<ContractResult<OverallScore>> {
    try {
      // Prose Clarity: Higher readability score is better, fewer purple prose issues is better.
      const avgReadability =
        report.readabilityPoints.length > 0
          ? report.readabilityPoints.reduce((sum, p) => sum + p.score, 0) / report.readabilityPoints.length
          : 50; // Default score if no points
      const proseClarity = Math.max(0, Math.min(100, avgReadability - report.purpleProseIssues.length * 10));

      // Show vs Tell: Fewer "telling" issues is better.
      const showVsTell = Math.max(0, 100 - report.showTellIssues.length * 20);

      // Trope Originality: Fewer cliche tropes is better.
      const tropeOriginality = Math.max(0, 100 - report.tropeMatches.length * 25);

      const score: OverallScore = {
        showVsTell: Math.round(showVsTell),
        tropeOriginality: Math.round(tropeOriginality),
        proseClarity: Math.round(proseClarity),
      };

      return { success: true, data: score };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: `Error calculating overall score: ${message}` };
    }
  }

  public async detectEchoChamber(text: string): Promise<ContractResult<EchoChamberResult[]>> {
    if (!text || text.trim() === '') {
      return { success: true, data: [] };
    }

    const words = text.toLowerCase().match(/\w+/g) || [];
    const frequencyMap: Record<string, number> = {};

    for (const word of words) {
      if (word.length > 4) {
        // Ignore very short words
        frequencyMap[word] = (frequencyMap[word] || 0) + 1;
      }
    }

    const echoChamberResults: EchoChamberResult[] = Object.entries(frequencyMap)
      .filter(([, frequency]) => frequency > 3) // Find words used more than 3 times
      .map(([word, frequency]) => ({
        word,
        frequency,
        characters: [], // Character tracking is complex, so we'll omit it for this implementation
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Return top 10 results

    return { success: true, data: echoChamberResults };
  }

  public async generateFullReport(text: string): Promise<ContractResult<WritingQualityReport>> {
    try {
      const [
        readabilityResult,
        showTellResult,
        tropeResult,
        purpleProseResult,
        echoChamberResult,
      ] = await Promise.all([
        this.analyzeReadabilityRollercoaster(text),
        this.analyzeShowVsTell(text),
        this.analyzeTropes(text),
        this.analyzePurpleProse(text),
        this.detectEchoChamber(text),
      ]);

      const errors = [
        readabilityResult.error,
        showTellResult.error,
        tropeResult.error,
        purpleProseResult.error,
        echoChamberResult.error,
      ]
        .filter(Boolean)
        .join('; ');

      if (errors) {
        return { success: false, error: `Failed to generate full report: ${errors}` };
      }

      const partialReport: Omit<WritingQualityReport, 'overallScore'> = {
        readabilityPoints: readabilityResult.data || [],
        showTellIssues: showTellResult.data || [],
        tropeMatches: tropeResult.data || [],
        purpleProseIssues: purpleProseResult.data || [],
        echoChamber: echoChamberResult.data || [],
      };

      const overallScoreResult = await this.calculateOverallScore(partialReport);
      if (!overallScoreResult.success || !overallScoreResult.data) {
        return { success: false, error: `Failed to calculate overall score: ${overallScoreResult.error}` };
      }

      const fullReport: WritingQualityReport = {
        ...partialReport,
        overallScore: overallScoreResult.data,
      };

      return { success: true, data: fullReport };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: `An unexpected error occurred during full report generation: ${message}` };
    }
  }

  async analyzeDialoguePowerBalance(sceneText: string): Promise<ContractResult<DialogueTurn[]>> {
    try {
      const segmentsResult = await this.textAnalysisEngine.parseText(sceneText);
      if (!segmentsResult.success || !segmentsResult.data) {
        return { success: false, error: segmentsResult.error || 'Failed to parse text for power balance analysis.' };
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

      const HEDGE_WORDS = [
        'maybe',
        'perhaps',
        'sort of',
        'kind of',
        'i think',
        'i guess',
        'possibly',
        'could be',
        'might be',
        'a little',
        'somewhat',
        'arguably',
        'potentially',
        'presumably',
      ];
      const INTENSIFIER_WORDS = [
        'very',
        'really',
        'absolutely',
        'definitely',
        'totally',
        'completely',
        'extremely',
        'highly',
        'never',
        'always',
        'must',
        'certainly',
        'undoubtedly',
      ];
      const POLITENESS_KEYWORDS = [
        'please',
        'thank you',
        'sir',
        'madam',
        'ma\'am',
        'pardon me',
        'excuse me',
        'mr.',
        'mrs.',
        'ms.',
      ];
      const QUESTION_WORDS = [
        'who',
        'what',
        'when',
        'where',
        'why',
        'how',
        'is',
        'are',
        'do',
        'does',
        'did',
        'can',
        'could',
        'will',
        'would',
        'should',
        'may',
        'might',
      ];
      const COMMAND_VERBS = [
        'go',
        'do',
        'tell',
        'give',
        'take',
        'bring',
        'stop',
        'start',
        'listen',
        'look',
        'come',
        'leave',
        'wait',
        'hurry',
      ]; // Simple list, could be expanded
      const TERMINATION_PHRASES = [
        'this conversation is over',
        'i have nothing more to say',
        "we're done here",
        'goodbye',
        "i'm leaving",
      ];

      const dialogueTurns: DialogueTurn[] = [];
      let previousTurnTopics: Set<string> = new Set();
      let lastSpeaker = '';

      for (let i = 0; i < dialogueSegments.length; i++) {
        const segment = dialogueSegments[i];
        const text = segment.content.toLowerCase();
        const words = text.split(/\s+/).filter((w) => w.length > 0);
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

        if (text.endsWith('?') || QUESTION_WORDS.some((qw) => words[0] === qw)) {
          isQuestion = true;
          powerScore -= 1; // Asking a question cedes power
        }

        // 2. Command Detection
        if (COMMAND_VERBS.some((cv) => words[0] === cv && !isQuestion)) {
          powerScore += 1.5; // Issuing a command
        }

        // 3. Interruptions (Heuristic)
        // If the speaker changes and the previous segment ended abruptly or the current one starts with an interruption marker.
        if (i > 0) {
          const prevSegment = dialogueSegments[i - 1];
          if (segment.speaker !== prevSegment.speaker) {
            // Speaker changed
            if (prevSegment.content.endsWith('...') || prevSegment.content.endsWith('--')) {
              interruptions++;
              powerScore += 0.5; // Successful interruption
            }
            if (segment.content.startsWith('...') || segment.content.startsWith('--')) {
              // This turn is an interruption itself, or responding to one.
              // If it *is* an interruption, it's powerful. If it's *responding* to one, less so.
              // Simplified: let's assume starting with an interrupter is taking control.
              powerScore += 0.2;
            }
          }
        }

        // 4. Hedge vs. Intensifier Logic
        words.forEach((word) => {
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
        words.forEach((word) => {
          // Simple heuristic: longer words that are not stop words or special words might be nouns/topics
          if (
            word.length > 4 &&
            !WritingQualityAnalyzer.STOP_WORDS.includes(word) &&
            !HEDGE_WORDS.includes(word) &&
            !INTENSIFIER_WORDS.includes(word) &&
            !POLITENESS_KEYWORDS.includes(word)
          ) {
            currentTurnTopics.add(word);
          }
        });

        if (previousTurnTopics.size > 0 && currentTurnTopics.size > 0) {
          const intersection = new Set([...previousTurnTopics].filter((x) => currentTurnTopics.has(x)));
          if (intersection.size === 0 && currentTurnTopics.size > 1) {
            // Completely new set of topics
            topicChanged = true;
            powerScore += 1; // Successfully changed topic
          } else if (currentTurnTopics.size > intersection.size + 1) {
            // Introduced new topics alongside old ones
            topicChanged = true; // Still counts as changing/guiding topic
            powerScore += 0.5;
          }
        } else if (currentTurnTopics.size > 1 && i > 0) {
          // Introduced topics where there were none or first substantive turn
          topicChanged = true;
          powerScore += 0.5;
        }
        previousTurnTopics = currentTurnTopics;

        // 6. Pronoun Ratio (I/My vs You/Your)
        let firstPersonCount = 0;
        let secondPersonCount = 0;
        words.forEach((word) => {
          if (['i', 'me', 'my', 'mine'].includes(word)) firstPersonCount++;
          if (['you', 'your', 'yours'].includes(word)) secondPersonCount++;
        });
        if (firstPersonCount > secondPersonCount && secondPersonCount === 0 && firstPersonCount > 1) {
          // High self-focus, potentially dominant if not pleading
          powerScore += 0.3;
        } else if (secondPersonCount > firstPersonCount && firstPersonCount === 0 && secondPersonCount > 1) {
          // High focus on other, potentially accusatory or commanding
          powerScore += 0.2;
        }

        // 7. Response Latency (Heuristic - check narrative *before* this segment)
        if (i > 0) {
          const textBetween = sceneText.substring(dialogueSegments[i - 1].endPosition, segment.startPosition).toLowerCase();
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
        const usesPoliteness = POLITENESS_KEYWORDS.some((pk) => text.includes(pk));
        if (usesPoliteness && dialogueTurns.length > 0) {
          const prevTurn = dialogueTurns[dialogueTurns.length - 1];
          // If previous turn was strong (commanding, many intensifiers, changed topic)
          // and current turn is polite, it might be "weaponized"
          // Need to ensure metrics object and its properties exist on prevTurn before accessing
          if (
            prevTurn.metrics &&
            (prevTurn.powerScore > 1.5 ||
              (prevTurn.metrics.hedgeToIntensifierRatio > 0.6 && prevTurn.metrics.wordCount > 5)) // Example: more intensifiers than hedges
          ) {
            detectedTactic = 'weaponizedPoliteness';
            powerScore += 1.2;
          }
        }

        // 9. Exchange Termination
        if (TERMINATION_PHRASES.some((tp) => text.includes(tp))) {
          detectedTactic = 'exchangeTermination';
          powerScore += 2.5; // Strong move
        } else if (i === dialogueSegments.length - 1 && dialogueSegments.length > 1) {
          // Last dialogue turn of the scene
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
      console.error('Error in analyzeDialoguePowerBalance:', error);
      return {
        success: false,
        error: `Dialogue power balance analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}