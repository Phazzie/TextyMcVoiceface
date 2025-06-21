import { IAIEnhancementService, TropeMatch, ContractResult } from '../../types/contracts';

// Define a simple interface for the OpenAI API request body
interface OpenAIRequest {
  model: string;
  messages: { role: 'system' | 'user'; content: string }[];
  temperature?: number;
  max_tokens?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response_format?: { type: any };
}

// Define a simple interface for the OpenAI API success response
interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any; // For error responses
}

export class AIEnhancementService implements IAIEnhancementService {
  private apiKey: string;
  private openAIEndpoint = 'https://api.openai.com/v1/chat/completions'; // Standard endpoint

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required for AIEnhancementService.');
    }
    this.apiKey = apiKey;
  }

  async invertTrope(sceneContext: string, trope: TropeMatch): Promise<ContractResult<string>> {
    const prompt = `
      You are a creative writing assistant.
      Your task is to help a user subvert a common trope in their writing.
      Here is the scene context:
      ---
      ${sceneContext}
      ---
      Here is the trope that was detected in the scene:
      Trope Name: ${trope.name}
      Trope Description: ${trope.description}
      The specific text identified as embodying this trope: "${trope.text}"
      ---
      Please provide a short, creative snippet (1-3 sentences) that subverts this trope in an interesting way, fitting the given scene context.
      Return your suggestion as a JSON object with a single key "suggestion". Example: {"suggestion": "Instead of the hero finding the magical sword, the sword finds him, complaining about its previous, less competent wielder."}
    `;

    const requestBody: OpenAIRequest = {
      model: 'gpt-4o', // Or another preferred model
      messages: [
        { role: 'system', content: 'You are a helpful writing assistant specialized in subverting tropes. Respond with JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: "json_object" },
    };

    try {
      const response = await fetch(this.openAIEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('OpenAI API Error:', errorData);
        return {
          success: false,
          error: `OpenAI API request failed: ${errorData.error?.message || response.statusText}`,
        };
      }

      const responseData: OpenAIResponse = await response.json();

      if (responseData.error) {
        console.error('OpenAI API Error in response data:', responseData.error);
        return {
          success: false,
          error: `OpenAI API returned an error: ${responseData.error.message || 'Unknown error'}`,
        };
      }

      if (!responseData.choices || responseData.choices.length === 0 || !responseData.choices[0].message || !responseData.choices[0].message.content) {
        return {
          success: false,
          error: 'OpenAI API response was empty or malformed (no choices or content).',
        };
      }

      const rawContent = responseData.choices[0].message.content;

      try {
        const parsedContent = JSON.parse(rawContent);
        if (parsedContent && typeof parsedContent.suggestion === 'string') {
          return {
            success: true,
            data: parsedContent.suggestion,
          };
        } else {
          console.warn("OpenAI response JSON did not contain a 'suggestion' string. Raw content:", rawContent);
          // Fallback: Try to return the raw content if JSON parsing or key access fails but content exists
          return {
            success: true,
            data: rawContent.trim(), // Trim whitespace as a basic cleanup
            metadata: { warning: "Suggestion format might be incorrect. Expected JSON with 'suggestion' key." }
          };
        }
      } catch (parseError) {
        console.warn("Failed to parse OpenAI response as JSON. Raw content:", rawContent, "Parse error:", parseError);
         // Fallback: Return the raw content if JSON parsing fails but content exists
        return {
            success: true,
            data: rawContent.trim(), // Trim whitespace
            metadata: { warning: "Suggestion was not valid JSON. Displaying raw AI output." }
        };
      }

    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return {
        success: false,
        error: `Failed to call OpenAI API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// Ensure the class implements the interface
// This is a type check, it doesn't produce any JS output
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _checkInterface(): IAIEnhancementService {
  return new AIEnhancementService("test-api-key");
}
