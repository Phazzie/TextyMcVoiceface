import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { 
  ContractResult, 
  StoryProject, 
  Character, 
  // WritingQualityReport, // Commented out as it's not used in this file after recent changes
  // AudioOutput // Commented out as it's not used in this file after recent changes
} from '../../types/contracts';

// Define types for credentials
export interface SignInCredentials {
  email?: string;
  password?: string;
  provider?: 'google' | 'github'; // Example providers
}

export interface SignUpCredentials {
  email?: string;
  password?: string;
  // Add other fields like name, etc., if needed for sign-up
}


interface DatabaseProject {
  id: string;
  name: string;
  description?: string;
  original_text: string;
  settings: any;
  metadata: any;
  tags: string[];
  user_id?: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseCharacter {
  id: string;
  project_id: string;
  name: string;
  voice_profile: any;
  characteristics: string[];
  emotional_states: string[];
  frequency: number;
  is_main_character: boolean;
  created_at: string;
}

interface DatabaseAudioOutput {
  id: string;
  project_id: string;
  audio_url?: string;
  duration: number;
  segments: any;
  metadata: any;
  created_at: string;
}

interface DatabaseWritingReport {
  id: string;
  project_id: string;
  show_tell_issues: any;
  trope_matches: any;
  purple_prose_issues: any;
  overall_score: any;
  created_at: string;
}

export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUser: User | null = null;
  private currentSession: Session | null = null;
  private isInitialized = false;
  private authStateChangeListeners: Set<(event: AuthChangeEvent, session: Session | null) => void> = new Set();

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Get current session
      const { data: { session: initialSession } } = await this.supabase.auth.getSession();
      this.currentUser = initialSession?.user ?? null;
      this.currentSession = initialSession ?? null;

      // Notify initial state to any early listeners
      // This might be too early if listeners haven't subscribed yet,
      // but onAuthStateChange will also fire.
      this.notifyAuthStateChange('INITIALIZED', this.currentSession);


      // Listen for auth changes
      this.supabase.auth.onAuthStateChange((event, session) => {
        this.currentUser = session?.user ?? null;
        this.currentSession = session ?? null;
        this.notifyAuthStateChange(event, session);
      });

      this.isInitialized = true;
    } catch (error) {
      console.warn('Supabase auth initialization failed:', error);
      // Still set isInitialized to true so the app doesn't hang,
      // but auth features might not work.
      this.isInitialized = true;
      this.notifyAuthStateChange('SIGNED_OUT', null); // Notify as signed out due to error
    }
  }

  async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Method for components to subscribe to auth state changes
  subscribeToAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void {
    this.authStateChangeListeners.add(callback);
    // Optionally, immediately call back with current state
    // callback(this.currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', this.currentSession);
    return () => {
      this.authStateChangeListeners.delete(callback);
    };
  }

  private notifyAuthStateChange(event: AuthChangeEvent, session: Session | null): void {
    this.authStateChangeListeners.forEach(listener => listener(event, session));
  }


  // Project Management
  async saveProject(project: StoryProject): Promise<ContractResult<boolean>> {
    try {
      await this.waitForInitialization();

      if (!this.currentUser) {
        return { success: false, error: "User not authenticated. Cannot save project." };
      }

      const dbProject: Partial<DatabaseProject> = {
        id: project.id,
        name: project.name,
        description: project.description,
        original_text: project.originalText,
        settings: project.settings,
        metadata: project.metadata,
        tags: project.tags,
        user_id: this.currentUser.id // Now we can be sure currentUser is not null
      };

      const { error: projectError } = await this.supabase
        .from('projects')
        .upsert(dbProject);

      if (projectError) {
        throw projectError;
      }

      // Save characters
      if (project.characters.length > 0) {
        const dbCharacters: Partial<DatabaseCharacter>[] = project.characters.map(char => ({
          project_id: project.id,
          name: char.name,
          voice_profile: project.voiceAssignments.find(va => va.character === char.name)?.voice,
          characteristics: char.characteristics,
          emotional_states: char.emotionalStates,
          frequency: char.frequency,
          is_main_character: char.isMainCharacter
        }));

        // Delete existing characters and insert new ones
        await this.supabase
          .from('characters')
          .delete()
          .eq('project_id', project.id);

        const { error: charactersError } = await this.supabase
          .from('characters')
          .insert(dbCharacters);

        if (charactersError) {
          throw charactersError;
        }
      }

      // Save audio output if exists
      if (project.audioOutput) {
        const dbAudioOutput: Partial<DatabaseAudioOutput> = {
          project_id: project.id,
          duration: project.audioOutput.duration,
          segments: project.audioOutput.segments,
          metadata: project.audioOutput.metadata
        };

        const { error: audioError } = await this.supabase
          .from('audio_outputs')
          .upsert(dbAudioOutput);

        if (audioError) {
          throw audioError;
        }
      }

      // Save writing report if exists
      if (project.qualityReport) {
        const dbWritingReport: Partial<DatabaseWritingReport> = {
          project_id: project.id,
          show_tell_issues: project.qualityReport.showTellIssues,
          trope_matches: project.qualityReport.tropeMatches,
          purple_prose_issues: project.qualityReport.purpleProseIssues,
          overall_score: project.qualityReport.overallScore
        };

        const { error: reportError } = await this.supabase
          .from('writing_reports')
          .upsert(dbWritingReport);

        if (reportError) {
          throw reportError;
        }
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Failed to save project to Supabase:', error);
      return {
        success: false,
        error: `Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async loadProject(projectId: string): Promise<ContractResult<StoryProject>> {
    try {
      await this.waitForInitialization();

      if (!this.currentUser) {
        console.warn('Attempted to load project without a logged-in user.');
        return { success: false, error: 'User not authenticated' };
      }

      // Load project
      const { data: projectData, error: projectError } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', this.currentUser.id) // Ensure project belongs to the current user
        .single();

      if (projectError || !projectData) {
        throw new Error(projectError?.message || 'Project not found');
      }

      // Load characters
      const { data: charactersData, error: charactersError } = await this.supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId);

      if (charactersError) {
        throw charactersError;
      }

      // Load audio output
      const { data: audioData, error: audioError } = await this.supabase
        .from('audio_outputs')
        .select('*')
        .eq('project_id', projectId)
        .single();

      // Load writing report
      const { data: reportData, error: reportError } = await this.supabase
        .from('writing_reports')
        .select('*')
        .eq('project_id', projectId)
        .single();

      // Convert to StoryProject format
      const characters: Character[] = (charactersData || []).map(char => ({
        name: char.name,
        frequency: char.frequency,
        characteristics: char.characteristics,
        emotionalStates: char.emotional_states,
        isMainCharacter: char.is_main_character,
        firstAppearance: 0
      }));

      const voiceAssignments = (charactersData || [])
        .filter(char => char.voice_profile)
        .map(char => ({
          character: char.name,
          voice: char.voice_profile,
          confidence: 1.0
        }));

      const project: StoryProject = {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description,
        originalText: projectData.original_text,
        characters,
        voiceAssignments,
        customVoices: {},
        settings: projectData.settings || {},
        metadata: projectData.metadata || {},
        tags: projectData.tags || [],
        version: '1.0.0',
        audioOutput: audioData ? {
          audioFile: new Blob(), // Note: actual audio file would be loaded separately
          duration: audioData.duration,
          segments: audioData.segments,
          metadata: audioData.metadata
        } : undefined,
        qualityReport: reportData ? {
          showTellIssues: reportData.show_tell_issues,
          tropeMatches: reportData.trope_matches,
          purpleProseIssues: reportData.purple_prose_issues,
          overallScore: reportData.overall_score
        } : undefined
      };

      return { success: true, data: project };
    } catch (error) {
      console.error('Failed to load project from Supabase:', error);
      return {
        success: false,
        error: `Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async listProjects(): Promise<ContractResult<StoryProject[]>> {
    try {
      await this.waitForInitialization();

      if (!this.currentUser) {
        console.warn('Attempted to list projects without a logged-in user.');
        // Return empty list or an error, matching current pattern of returning empty list for non-critical failures.
        return { success: true, data: [] };
      }

      const { data: projectsData, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', this.currentUser.id) // Filter by user_id
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Convert to simplified project list (without full data)
      const projects: StoryProject[] = (projectsData || []).map(proj => ({
        id: proj.id,
        name: proj.name,
        description: proj.description,
        originalText: '', // Don't load full text for list view
        characters: [],
        voiceAssignments: [],
        customVoices: {},
        settings: proj.settings || {},
        metadata: proj.metadata || {},
        tags: proj.tags || [],
        version: '1.0.0'
      }));

      return { success: true, data: projects };
    } catch (error) {
      console.error('Failed to list projects from Supabase:', error);
      return {
        success: false,
        error: `Failed to list projects: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async deleteProject(projectId: string): Promise<ContractResult<boolean>> {
    try {
      await this.waitForInitialization();

      if (!this.currentUser) {
        console.warn('Attempted to delete project without a logged-in user.');
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', this.currentUser.id); // Ensure project belongs to the current user

      if (error) {
        // Check if the error is due to RLS (Row Level Security) or project not found for this user
        // Supabase might return a generic error or a specific one depending on RLS setup
        // For now, we just throw the error. If it's a 0-row deletion, it's not an error per se,
        // but the project might not have existed or didn't belong to the user.
        // The .delete() method doesn't error if no rows match, so an explicit check might be needed
        // if we want to differentiate "not found" from "delete failed for other reasons".
        // However, for simplicity, if RLS is properly configured, this will prevent unauthorized deletion.
        throw error;
      }
      // Note: If no row matches (e.g. project ID doesn't exist or user_id doesn't match),
      // Supabase delete doesn't error. It just deletes 0 rows. This is generally fine.
      return { success: true, data: true };
    } catch (error) {
      console.error('Failed to delete project from Supabase:', error);
      return {
        success: false,
        error: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Auth methods
  async signIn(credentials: SignInCredentials): Promise<ContractResult<User>> {
    try {
      let response;
      if (credentials.provider) {
        // OAuth sign-in
        response = await this.supabase.auth.signInWithOAuth({
          provider: credentials.provider,
        });
      } else if (credentials.email && credentials.password) {
        // Email/password sign-in
        response = await this.supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
      } else {
        throw new Error('Invalid sign-in credentials. Provide email/password or a provider.');
      }

      const { data, error } = response;

      if (error) {
        throw error;
      }

      // For OAuth, data.user might be null initially if it redirects.
      // onAuthStateChange will handle the user update upon redirect.
      // For email/password, data.user should be populated.
      if (data.user) {
        this.currentUser = data.user;
        this.currentSession = data.session;
      }
      // If data.session is null but user exists (e.g. OAuth redirect where session is picked up by listener),
      // onAuthStateChange handles setting currentSession.

      return { success: true, data: data.user! }; // User might be null for OAuth redirects, consumer should handle
    } catch (error) {
      return {
        success: false,
        error: `Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async signUp(credentials: SignUpCredentials): Promise<ContractResult<User>> {
    try {
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required for sign-up.');
      }
      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        // options: { data: { full_name: credentials.fullName } } // Example of passing additional data
      });

      if (error) {
        throw error;
      }

      // User might require confirmation, so data.user might have session null initially.
      // onAuthStateChange will reflect the user state.
      if (data.user) {
        this.currentUser = data.user;
        this.currentSession = data.session;
      }
      return { success: true, data: data.user! }; // User might be null if confirmation is needed.
    } catch (error) {
      return {
        success: false,
        error: `Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async signOut(): Promise<ContractResult<boolean>> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      this.currentUser = null;
      this.currentSession = null;
      // onAuthStateChange will also fire, but good to clear it here too.
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: `Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  getCurrentUser(): User | null {
    // Ensure this returns the user from the latest session state if possible,
    // though this.currentUser is updated by onAuthStateChange.
    return this.currentSession?.user ?? this.currentUser ?? null;
  }

  getUserSession(): Session | null {
    return this.currentSession;
  }

  // Test connection
  async testConnection(): Promise<ContractResult<boolean>> {
    try {
      await this.waitForInitialization();
      
      const { data, error } = await this.supabase
        .from('projects')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Singleton instance
export const supabaseService = new SupabaseService();