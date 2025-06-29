import { ContractResult, IAIEnhancementService, LiteraryDeviceInstance, IAppConfigService } from "../../types/contracts";
import { SeamManager } from "../SeamManager";

export class AIEnhancementService implements IAIEnhancementService {
  private appConfigService: IAppConfigService | null = null;

  constructor() {
    try {
      // Attempt to get AppConfigService at construction. It's okay if it fails;
      // methods will attempt to retrieve it again on-demand.
      this.appConfigService = SeamManager.getInstance().getAppConfigService();
    } catch (error) {
      console.warn("AIEnhancementService: AppConfigService not found or not yet registered in SeamManager. It will be fetched on the first API call if available.");
    }
  }

  /**
   * Centralized private method to retrieve the OpenAI API key.
   * It ensures the AppConfigService is available before attempting to get the key.
   */
  private async _getApiKey(): Promise<string | null> {
    // If the service wasn't available at construction, try to get it now.
    if (!this.appConfigService) {
      try {
        if (SeamManager.isRegistered('AppConfigService')) {
          this.appConfigService = SeamManager.get<IAppConfigService>('AppConfigService');
        } else {
          console.warn("AIEnhancementService: AppConfigService is not registered. Cannot retrieve API key.");
          return null;
        }
      } catch (error) {
        console.warn("AIEnhancementService: Error getting AppConfigService on-demand.", error);
        return null;
      }
    }

    // Now, get the API key using the service.
    const apiKeyResult = await this.appConfigService.getOpenAIApiKey();
    if (apiKeyResult?.success && apiKeyResult.data) {
      return apiKeyResult.data;
    } else {
      console.warn("AIEnhancementService: Could not retrieve OpenAI API Key from AppConfigService. Error: ", apiKeyResult?.error);
      return null;
    }
  }

  async analyzeLiteraryDevices(text: string): Promise<ContractResult<LiteraryDeviceInstance[]>> {
    const systemPrompt = `You are a literary scholar with expert knowledge of rhetorical and literary devices. Your task is to analyze a given text and identify all instances of the following devices. For each device found, you must provide the text snippet, its position, and a brief explanation of why it qualifies as that device.\n\nHere is the list of devices to search for:\n- Comparison: Metaphor, Simile, Analogy, Personification, Allegory, Juxtaposition.\n- Sound & Rhythm: Alliteration, Assonance, Consonance, Onomatopoeia, Sibilance.\n- Emphasis & Understatement: Hyperbole, Understatement, Paradox, Oxymoron, Irony.\n- Structure & Plot: Foreshadowing, Flashback, Anaphora, Epistrophe, In Medias Res.\n- Imagery & Symbolism: Imagery (visual, auditory, tactile, olfactory, gustatory), Symbolism, Motif, Pathetic Fallacy.\n\nReturn your findings as a single JSON object with one key: \"devices\". The value of \"devices\" must be an array of objects, where each object has these exact keys: \"deviceType\", \"textSnippet\", \"explanation\", \"position\".`;

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
    const prompt = `
      You are a creative writing assistant.
      Your task is to help a user subvert a common trope in their writing.
      Here is the scene context:
      ---
      ${context}
      ---
      Here is the trope that was detected in the scene:
      Trope Name: ${tropeName}
      ---
      Please provide a short, creative snippet (1-3 sentences) that subverts this trope in an interesting way, fitting the given scene context.
      Return your suggestion as a JSON object with a single key \"suggestion\". Example: {\"suggestion\": \"Instead of the hero finding the magical sword, the sword finds him, complaining about its previous, less competent wielder.\"}
    `;

    const requestBody = {
      model: 'gpt-4o', // Or another preferred model
      messages: [
        { role: 'system', content: 'You are a helpful writing assistant specialized in subverting tropes. Respond with JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: "json_object" },
    };

    const apiKey = await this._getApiKey();

    // MOCK_API_CALL should ideally be a config or env var. True for now.
    const MOCK_API_CALL = true;

    if (MOCK_API_CALL || !apiKey || apiKey === "MOCK_OPENAI_API_KEY_FROM_CONFIG_SERVICE") {
      if (!apiKey || apiKey === "MOCK_OPENAI_API_KEY_FROM_CONFIG_SERVICE") {
        console.warn("Using mock API call for invertTrope due to missing or mock API key.");
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockInvertedTrope = `The opposite of ${tropeName} in context of "${context.substring(0,30)}..." might be "an unexpected subversion."`;
      return { success: true, data: mockInvertedTrope };
    }

    // --- Conceptual Real API Call Structure ---
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`, // Actual API key
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown API error" }));
        console.error("AI API Error:", response.status, errorData);
        return { success: false, error: `AI service error: ${response.status} ${errorData.message || ''}`.trim() };
      }

      const result = await response.json();
      const invertedTrope = result.choices?.[0]?.message?.content?.trim();

      if (!invertedTrope) {
        return { success: false, error: "AI service returned an empty or invalid response." };
      }
      return { success: true, data: invertedTrope, metadata: { modelUsed: "gpt-4o" } };

    } catch (error) {
      console.error("Error calling AI service:", error);
      return { success: false, error: `Failed to call AI service: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async rewriteFromNewPerspective(text: string, newCharacterName: string, originalCharacterName: string): Promise<ContractResult<string>> {
    if (!text || !newCharacterName || !originalCharacterName) {
      return { success: false, error: "Missing required parameters: text, newCharacterName, or originalCharacterName." };
    }

    const systemPrompt = `You are an expert creative writing assistant. Your task is to rewrite the provided paragraph from the perspective of a different character.\nOriginal Text: "${text}"\nOriginal Character: "${originalCharacterName}"\nRewrite this paragraph from the perspective of: "${newCharacterName}".\nInfer ${newCharacterName}'s likely thoughts, feelings, and observations about the events and dialogue in the original text. Maintain the core events but shift the internal monologue and descriptive focus.`;

    console.log("System Prompt for AI (Rewrite Perspective):", systemPrompt);

    const apiKey = await this._getApiKey();

    // MOCK_API_CALL should ideally be a config or env var. True for now.
    const MOCK_API_CALL = true;

    if (MOCK_API_CALL || !apiKey || apiKey === "MOCK_OPENAI_API_KEY_FROM_CONFIG_SERVICE") {
      if (!apiKey || apiKey === "MOCK_OPENAI_API_KEY_FROM_CONFIG_SERVICE") {
        console.warn("Using mock API call for rewriteFromNewPerspective due to missing or mock API key.");
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockRewrittenText = `(From ${newCharacterName}'s perspective, watching ${originalCharacterName}): I saw ${originalCharacterName} say, "${text.substring(0, 50)}...". I couldn't believe they actually said that. I felt [inferred emotion] because [inferred reason]. What they didn't realize was [secret thought/observation].`;
      return { success: true, data: mockRewrittenText, metadata: { originalText: text, originalCharacterName, newCharacterName, usedMock: true } };
    }

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
