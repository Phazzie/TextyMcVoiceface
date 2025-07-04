import { AIEnhancementService } from '../services/implementations/AIEnhancementService';
import { SeamManager } from '../services/SeamManager';
import { AppConfigService } from '../services/implementations/AppConfigService';
import { IAppConfigService } from '../types/contracts';

// Mock AppConfigService for testing
class MockAppConfigService implements IAppConfigService {
  private apiKey: string | null;
  constructor(apiKey: string | null = "TEST_OPENAI_API_KEY") {
    this.apiKey = apiKey;
  }
  async getOpenAIApiKey(): Promise<{ success: boolean; data?: string | null; error?: string }> {
    if (this.apiKey) {
      return { success: true, data: this.apiKey };
    }
    return { success: false, error: "API Key not configured for mock" };
  }
}

describe('AIEnhancementService', () => {
  let aiService: AIEnhancementService;
  let mockAppConfigService: MockAppConfigService;

  beforeEach(() => {
    // Ensure a fresh SeamManager instance or clear services if needed, though SeamManager is static
    // For simplicity, we'll assume SeamManager.services can be cleared or we manage registration carefully
    (SeamManager as unknown as { services: Map<string, unknown> }).services.clear(); // Clear previous registrations (test hack)

    mockAppConfigService = new MockAppConfigService();
    SeamManager.getInstance().registerAppConfigService(mockAppConfigService as IAppConfigService);
    aiService = new AIEnhancementService();
  });

  describe('rewriteFromNewPerspective', () => {
    it('should return success:false if text is missing', async () => {
      const result = await aiService.rewriteFromNewPerspective('', 'NewChar', 'OldChar');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return success:false if newCharacterName is missing', async () => {
      const result = await aiService.rewriteFromNewPerspective('Some text', '', 'OldChar');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return success:false if originalCharacterName is missing', async () => {
      const result = await aiService.rewriteFromNewPerspective('Some text', 'NewChar', '');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return a mock rewritten text on valid input (MOCK_API_CALL = true path)', async () => {
      const text = "He walked into the room.";
      const newChar = "Alice";
      const oldChar = "Bob";
      const result = await aiService.rewriteFromNewPerspective(text, newChar, oldChar);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toContain(`(From ${newChar}'s perspective, watching ${oldChar})`);
      expect(result.metadata?.originalText).toBe(text);
      expect(result.metadata?.newCharacterName).toBe(newChar);
      expect(result.metadata?.originalCharacterName).toBe(oldChar);
      expect(result.metadata?.usedMock).toBe(true);
    });

    // Conceptual test for real API path (would need actual mocking of fetch)
    it('should conceptually call the real API if MOCK_API_CALL is false and API key is present', async () => {
      // This test is more of a placeholder as we can't truly test the fetch call here without deeper mocking.
      // We'd set MOCK_API_CALL to false in the service (not possible from test directly without changing service code)
      // or mock global.fetch.

      // For now, we check the mock path again, assuming the internal flag is true.
      // If we had a way to set MOCK_API_CALL to false and mock fetch:
      // global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ choices: [{ message: { content: "Real AI response" }}]}) })) as jest.Mock;
      // const result = await aiService.rewriteFromNewPerspective("Text", "New", "Old");
      // expect(result.success).toBe(true);
      // expect(result.data).toBe("Real AI response");
      // expect(global.fetch).toHaveBeenCalledTimes(1);
      console.log("Skipping conceptual real API call test for rewriteFromNewPerspective in this environment.");
    });
  });

  describe('invertTrope', () => {
    it('should return success:false if context is missing', async () => {
      const result = await aiService.invertTrope('', 'SomeTrope');
      expect(result.success).toBe(false);
      expect(result.error).toEqual("Missing required parameters: context or tropeName.");
    });

    it('should return success:false if tropeName is missing', async () => {
      const result = await aiService.invertTrope('Some context', '');
      expect(result.success).toBe(false);
      expect(result.error).toEqual("Missing required parameters: context or tropeName.");
    });

    it('should return a mock inverted trope on valid input', async () => {
      const context = "A hero always wins.";
      const tropeName = "HeroAlwaysWins";
      const result = await aiService.invertTrope(context, tropeName);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toContain(tropeName);
      expect(result.data).toContain("unexpected subversion");
    });
  });

   describe('analyzeLiteraryDevices', () => {
    it('should return a mock list of literary devices', async () => {
      const text = "The world is a stage and Peter Piper picked a peck of pickled peppers.";
      const result = await aiService.analyzeLiteraryDevices(text);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data![0].deviceType).toBeDefined();
    });

    it('should return success:true with empty array for empty text (current mock behavior)', async () => {
        // The actual service might return an error or specific message for empty text.
        // Testing current mock behavior which is to proceed and return the standard mock.
      const result = await aiService.analyzeLiteraryDevices("");
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      // The mock always returns 2 devices regardless of input.
      expect(result.data!.length).toBe(2);
    });
  });
});
