import { ContractResult } from '../../types/contracts';

interface SecureConfig {
  elevenLabsApiKey?: string;
  openAIApiKey?: string; // Added OpenAI API key
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export class SecureConfigManager {
  private static instance: SecureConfigManager;
  private config: SecureConfig = {};
  private readonly STORAGE_KEY = 'secure_config_encrypted';

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): SecureConfigManager {
    if (!SecureConfigManager.instance) {
      SecureConfigManager.instance = new SecureConfigManager();
    }
    return SecureConfigManager.instance;
  }

  // Environment variable loading (highest priority)
  private loadEnvironmentConfig(): SecureConfig {
    return {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      elevenLabsApiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
      openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY
    };
  }

  // Secure storage loading (user-provided keys)
  private loadStoredConfig(): SecureConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        // In a production app, this would be encrypted
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load stored config:', error);
    }
    return {};
  }

  private loadConfig(): void {
    // Load from environment variables first
    const envConfig = this.loadEnvironmentConfig();
    
    // Load from secure storage second
    const storedConfig = this.loadStoredConfig();
    
    // Merge configs (env vars take precedence)
    this.config = {
      ...storedConfig,
      ...Object.fromEntries(
        Object.entries(envConfig).filter(([_, value]) => value !== undefined)
      )
    };
  }

  private saveConfig(): void {
    try {
      // Only save user-provided keys, not environment variables
      const configToSave: SecureConfig = {};
      
      // Only save ElevenLabs key if not from environment
      if (this.config.elevenLabsApiKey && !import.meta.env.VITE_ELEVENLABS_API_KEY) {
        configToSave.elevenLabsApiKey = this.config.elevenLabsApiKey;
      }
      if (this.config.openAIApiKey && !import.meta.env.VITE_OPENAI_API_KEY) {
        configToSave.openAIApiKey = this.config.openAIApiKey;
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configToSave));
    } catch (error) {
      console.warn('Failed to save config:', error);
    }
  }

  async setOpenAIApiKey(apiKey: string): Promise<ContractResult<boolean>> {
    try {
      if (!apiKey || apiKey.trim().length === 0) {
        return { success: false, error: 'OpenAI API key cannot be empty' };
      }
      // Basic validation for OpenAI keys (usually start with 'sk-')
      if (!apiKey.startsWith('sk-')) {
        // console.warn('OpenAI API key does not start with "sk-". This might be an issue.');
        // Not returning error for now, as some proxy services might use different formats.
      }
      this.config.openAIApiKey = apiKey.trim();
      this.saveConfig();
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set OpenAI API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getOpenAIApiKey(): Promise<ContractResult<string | null>> {
    try {
      const apiKey = this.config.openAIApiKey || null;
      return { success: true, data: apiKey };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get OpenAI API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async clearOpenAIApiKey(): Promise<ContractResult<boolean>> {
    try {
      delete this.config.openAIApiKey;
      this.saveConfig();
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear OpenAI API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Public API methods
  async setElevenLabsApiKey(apiKey: string): Promise<ContractResult<boolean>> {
    try {
      if (!apiKey || apiKey.trim().length === 0) {
        return {
          success: false,
          error: 'API key cannot be empty'
        };
      }

      // Basic validation
      if (!apiKey.startsWith('sk_')) {
        return {
          success: false,
          error: 'Invalid ElevenLabs API key format'
        };
      }

      this.config.elevenLabsApiKey = apiKey.trim();
      this.saveConfig();

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getElevenLabsApiKey(): Promise<ContractResult<string | null>> {
    try {
      const apiKey = this.config.elevenLabsApiKey || null;
      return { success: true, data: apiKey };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async clearElevenLabsApiKey(): Promise<ContractResult<boolean>> {
    try {
      delete this.config.elevenLabsApiKey;
      this.saveConfig();
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getSupabaseConfig(): Promise<ContractResult<{ url: string; anonKey: string } | null>> {
    try {
      const { supabaseUrl, supabaseAnonKey } = this.config;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: {
          url: supabaseUrl,
          anonKey: supabaseAnonKey
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get Supabase config: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Test if keys are properly configured
  async validateConfiguration(): Promise<ContractResult<{ elevenLabs: boolean; supabase: boolean }>> {
    try {
      const elevenLabsValid = !!(this.config.elevenLabsApiKey && this.config.elevenLabsApiKey.startsWith('sk_'));
      const supabaseValid = !!(this.config.supabaseUrl && this.config.supabaseAnonKey);

      return {
        success: true,
        data: {
          elevenLabs: elevenLabsValid,
          supabase: supabaseValid
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Security: Get masked key for display
  async getMaskedElevenLabsKey(): Promise<string> {
    const keyResult = await this.getElevenLabsApiKey();
    if (!keyResult.success || !keyResult.data) {
      return 'Not configured';
    }

    const key = keyResult.data;
    if (key.length < 8) return 'Invalid key';
    
    return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  }
}

// Singleton export
export const secureConfig = SecureConfigManager.getInstance();