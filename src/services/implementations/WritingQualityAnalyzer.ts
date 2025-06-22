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
  EchoChamberResult
} from '../../types/contracts';

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
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.length || 1; // Ensure at least 1 sentence if there's text
  }

  async analyzeShowVsTell(text: string): Promise<ContractResult<ShowTellIssue[]>> {
    const tellingPhrases = [
        'he felt', 'she felt', 'he saw', 'she saw', 'he heard', 'she heard',
        'he knew', 'she knew', 'it was obvious', 'clearly', 'she realized', 'he realized'
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
                    example: `Instead of "She felt sad," try "A tear traced a path down her cheek."`
                });
                // Avoid adding multiple issues for the same sentence
                break; 
            }
        }
    });

    return { success: true, data: issues };
  }

  async analyzeTropes(text: string): Promise<ContractResult<TropeMatch[]>> {
    console.log("Detecting tropes for text:", text.substring(0, 50));
    const mockResult: TropeMatch[] = [];
    if (text.toLowerCase().includes("star-crossed lovers")) {
        mockResult.push({
            name: "Star-Crossed Lovers",
            description: "The narrative contains elements of a romantic relationship hindered by external forces.",
            text: "Their families were sworn enemies, yet they couldn't deny their love.",
            position: text.toLowerCase().indexOf("star-crossed lovers"),
            confidence: 0.85,
            subversionSuggestions: ["The families reconcile after seeing their children's love.", "One of them fakes their death to escape."],
            category: 'plot'
        });
    }
    return Promise.resolve({ success: true, data: mockResult });
  }

  async analyzePurpleProse(text: string): Promise<ContractResult<PurpleProseIssue[]>> {
    const issues: PurpleProseIssue[] = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach((sentence) => {
        const words = sentence.trim().split(/\s+/);
        const longWords = words.filter(w => w.length > 12); // Arbitrary length for "long" words
        const adverbs = words.filter(w => /ly$/.test(w)); // Simple check for adverbs, often overused

        if (longWords.length > 2 || adverbs.length > 3) {
            issues.push({
                text: sentence,
                position: text.indexOf(sentence),
                type: 'flowery_language',
                severity: 'mild',
                suggestion: 'This sentence seems overly descriptive or uses complex words. Consider simplifying for clarity.',
                simplifiedVersion: 'The core idea of the sentence, but simpler.'
            });
        }
    });

    return { success: true, data: issues };
  }

  async analyzeReadabilityRollercoaster(text: string, paragraphsPerPoint: number = 1): Promise<ContractResult<ReadabilityPoint[]>> {
    try {
      if (!text || text.trim() === "") {
        return { success: true, data: [] };
      }

      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim() !== "");
      const readabilityPoints: ReadabilityPoint[] = [];

      for (let i = 0; i < paragraphs.length; i += paragraphsPerPoint) {
          const chunk = paragraphs.slice(i, i + paragraphsPerPoint).join('\n\n');
          const words = this.countWords(chunk);
          const sentences = this.countSentences(chunk);
          let syllables = 0;
          chunk.trim().split(/\s+/).forEach(word => {
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
    if (!text || text.trim() === "") {
        return { success: true, data: { dominantColors: [], accentColors: [], overallMood: 'Neutral' } };
    }

    // A simple map of color names to hex codes. A real implementation could be much more extensive.
    const colorMap: Record<string, string> = {
        // Primary & Common
        red: '#FF0000', blue: '#0000FF', green: '#008000', black: '#000000', white: '#FFFFFF',
        yellow: '#FFFF00', orange: '#FFA500', purple: '#800080', grey: '#808080', brown: '#A52A2A',
        // Shades & Tones
        scarlet: '#FF2400', crimson: '#DC143C', ruby: '#E0115F', 
        navy: '#000080', azure: '#007FFF', cerulean: '#007BA7', indigo: '#4B0082',
        emerald: '#50C878', olive: '#808000', lime: '#00FF00',
        violet: '#8F00FF', lilac: '#C8A2C8', lavender: '#E6E6FA', mauve: '#E0B0FF',
        gold: '#FFD700', silver: '#C0C0C0', bronze: '#CD7F32', copper: '#B87333',
        amber: '#FFBF00', ochre: '#CC7722', sienna: '#882D17',
        ivory: '#FFFFF0', cream: '#FFFDD0', beige: '#F5F5DC',
        charcoal: '#36454F', slate: '#708090', jet: '#343434', sable: '#000000'
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
            prominence: frequency / totalColorMentions
        }));

    const dominantColors = sortedColors.slice(0, 3);
    const accentColors = sortedColors.slice(3, 5);

    // Basic mood detection based on dominant colors
    const mood = dominantColors.length > 0 ? (dominantColors[0].name === 'Red' ? 'Passionate/Angry' : 'Calm') : 'Neutral';

    const analysis: ColorPaletteAnalysis = {
        dominantColors,
        accentColors,
        overallMood: mood
    };

    return { success: true, data: analysis };
  }

  async calculateOverallScore(report: Omit<WritingQualityReport, 'overallScore'>): Promise<ContractResult<OverallScore>> {
    try {
        // Prose Clarity: Higher readability score is better, fewer purple prose issues is better.
        const avgReadability = report.readabilityPoints.length > 0
            ? report.readabilityPoints.reduce((sum, p) => sum + p.score, 0) / report.readabilityPoints.length
            : 50; // Default score if no points
        const proseClarity = Math.max(0, Math.min(100, avgReadability - (report.purpleProseIssues.length * 10)));

        // Show vs Tell: Fewer "telling" issues is better.
        const showVsTell = Math.max(0, 100 - (report.showTellIssues.length * 20));

        // Trope Originality: Fewer cliche tropes is better.
        const tropeOriginality = Math.max(0, 100 - (report.tropeMatches.length * 25));

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
    if (!text || text.trim() === "") {
        return { success: true, data: [] };
    }

    const words = text.toLowerCase().match(/\w+/g) || [];
    const frequencyMap: Record<string, number> = {};
    
    for (const word of words) {
        if (word.length > 4) { // Ignore very short words
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
      ].filter(Boolean).join('; ');

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
}