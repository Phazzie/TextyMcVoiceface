import { ContractResult, IAIEnhancementService, LiteraryDeviceInstance, IAppConfigService, Character } from "../../types/contracts";
import { SeamManager } from "../SeamManager";

export class AIEnhancementService implements IAIEnhancementService {
  private appConfigService: IAppConfigService | null = null;

  constructor() {
    try {
      // Attempt to get AppConfigService using the new typed getter.
      // This will throw if not registered, but we catch it.
      this.appConfigService = SeamManager.getInstance().getAppConfigService();
    } catch (error) {
      console.warn("AIEnhancementService: AppConfigService not found or not yet registered in SeamManager. API key retrieval will fail for real calls if not registered before use.", error);
      // Service can still be constructed for mock calls.
    }
  }

  async analyzeLiteraryDevices(text: string): Promise<ContractResult<LiteraryDeviceInstance[]>> {
    const systemPrompt = `You are a literary scholar with expert knowledge of rhetorical and literary devices. Your task is to analyze a given text and identify all instances of the following devices. For each device found, you must provide the text snippet, its position, and a brief explanation of why it qualifies as that device.

Here is the list of devices to search for:
- Comparison: Metaphor, Simile, Analogy, Personification, Allegory, Juxtaposition.
- Sound & Rhythm: Alliteration, Assonance, Consonance, Onomatopoeia, Sibilance.
- Emphasis & Understatement: Hyperbole, Understatement, Paradox, Oxymoron, Irony.
- Structure & Plot: Foreshadowing, Flashback, Anaphora, Epistrophe, In Medias Res.
- Imagery & Symbolism: Imagery (visual, auditory, tactile, olfactory, gustatory), Symbolism, Motif, Pathetic Fallacy.

Return your findings as a single JSON object with one key: "devices". The value of "devices" must be an array of objects, where each object has these exact keys: "deviceType", "textSnippet", "explanation", "position".`;

    console.log("System Prompt for AI (Analyze Literary Devices):", systemPrompt);
    console.log("Text to analyze:", text);

    // Mock response
    const mockDevices: LiteraryDeviceInstance[] = [
      { deviceType: 'Metaphor', textSnippet: "The world is a stage.", explanation: "This is a metaphor...", position: 0 },
      { deviceType: 'Alliteration', textSnippet: "Peter Piper picked...", explanation: "Repetition of 'p' sound.", position: 25 }
    ];
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, data: mockDevices };
  }

  async invertTrope(context: string, tropeName: string): Promise<ContractResult<string>> {
    if (!context || !tropeName) {
      return { success: false, error: "Missing required parameters: context or tropeName." };
    }
    console.log("AI Service: Invert Trope called with context:", context, "and trope:", tropeName);
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockInvertedTrope = `The opposite of ${tropeName} in context of "${context.substring(0,30)}..." might be "an unexpected subversion."`;
    return { success: true, data: mockInvertedTrope };
  }

  async rewriteFromNewPerspective(text: string, newCharacterName: string, originalCharacterName: string): Promise<ContractResult<string>> {
    if (!text || !newCharacterName || !originalCharacterName) {
      return { success: false, error: "Missing required parameters: text, newCharacterName, or originalCharacterName." };
    }

    const systemPrompt = `You are an expert creative writing assistant. Your task is to rewrite the provided paragraph from the perspective of a different character.
Original Text: "${text}"
Original Character: "${originalCharacterName}"
Rewrite this paragraph from the perspective of: "${newCharacterName}".
Infer ${newCharacterName}'s likely thoughts, feelings, and observations about the events and dialogue in the original text. Maintain the core events but shift the internal monologue and descriptive focus.`;

    console.log("System Prompt for AI (Rewrite Perspective):", systemPrompt);

    let apiKey: string | null = null;
    if (this.appConfigService) {
      const apiKeyResult = await this.appConfigService.getOpenAIApiKey();
      if (apiKeyResult?.success && apiKeyResult.data) {
        apiKey = apiKeyResult.data;
      } else {
        console.warn("AIEnhancementService: Could not retrieve OpenAI API Key from AppConfigService. Error: ", apiKeyResult?.error);
      }
    } else {
      // Attempt to get service again if it wasn't available at construction
      try {
        if (SeamManager.isRegistered('AppConfigService')) {
          this.appConfigService = SeamManager.get<IAppConfigService>('AppConfigService');
          if (this.appConfigService) {
            const apiKeyResult = await this.appConfigService.getOpenAIApiKey();
            if (apiKeyResult?.success && apiKeyResult.data) {
                apiKey = apiKeyResult.data;
            } else {
                console.warn("AIEnhancementService: Could not retrieve OpenAI API Key (2nd attempt). Error: ", apiKeyResult?.error);
            }
          }
        } else {
             console.warn("AIEnhancementService: AppConfigService still not registered. Cannot retrieve API key.");
        }
      } catch (error) {
        console.warn("AIEnhancementService: Error getting AppConfigService (2nd attempt).", error);
      }
    }

    // MOCK_API_CALL should ideally be a config or env var. True for now.
    const MOCK_API_CALL = true;

    if (MOCK_API_CALL || !apiKey || apiKey === "MOCK_OPENAI_API_KEY_FROM_CONFIG_SERVICE") {
      if (!apiKey || apiKey === "MOCK_OPENAI_API_KEY_FROM_CONFIG_SERVICE") {
        console.warn("Using mock API call for rewriteFromNewPerspective due to missing or mock API key.");
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockRewrittenText = `(From ${newCharacterName}'s perspective, watching ${originalCharacterName}): I saw ${originalCharacterName} say, "${text.substring(0, 50)}...". I couldn't believe they actually said that. I felt [inferred emotion] because [inferred reason]. What they didn't realize was [secret thought/observation].`;
      return { success: true, data: mockRewrittenText, metadata: { originalText: text, originalCharacterName, newCharacterName, usedMock: true } };
    } else {
      // --- Conceptual Real API Call Structure ---
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`, // Actual API key
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are an expert creative writing assistant." },
              { role: "user", content: systemPrompt } // Using the fully formed system prompt
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown API error" }));
          console.error("AI API Error:", response.status, errorData);
          return { success: false, error: `AI service error: ${response.status} ${errorData.message || ''}`.trim() };
        }

        const result = await response.json();
        const rewrittenText = result.choices?.[0]?.message?.content?.trim();

        if (!rewrittenText) {
          return { success: false, error: "AI service returned an empty or invalid response." };
        }
        return { success: true, data: rewrittenText, metadata: { modelUsed: "gpt-4o" } };

      } catch (error) {
        console.error("Error calling AI service:", error);
        return { success: false, error: `Failed to call AI service: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }
  }
}
