// Example structure for the test file (e.g., WritingQualityAnalyzer.test.ts)

import { WritingQualityAnalyzer } from './WritingQualityAnalyzer'; // Adjusted path
import { BechdelTestResult, ContractResult } from '../../types/contracts'; // Adjusted path

describe('WritingQualityAnalyzer - analyzeBechdelTest', () => {
  let analyzer: WritingQualityAnalyzer;

  beforeEach(() => {
    // Given the current implementation instantiates CharacterDetectionSystem directly,
    // we don't need to mock it here unless we want to test CharacterDetectionSystem's behavior itself,
    // which is beyond the scope of this unit test for analyzeBechdelTest's own logic.
    analyzer = new WritingQualityAnalyzer();
  });

  it('should pass when two named female characters talk about something other than men', async () => {
    const text = 'Alice and Bella were friends. "Alice: Hello Bella, how is your project going?" "Bella: It is going great, Alice! I learned a new programming language."';
    const result: ContractResult<BechdelTestResult> = await analyzer.analyzeBechdelTest(text);

    expect(result.success).toBe(true);
    expect(result.data?.passes).toBe(true);
    expect(result.data?.message).toContain("Passes");
    expect(result.data?.evidence.femaleCharacters).toEqual(expect.arrayContaining(["Alice", "Bella"]));
    expect(result.data?.evidence.conversationSnippet).toBeDefined();
  });

  it('should fail if less than two female characters are identified', async () => {
    const text = 'Alice was here. "Alice: I am alone." "A voice: Who is there?"';
    const result: ContractResult<BechdelTestResult> = await analyzer.analyzeBechdelTest(text);

    expect(result.success).toBe(true);
    expect(result.data?.passes).toBe(false);
    expect(result.data?.message).toContain("Less than two female characters identified");
    // Based on current naive logic, it should find Alice.
    expect(result.data?.evidence.femaleCharacters).toEqual(["Alice"]);
  });

  it('should fail if female characters only talk about men (naive check)', async () => {
    const text = 'Alice and Bella were discussing something. "Alice: Did you see him today?" "Bella: Yes, he looked quite dashing."';
    const result: ContractResult<BechdelTestResult> = await analyzer.analyzeBechdelTest(text);

    expect(result.success).toBe(true);
    expect(result.data?.passes).toBe(false);
    expect(result.data?.message).toContain("No qualifying conversation found");
    expect(result.data?.evidence.femaleCharacters).toEqual(expect.arrayContaining(["Alice", "Bella"]));
  });

  it('should pass with three female characters if two of them talk not about men', async () => {
    const text = 'Alice, Bella, and Carol were present. "Alice: What a lovely day!" "Carol: Indeed, perfect for a walk." "Bella: I agree."';
    const result: ContractResult<BechdelTestResult> = await analyzer.analyzeBechdelTest(text);
    expect(result.success).toBe(true);
    expect(result.data?.passes).toBe(true);
    expect(result.data?.message).toContain("Passes");
    expect(result.data?.evidence.femaleCharacters).toEqual(expect.arrayContaining(["Alice", "Bella", "Carol"]));
  });

  it('should fail if no dialogue is present even with female characters', async () => {
    const text = 'Alice and Bella were in the room. They sat in silence.';
    const result: ContractResult<BechdelTestResult> = await analyzer.analyzeBechdelTest(text);
    expect(result.success).toBe(true);
    expect(result.data?.passes).toBe(false);
    // Message might vary: could be "No qualifying conversation" or specific to lack of dialogue
    expect(result.data?.message).toContain("No qualifying conversation found");
    expect(result.data?.evidence.femaleCharacters).toEqual(expect.arrayContaining(["Alice", "Bella"]));
  });

  it('should fail for empty text', async () => {
    const text = "";
    const result: ContractResult<BechdelTestResult> = await analyzer.analyzeBechdelTest(text);
    expect(result.success).toBe(true);
    expect(result.data?.passes).toBe(false);
    expect(result.data?.message).toContain("Less than two female characters identified");
    expect(result.data?.evidence.femaleCharacters).toEqual([]);
  });

  it('should fail for text with no recognizable female characters or dialogue', async () => {
    const text = "This is a story about a dog named Max. He barked.";
    const result: ContractResult<BechdelTestResult> = await analyzer.analyzeBechdelTest(text);
    expect(result.success).toBe(true);
    expect(result.data?.passes).toBe(false);
    expect(result.data?.message).toContain("Less than two female characters identified");
    expect(result.data?.evidence.femaleCharacters).toEqual([]);
  });

});
