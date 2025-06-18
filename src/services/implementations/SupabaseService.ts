import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { 
  ContractResult, 
  StoryProject, 
  Character, 
  WritingQualityReport,
  AudioOutput 
} from '../../types/contracts';

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
  private isInitialized = false;

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
      const { data: { session } } = await this.supabase.auth.getSession();
      this.currentUser = session?.user || null;

      // If no user, sign in anonymously for demo mode
      if (!this.currentUser) {
        const { data, error } = await this.supabase.auth.signInAnonymously();
        if (error) {
          console.warn('Anonymous auth failed, continuing without auth:', error);
        } else {
          this.currentUser = data.user;
        }
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange((event, session) => {
        this.currentUser = session?.user || null;
      });

      this.isInitialized = true;
    } catch (error) {
      console.warn('Supabase auth initialization failed:', error);
      this.isInitialized = true; // Continue without auth
    }
  }

  async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Project Management
  async saveProject(project: StoryProject): Promise<ContractResult<boolean>> {
    try {
      await this.waitForInitialization();

      const dbProject: Partial<DatabaseProject> = {
        id: project.id,
        name: project.name,
        description: project.description,
        original_text: project.originalText,
        settings: project.settings,
        metadata: project.metadata,
        tags: project.tags,
        user_id: this.currentUser?.id || null
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

      // Load project
      const { data: projectData, error: projectError } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
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

      const { data: projectsData, error } = await this.supabase
        .from('projects')
        .select('*')
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

      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        throw error;
      }

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
  async signInWithEmail(email: string, password: string): Promise<ContractResult<User>> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      this.currentUser = data.user;
      return { success: true, data: data.user };
    } catch (error) {
      return {
        success: false,
        error: `Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async signUp(email: string, password: string): Promise<ContractResult<User>> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        this.currentUser = data.user;
      }

      return { success: true, data: data.user! };
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
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: `Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
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