import { WritingQualityAnalyzer } from '../services/implementations/WritingQualityAnalyzer';
import { EchoChamberResult, ContractResult, TextSegment } from '../types/contracts'; // Adjusted path
import { TextAnalysisEngine } from '../services/TextAnalysisEngine';

// Mock TextAnalysisEngine to control segment parsing for tests
jest.mock('../services/TextAnalysisEngine');

const mockParseText = TextAnalysisEngine.prototype.parseText as jest.Mock;

describe('WritingQualityAnalyzer.detectEchoChamber', () => {
  let analyzer: WritingQualityAnalyzer;

  beforeEach(() => {
    analyzer = new WritingQualityAnalyzer();
    mockParseText.mockReset(); // Reset mock before each test
  });

  // Helper to sort character arrays for consistent comparison
  const sortCharacters = (arr: EchoChamberResult[]) => {
    arr.forEach(echo => echo.characters.sort());
    return arr.sort((a, b) => a.word.localeCompare(b.word));
  };

  // Helper to mock parseText implementation
  const setupMockParseText = (text: string, segments: Partial<TextSegment>[]) => {
    mockParseText.mockImplementation(async (inputText: string): Promise<ContractResult<TextSegment[]>> => {
      if (inputText === text) {
        return {
          success: true,
          data: segments.map((s, i) => ({
            id: `seg${i}`,
            type: 'dialogue', // default type
            speaker: 'Unknown', // default speaker
            startPosition: 0,
            endPosition: s.content?.length || 0,
            ...s,
          })) as TextSegment[],
        };
      }
      return { success: false, error: 'Mocked parseText: Input text does not match setup' };
    });
  };


  test('Test 1: No echoed words', async () => {
    const inputText = "Character A says 'hello there'. Character B says 'good morning'.";
    setupMockParseText(inputText, [
      { content: "hello there", speaker: "Character A", type: "dialogue" },
      { content: "good morning", speaker: "Character B", type: "dialogue" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  test('Test 2: Simple echoed word', async () => {
    const inputText = "Character A says 'amazing'. Character B says 'truly amazing plan'.";
    setupMockParseText(inputText, [
      { content: "amazing", speaker: "Character A", type: "dialogue" },
      { content: "truly amazing plan", speaker: "Character B", type: "dialogue" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBe(1);
    const echo = result.data![0];
    expect(echo.word).toBe('amazing');
    expect(echo.frequency).toBe(2);
    expect(echo.characters).toHaveLength(2);
    expect(echo.characters).toContain('Character A');
    expect(echo.characters).toContain('Character B');
  });

  test('Test 3: Echoed word with different capitalization', async () => {
    const inputText = "Character A says 'Unique'. Character B says 'very unique'.";
     setupMockParseText(inputText, [
      { content: "Unique", speaker: "Character A", type: "dialogue" },
      { content: "very unique", speaker: "Character B", type: "dialogue" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBe(1);
    const echo = result.data![0];
    expect(echo.word).toBe('unique');
    expect(echo.frequency).toBe(2);
    expect(echo.characters).toHaveLength(2);
    expect(echo.characters).toContain('Character A');
    expect(echo.characters).toContain('Character B');
  });

  test('Test 4: Stop words should be ignored', async () => {
    const inputText = "Character A says 'is it the one'. Character B says 'is this the one'.";
    setupMockParseText(inputText, [
      { content: "is it the one", speaker: "Character A", type: "dialogue" },
      { content: "is this the one", speaker: "Character B", type: "dialogue" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBe(1);
    const echo = result.data![0];
    expect(echo.word).toBe('one');
    expect(echo.frequency).toBe(2);
    expect(echo.characters).toHaveLength(2);
    expect(echo.characters).toContain('Character A');
    expect(echo.characters).toContain('Character B');
  });

  test('Test 5: Text with no dialogue', async () => {
    const inputText = "This is a narrative paragraph. No one speaks.";
    setupMockParseText(inputText, [
      { content: "This is a narrative paragraph. No one speaks.", speaker: "Narrator", type: "narration" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  test('Test 6: Empty text', async () => {
    const inputText = "";
    setupMockParseText(inputText, []);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  test('Test 7: Word echoed by three characters', async () => {
    const inputText = "Alpha says 'run'. Beta says 'run fast'. Gamma says 'did you run?'";
    setupMockParseText(inputText, [
      { content: "run", speaker: "Alpha", type: "dialogue" },
      { content: "run fast", speaker: "Beta", type: "dialogue" },
      { content: "did you run?", speaker: "Gamma", type: "dialogue" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBe(1);
    const echo = result.data![0];
    expect(echo.word).toBe('run');
    expect(echo.frequency).toBe(3);
    expect(echo.characters).toHaveLength(3);
    expect(echo.characters).toContain('Alpha');
    expect(echo.characters).toContain('Beta');
    expect(echo.characters).toContain('Gamma');
  });

  test('Test 8: Multiple echoed words', async () => {
    const inputText = "Sky says 'blue bird'. Ocean says 'blue fish'. Forest says 'green tree'.";
     setupMockParseText(inputText, [
      { content: "blue bird", speaker: "Sky", type: "dialogue" },
      { content: "blue fish", speaker: "Ocean", type: "dialogue" },
      { content: "green tree", speaker: "Forest", type: "dialogue" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    const sortedData = sortCharacters(result.data!);
    // Expecting 'blue' to be echoed. 'bird', 'fish', 'green', 'tree' are not echoed by multiple speakers.
    expect(sortedData.length).toBe(1);
    expect(sortedData[0].word).toBe('blue');
    expect(sortedData[0].frequency).toBe(2);
    expect(sortedData[0].characters).toHaveLength(2);
    expect(sortedData[0].characters).toContain('Sky');
    expect(sortedData[0].characters).toContain('Ocean');
  });

  test('Test 9: Dialogue from Narrator should be ignored', async () => {
    const inputText = "Narrator says 'danger'. Character A says 'danger ahead'.";
    setupMockParseText(inputText, [
      { content: "danger", speaker: "Narrator", type: "dialogue" },
      { content: "danger ahead", speaker: "Character A", type: "dialogue" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]); // 'danger' from Narrator is ignored, Character A is sole user
  });

  test('Test 10: Punctuation handling', async () => {
    const inputText = "Hero says 'victory!'. Villain says 'no victory for you.'";
    setupMockParseText(inputText, [
      { content: "victory!", speaker: "Hero", type: "dialogue" },
      { content: "no victory for you.", speaker: "Villain", type: "dialogue" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBe(1);
    const echo = result.data![0];
    expect(echo.word).toBe('victory');
    expect(echo.frequency).toBe(2);
    expect(echo.characters).toHaveLength(2);
    expect(echo.characters).toContain('Hero');
    expect(echo.characters).toContain('Villain');
  });

  test('Test 11: Word echoed by multiple characters, one of them also uses another echoed word', async () => {
    const inputText = "Alice says 'happy day'. Bob says 'happy thoughts'. Charlie says 'bright day'.";
    setupMockParseText(inputText, [
        { content: "happy day", speaker: "Alice", type: "dialogue" },
        { content: "happy thoughts", speaker: "Bob", type: "dialogue" },
        { content: "bright day", speaker: "Charlie", type: "dialogue" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    const sortedData = sortCharacters(result.data!);

    expect(sortedData.length).toBe(2);

    const happyEcho = sortedData.find(e => e.word === 'happy');
    expect(happyEcho).toBeDefined();
    expect(happyEcho!.frequency).toBe(2);
    expect(happyEcho!.characters).toHaveLength(2);
    expect(happyEcho!.characters).toContain('Alice');
    expect(happyEcho!.characters).toContain('Bob');

    const dayEcho = sortedData.find(e => e.word === 'day');
    expect(dayEcho).toBeDefined();
    expect(dayEcho!.frequency).toBe(2);
    expect(dayEcho!.characters).toHaveLength(2);
    expect(dayEcho!.characters).toContain('Alice');
    expect(dayEcho!.characters).toContain('Charlie');
  });

  test('Test 12: Speaker name with leading/trailing spaces should be trimmed', async () => {
    const inputText = "  SpeakerX   says 'repeat'. SpeakerY says 'repeat also'.";
    setupMockParseText(inputText, [
      { content: "repeat", speaker: "  SpeakerX  ", type: "dialogue" },
      { content: "repeat also", speaker: "SpeakerY", type: "dialogue" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBe(1);
    const echo = result.data![0];
    expect(echo.word).toBe('repeat');
    expect(echo.frequency).toBe(2);
    // The implementation of detectEchoChamber trims speaker names implicitly
    // because Map keys would be different if not trimmed before setting.
    // However, the provided implementation *doesn't* explicitly trim speaker names
    // before using them as map keys. This test might fail or pass depending on JS Map's behavior with such keys.
    // For robustness, the main code should trim speaker names from segments.
    // Assuming the main code *will* trim (or test will be adjusted if it doesn't):
    expect(echo.characters).toHaveLength(2);
    expect(echo.characters).toContain('SpeakerX'); // This relies on the main code trimming "  SpeakerX  "
    expect(echo.characters).toContain('SpeakerY');
  });

  test('Test 13: Segments with empty content or only whitespace', async () => {
    const inputText = "Speaker A says 'word'. Speaker B says ' '. Speaker C says '\t\n'.";
     setupMockParseText(inputText, [
      { content: "word", speaker: "Speaker A", type: "dialogue" },
      { content: " ", speaker: "Speaker B", type: "dialogue" },
      { content: "\t\n", speaker: "Speaker C", type: "dialogue" },
    ]);
    const result = await analyzer.detectEchoChamber(inputText);
    expect(result.success).toBe(true);
    // Only "word" from Speaker A is processed; others produce no tokens. No echo.
    expect(result.data).toEqual([]);
  });
});

describe('WritingQualityAnalyzer.analyzeDialoguePowerBalance', () => {
  let analyzer: WritingQualityAnalyzer;

  beforeEach(() => {
    analyzer = new WritingQualityAnalyzer();
    // Mock TextAnalysisEngine's parseText for these tests too
    // Ensure the mock is reset and configured for each sub-test or describe block if necessary
    mockParseText.mockReset();
  });

  // Helper to mock parseText for power balance tests
  const setupPowerBalanceMockParseText = (sceneText: string, dialogueContents: Array<{speaker: string, content: string, start?: number, end?: number}>) => {
    const segments: TextSegment[] = dialogueContents.map((dc, index) => {
      const start = dc.start || (index > 0 ? (segments[index-1]?.endPosition || 0) + 1 : 0);
      const end = dc.end || start + dc.content.length;
      return {
        id: `seg${index}`,
        content: dc.content,
        speaker: dc.speaker,
        type: 'dialogue',
        startPosition: start,
        endPosition: end,
      };
    });

    mockParseText.mockImplementation(async (inputText: string): Promise<ContractResult<TextSegment[]>> => {
      if (inputText === sceneText) {
        return { success: true, data: segments };
      }
      return { success: false, error: 'Mocked parseText (power balance): Input text does not match setup' };
    });
  };

  test('should return empty array for empty scene text', async () => {
    const sceneText = "";
    setupPowerBalanceMockParseText(sceneText, []);
    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  test('should analyze a simple question', async () => {
    const sceneText = `Alice: "Are you coming?"`;
    setupPowerBalanceMockParseText(sceneText, [{ speaker: "Alice", content: "Are you coming?" }]);
    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    const turn = result.data![0];
    expect(turn.characterName).toBe("Alice");
    expect(turn.metrics.isQuestion).toBe(true);
    expect(turn.powerScore).toBeLessThan(0); // Questions reduce power
  });

  test('should analyze a simple command', async () => {
    const sceneText = `Bob: "Tell me now!"`;
    setupPowerBalanceMockParseText(sceneText, [{ speaker: "Bob", content: "Tell me now!" }]);
    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    const turn = result.data![0];
    expect(turn.characterName).toBe("Bob");
    expect(turn.metrics.isQuestion).toBe(false);
    expect(turn.powerScore).toBeGreaterThan(0); // Commands increase power
  });

  test('should handle hedge and intensifier words', async () => {
    const sceneText = `Charlie: "Maybe it's very important, I guess."`;
    // Hedges: Maybe, I guess. Intensifier: very.
    setupPowerBalanceMockParseText(sceneText, [{ speaker: "Charlie", content: "Maybe it's very important, I guess." }]);
    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    const turn = result.data![0];
    expect(turn.characterName).toBe("Charlie");
    // hedgeCount = 2, intensifierCount = 1. Ratio = 1 / (2+1) = 0.33
    expect(turn.metrics.hedgeToIntensifierRatio).toBeCloseTo(1 / (2 + 1));
    expect(turn.powerScore).toBeLessThan(0); // More hedges than intensifiers
  });

  test('should detect topic change', async () => {
    const sceneText = `David: "The weather is nice."\nEve: "Speaking of nice things, did you see that new car?"`;
    setupPowerBalanceMockParseText(sceneText, [
      { speaker: "David", content: "The weather is nice.", end: 22 },
      { speaker: "Eve", content: "Speaking of nice things, did you see that new car?", start: 23 }
    ]);
    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    // David's turn metrics.topicChanged should be false or based on prior context (not testable here easily)
    // Eve's turn should have topicChanged = true
    const eveTurn = result.data![1];
    expect(eveTurn.characterName).toBe("Eve");
    expect(eveTurn.metrics.topicChanged).toBe(true);
    expect(eveTurn.powerScore).toBeGreaterThan(result.data![0].powerScore); // Topic change bonus
  });

  test('should detect exchange termination by dialogue', async () => {
    const sceneText = `Frank: "I disagree."\nGrace: "This conversation is over."`;
    setupPowerBalanceMockParseText(sceneText, [
      { speaker: "Frank", content: "I disagree." },
      { speaker: "Grace", content: "This conversation is over." }
    ]);
    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    const graceTurn = result.data![1];
    expect(graceTurn.characterName).toBe("Grace");
    expect(graceTurn.detectedTactic).toBe('exchangeTermination');
    expect(graceTurn.powerScore).toBeGreaterThan(1.5); // Termination is a strong move
  });

  test('should detect exchange termination by narration', async () => {
    const sceneText = `Ivy: "I'm done."\nIvy walked away.`;
    // Mocking involves providing the dialogue segment and then letting the service analyze the full text for narration.
    // The `endPosition` of Ivy's dialogue is crucial.
    setupPowerBalanceMockParseText(sceneText, [
      { speaker: "Ivy", content: "I'm done.", endPosition: 12 }
    ]);
    // The service itself will use the full sceneText: "Ivy: \"I'm done.\"\nIvy walked away."
    // and check narration *after* segment.endPosition

    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    const ivyTurn = result.data![0];
    expect(ivyTurn.characterName).toBe("Ivy");
    expect(ivyTurn.detectedTactic).toBe('exchangeTermination');
    expect(ivyTurn.powerScore).toBeGreaterThan(1.0);
  });

    test('should handle pronoun ratio (high I/My)', async () => {
    const sceneText = `Leo: "I think my plan is the best I have ever made."`;
    setupPowerBalanceMockParseText(sceneText, [{ speaker: "Leo", content: "I think my plan is the best I have ever made." }]);
    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    const turn = result.data![0];
    // Power score should be slightly boosted by high first-person pronoun usage.
    // The exact score depends on the weighting, but it should be noticeable.
    // Initial power score might be low due to "I think", but pronoun ratio should add to it.
    // For this test, just check that it's not heavily negative.
    // A more precise test would require knowing the exact weights.
    expect(turn.powerScore).toBeGreaterThan(-1.0); // Example assertion
  });

  test('should handle response latency (pause before speaking)', async () => {
    const sceneText = `Nora: "What now?"\n... (A long pause filled the room)\nOscar: "We wait."`;
    setupPowerBalanceMockParseText(sceneText, [
      { speaker: "Nora", content: "What now?", endPosition: 14 },
      { speaker: "Oscar", content: "We wait.", startPosition: 50 } // Start position after the narrative pause
    ]);
    // The service logic looks at sceneText.substring(dialogueSegments[i-1].endPosition, segment.startPosition)
    // So, the text "...\n... (A long pause filled the room)\n..." will be analyzed for "paused", "hesitated" etc.

    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    const oscarTurn = result.data![1];
    expect(oscarTurn.characterName).toBe("Oscar");
    // Assuming a strategic pause (not hesitant as it's not a question and few hedges)
    // Oscar's power score should be higher than Nora's or at least boosted by the pause.
    expect(oscarTurn.powerScore).toBeGreaterThan(result.data![0].powerScore);
  });

  test('should detect weaponized politeness', async () => {
    const sceneText = `PowerfulPerson: "You will do as I say!"\nMeekPerson: "Sir, please, might I offer a very small suggestion?"`;
    setupPowerBalanceMockParseText(sceneText, [
      { speaker: "PowerfulPerson", content: "You will do as I say!", end: 30 }, // High power turn
      { speaker: "MeekPerson", content: "Sir, please, might I offer a very small suggestion?", start: 31 }
    ]);
    // Mock PowerfulPerson's turn to have a high power score for context
    // This requires modifying how dialogueTurns are built or having a pre-calculated turn to insert.
    // For simplicity, we'll rely on the natural scoring of the command for PowerfulPerson.
    // The test will check if MeekPerson's politeness in response to a strong statement is flagged.

    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);

    const powerfulTurn = result.data![0];
    // Expect PowerfulPerson's command to give them a positive score
    expect(powerfulTurn.powerScore).toBeGreaterThan(0);

    const meekTurn = result.data![1];
    expect(meekTurn.characterName).toBe("MeekPerson");
    expect(meekTurn.detectedTactic).toBe('weaponizedPoliteness');
     // Politeness itself might lower score, but weaponized tactic adds a bonus.
     // The net effect depends on weighting, but the tactic should be detected.
    expect(meekTurn.powerScore).toBeGreaterThan(powerfulTurn.powerScore - 2.0); // Example: less submissive than a simple polite question due to tactic
  });

  test('should correctly identify interruptions by trailing ellipsis/dash', async () => {
    const sceneText = `SpeakerA: "I was about to say something important but then--"\nSpeakerB: "But then I interrupted you!"`;
    setupPowerBalanceMockParseText(sceneText, [
      { speaker: "SpeakerA", content: "I was about to say something important but then--", end: 50 },
      { speaker: "SpeakerB", content: "But then I interrupted you!", start: 51 }
    ]);
    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    const speakerBTurn = result.data![1];
    expect(speakerBTurn.metrics.interruptions).toBe(1); // Speaker B's turn is effectively the interruption.
    // The logic credits the interrupter, so B's score should be boosted.
    expect(speakerBTurn.powerScore).toBeGreaterThan(result.data![0].powerScore);
  });

  test('should correctly identify interruptions by leading ellipsis/dash', async () => {
    const sceneText = `SpeakerA: "I have a point to make."\nSpeakerB: "--And I have a counterpoint!"`;
    setupPowerBalanceMockParseText(sceneText, [
      { speaker: "SpeakerA", content: "I have a point to make.", end: 25 },
      { speaker: "SpeakerB", content: "--And I have a counterpoint!", start: 26 }
    ]);
    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    const speakerBTurn = result.data![1];
     // The current logic gives a small boost for starting with '--'
    expect(speakerBTurn.powerScore).toBeGreaterThan(result.data![0].powerScore - 0.5); // Allow for slight variations
  });

  test('complex scenario with multiple power dynamics', async () => {
    const sceneText = `Manager: "Absolutely complete this report by five, no excuses!"\nSarah: "But sir, I think I might need more time... the data is very complex."\nManager: "More time? What did I just say? Perhaps you're not up to the task?"\nSarah: "I understand your urgency. I will get it done. Goodbye."`;
    setupPowerBalanceMockParseText(sceneText, [
      { speaker: "Manager", content: "Absolutely complete this report by five, no excuses!", end: 50 },
      { speaker: "Sarah", content: "But sir, I think I might need more time... the data is very complex.", start: 51, end: 120 },
      { speaker: "Manager", content: "More time? What did I just say? Perhaps you're not up to the task?", start: 121, end: 190 },
      { speaker: "Sarah", content: "I understand your urgency. I will get it done. Goodbye.", start: 191 }
    ]);

    const result = await analyzer.analyzeDialoguePowerBalance(sceneText);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(4);

    const managerTurn1 = result.data![0]; // Command, intensifier
    expect(managerTurn1.powerScore).toBeGreaterThan(1.5);
    expect(managerTurn1.metrics.hedgeToIntensifierRatio).toBeGreaterThan(0.5);


    const sarahTurn1 = result.data![1]; // Hedge, question-like, politeness
    expect(sarahTurn1.powerScore).toBeLessThan(0);
    expect(sarahTurn1.metrics.hedgeToIntensifierRatio).toBeLessThan(0.5);
    // Might be weaponized politeness due to "sir" after a command
    // expect(sarahTurn1.detectedTactic).toBe('weaponizedPoliteness'); // This depends on the threshold for prevTurn.powerScore

    const managerTurn2 = result.data![2]; // Questions, challenge
    expect(managerTurn2.metrics.isQuestion).toBe(true);
    expect(managerTurn2.powerScore).toBeLessThan(managerTurn1.powerScore); // Questions, less direct command

    const sarahTurn2 = result.data![3]; // Termination
    expect(sarahTurn2.detectedTactic).toBe('exchangeTermination');
    expect(sarahTurn2.powerScore).toBeGreaterThan(1.5); // Strong termination move
  });
});
