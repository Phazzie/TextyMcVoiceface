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

  describe('analyzeTropes', () => {
    it('should identify a known trope from the dictionary', async () => {
      const text = 'The prophecy foretold that only the heir, the chosen one, could save them.';
      const result = await analyzer.analyzeTropes(text);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.length).toBe(1);
        expect(result.data[0].name).toBe('The Chosen One');
      }
    });
  });

  describe('analyzePurpleProse', () => {
    it('should identify overly descriptive sentences', async () => {
      const text = 'The magnificently, incandescently beautiful sun descended below the spectacularly colossal mountains.';
      const result = await analyzer.analyzePurpleProse(text);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.length).toBe(1);
        expect(result.data[0].type).toBe('telling');
      }
    });
  });
});
