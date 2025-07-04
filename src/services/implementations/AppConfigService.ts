import { ContractResult, IAppConfigService } from "../../types/contracts";
// import { SeamManager } from "../SeamManager"; // Not used directly in this file's active code

export class AppConfigService implements IAppConfigService {
  private openAIApiKey: string | null = null;

  constructor() {
    // In a real app, this might load from environment variables or a secure store
    // For now, we can use a placeholder or allow it to be set via a method (not implemented here for simplicity)
    // Or try to load from environment variable if available ( Vite specific )
    this.openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY || "MOCK_OPENAI_API_KEY_FROM_CONFIG_SERVICE";
    if (this.openAIApiKey === "MOCK_OPENAI_API_KEY_FROM_CONFIG_SERVICE") {
        console.warn("AppConfigService: OpenAI API Key is using a mock value. Set VITE_OPENAI_API_KEY environment variable for a real key.");
    }
  }

  async getOpenAIApiKey(): Promise<ContractResult<string | null>> {
    if (this.openAIApiKey && this.openAIApiKey !== "MOCK_OPENAI_API_KEY_FROM_CONFIG_SERVICE") {
      return { success: true, data: this.openAIApiKey };
    }
    // If only the mock key is available, still return it but indicate it's a mock for dev purposes.
    // In a real scenario, if no key, you might return error or null based on requirements.
    if(this.openAIApiKey === "MOCK_OPENAI_API_KEY_FROM_CONFIG_SERVICE") {
        return { success: true, data: this.openAIApiKey, metadata: {isMockKey: true} };
    }
    return { success: false, error: "OpenAI API Key not configured." };
  }

  // Example of how this service might be registered if SeamManager is used for all services.
  // static register(): void {
  //   if (SeamManager) { // Check if SeamManager is defined, useful for testing environments
  //     SeamManager.registerService('AppConfigService', new AppConfigService());
  //   }
  // }
}

// Optional: Auto-register if SeamManager is part of the global setup and this service is always needed.
// AppConfigService.register();

// IMPORTANT: This service needs to be instantiated and registered with SeamManager at application startup,
// for example, in `main.tsx` or `App.tsx`:
// import { SeamManager } from './services/SeamManager';
// import { AppConfigService } from './services/implementations/AppConfigService';
// SeamManager.getInstance().registerAppConfigService(new AppConfigService());


// Export a singleton instance if preferred, similar to secureConfig
// export const appConfigService = new AppConfigService();
