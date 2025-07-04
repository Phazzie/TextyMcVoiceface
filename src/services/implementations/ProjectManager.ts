import { 
  IProjectManager, 
  ContractResult, 
  StoryProject, 
  ProjectSettings, 
  ProjectMetadata, 
  ProjectHistory, 
  ProjectTemplate, 
  ProjectExport, 
  ProjectImport 
} from '../../types/contracts';

export class ProjectManager implements IProjectManager {
  private static readonly STORAGE_PREFIX = 'story_voice_studio_';
  private static readonly PROJECTS_KEY = 'projects';
  private static readonly HISTORY_KEY = 'project_history';
  private static readonly TEMPLATES_KEY = 'project_templates';
  private static readonly VERSION = '1.0.0';
  private static readonly MAX_BACKUP_DAYS = 30;
  private static readonly MAX_HISTORY_ENTRIES = 1000;

  private projects = new Map<string, StoryProject>();
  private projectHistory = new Map<string, ProjectHistory[]>();
  private templates = new Map<string, ProjectTemplate>();
  private autoSaveIntervals = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.initializeProjectManager();
  }

  private async initializeProjectManager(): Promise<void> {
    try {
      await this.loadProjectsFromStorage();
      await this.loadHistoryFromStorage();
      await this.loadTemplatesFromStorage();
      this.setupDefaultTemplates();
    } catch (error) {
      console.warn('Failed to initialize project manager:', error);
    }
  }

  // Core project operations
  async createProject(name: string, text: string, settings?: Partial<ProjectSettings>): Promise<ContractResult<StoryProject>> {
    try {
      if (!name || name.trim().length === 0) {
        return {
          success: false,
          error: 'Project name cannot be empty'
        };
      }

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'Project text cannot be empty'
        };
      }

      // Check for duplicate names
      const existingProject = Array.from(this.projects.values()).find(p => p.name === name.trim());
      if (existingProject) {
        return {
          success: false,
          error: `Project with name "${name}" already exists`
        };
      }

      const projectId = this.generateProjectId();
      const now = Date.now();

      const defaultSettings: ProjectSettings = {
        useElevenLabs: false,
        outputFormat: 'mp3',
        enableQualityAnalysis: true,
        playbackSpeed: 1.0,
        characterVolumes: {},
        bookmarks: [],
        lastEditPosition: 0,
        autoSave: true,
        autoSaveInterval: 5
      };

      const metadata: ProjectMetadata = {
        createdAt: now,
        modifiedAt: now,
        lastOpenedAt: now,
        wordCount: text.trim().split(/\s+/).length,
        characterCount: text.length,
        estimatedDuration: 0,
        completionStatus: 'draft',
        processingProgress: 0,
        fileSize: new Blob([text]).size,
        language: 'en',
        version: ProjectManager.VERSION
      };

      const project: StoryProject = {
        id: projectId,
        name: name.trim(),
        originalText: text,
        characters: [],
        voiceAssignments: [],
        customVoices: {},
        settings: { ...defaultSettings, ...settings },
        metadata,
        tags: [],
        version: ProjectManager.VERSION
      };

      // Save project
      this.projects.set(projectId, project);
      await this.saveProjectsToStorage();

      // Record creation in history
      await this.recordProjectAction(projectId, 'created', `Project "${name}" created`);

      // Set up auto-save if enabled
      if (project.settings.autoSave) {
        await this.enableAutoSave(projectId, project.settings.autoSaveInterval);
      }

      return {
        success: true,
        data: project,
        metadata: {
          projectId,
          createdAt: now,
          autoSaveEnabled: project.settings.autoSave
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async saveProject(project: StoryProject): Promise<ContractResult<boolean>> {
    try {
      if (!project || !project.id) {
        return {
          success: false,
          error: 'Invalid project data'
        };
      }

      // Update modification time
      project.metadata.modifiedAt = Date.now();

      // Recalculate metadata
      if (project.originalText) {
        project.metadata.wordCount = project.originalText.trim().split(/\s+/).length;
        project.metadata.characterCount = project.originalText.length;
        project.metadata.fileSize = new Blob([JSON.stringify(project)]).size;
      }

      // Store project
      this.projects.set(project.id, { ...project });
      await this.saveProjectsToStorage();

      // Record save action
      await this.recordProjectAction(project.id, 'saved', `Project "${project.name}" saved`);

      return {
        success: true,
        data: true,
        metadata: {
          projectId: project.id,
          savedAt: project.metadata.modifiedAt,
          fileSize: project.metadata.fileSize
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async loadProject(projectId: string): Promise<ContractResult<StoryProject>> {
    try {
      if (!projectId) {
        return {
          success: false,
          error: 'Project ID is required'
        };
      }

      const project = this.projects.get(projectId);
      if (!project) {
        return {
          success: false,
          error: `Project with ID "${projectId}" not found`
        };
      }

      // Update last opened time
      project.metadata.lastOpenedAt = Date.now();
      await this.saveProjectsToStorage();

      // Record open action
      await this.recordProjectAction(projectId, 'opened', `Project "${project.name}" opened`);

      return {
        success: true,
        data: { ...project }, // Return copy to prevent external mutation
        metadata: {
          projectId,
          loadedAt: Date.now(),
          lastModified: project.metadata.modifiedAt
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async deleteProject(projectId: string): Promise<ContractResult<boolean>> {
    try {
      if (!projectId) {
        return {
          success: false,
          error: 'Project ID is required'
        };
      }

      const project = this.projects.get(projectId);
      if (!project) {
        return {
          success: false,
          error: `Project with ID "${projectId}" not found`
        };
      }

      const projectName = project.name;

      // Stop auto-save if active
      if (this.autoSaveIntervals.has(projectId)) {
        clearInterval(this.autoSaveIntervals.get(projectId)!);
        this.autoSaveIntervals.delete(projectId);
      }

      // Record deletion before removing
      await this.recordProjectAction(projectId, 'deleted', `Project "${projectName}" deleted`);

      // Remove project and history
      this.projects.delete(projectId);
      this.projectHistory.delete(projectId);

      // Save changes
      await this.saveProjectsToStorage();
      await this.saveHistoryToStorage();

      return {
        success: true,
        data: true,
        metadata: {
          projectId,
          projectName,
          deletedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async duplicateProject(projectId: string, newName: string): Promise<ContractResult<StoryProject>> {
    try {
      const loadResult = await this.loadProject(projectId);
      if (!loadResult.success || !loadResult.data) {
        return {
          success: false,
          error: `Cannot load source project: ${loadResult.error}`
        };
      }

      const sourceProject = loadResult.data;
      
      // Create new project with duplicated data
      const createResult = await this.createProject(
        newName,
        sourceProject.originalText,
        sourceProject.settings
      );

      if (!createResult.success || !createResult.data) {
        return {
          success: false,
          error: `Failed to create duplicate: ${createResult.error}`
        };
      }

      const newProject = createResult.data;

      // Copy additional data
      newProject.characters = [...sourceProject.characters];
      newProject.voiceAssignments = [...sourceProject.voiceAssignments];
      newProject.customVoices = { ...sourceProject.customVoices };
      newProject.tags = [...sourceProject.tags];
      newProject.qualityReport = sourceProject.qualityReport ? { ...sourceProject.qualityReport } : undefined;

      // Save the enhanced duplicate
      await this.saveProject(newProject);

      return {
        success: true,
        data: newProject,
        metadata: {
          originalProjectId: projectId,
          duplicatedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to duplicate project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Project listing and search
  async listProjects(options?: { sortBy?: 'name' | 'created' | 'modified'; order?: 'asc' | 'desc'; limit?: number }): Promise<ContractResult<StoryProject[]>> {
    try {
      const opts = {
        sortBy: 'modified',
        order: 'desc',
        limit: undefined,
        ...options
      };

      let projects = Array.from(this.projects.values());

      // Sort projects
      projects.sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;

        switch (opts.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'created':
            aValue = a.metadata.createdAt;
            bValue = b.metadata.createdAt;
            break;
          case 'modified':
          default:
            aValue = a.metadata.modifiedAt;
            bValue = b.metadata.modifiedAt;
            break;
        }

        if (typeof aValue === 'string') {
          return opts.order === 'asc' ? aValue.localeCompare(bValue as string) : (bValue as string).localeCompare(aValue);
        } else {
          return opts.order === 'asc' ? aValue - (bValue as number) : (bValue as number) - aValue;
        }
      });

      // Apply limit
      if (opts.limit && opts.limit > 0) {
        projects = projects.slice(0, opts.limit);
      }

      return {
        success: true,
        data: projects.map(p => ({ ...p })), // Return copies
        metadata: {
          totalProjects: this.projects.size,
          filteredCount: projects.length,
          sortBy: opts.sortBy,
          order: opts.order
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list projects: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async searchProjects(query: string, filters?: { tags?: string[]; status?: string; dateRange?: { start: number; end: number } }): Promise<ContractResult<StoryProject[]>> {
    try {
      if (!query || query.trim().length === 0) {
        return this.listProjects();
      }

      const searchTerm = query.toLowerCase().trim();
      let results = Array.from(this.projects.values()).filter(project => {
        // Text search
        const nameMatch = project.name.toLowerCase().includes(searchTerm);
        const descriptionMatch = project.description?.toLowerCase().includes(searchTerm) ?? false;
        const textMatch = project.originalText.toLowerCase().includes(searchTerm);
        const tagMatch = project.tags.some(tag => tag.toLowerCase().includes(searchTerm));

        return nameMatch || descriptionMatch || textMatch || tagMatch;
      });

      // Apply filters
      if (filters) {
        if (filters.tags && filters.tags.length > 0) {
          results = results.filter(project => 
            filters.tags!.some(tag => project.tags.includes(tag))
          );
        }

        if (filters.status) {
          results = results.filter(project => project.metadata.completionStatus === filters.status);
        }

        if (filters.dateRange) {
          results = results.filter(project => 
            project.metadata.modifiedAt >= filters.dateRange!.start &&
            project.metadata.modifiedAt <= filters.dateRange!.end
          );
        }
      }

      return {
        success: true,
        data: results.map(p => ({ ...p })),
        metadata: {
          query: searchTerm,
          totalMatches: results.length,
          filters: filters || {}
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search projects: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getRecentProjects(limit: number = 5): Promise<ContractResult<StoryProject[]>> {
    try {
      return this.listProjects({
        sortBy: 'modified',
        order: 'desc',
        limit
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to get recent projects: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Project metadata management
  async updateProjectMetadata(projectId: string, metadata: Partial<ProjectMetadata>): Promise<ContractResult<boolean>> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        return {
          success: false,
          error: `Project with ID "${projectId}" not found`
        };
      }

      // Update metadata
      project.metadata = { ...project.metadata, ...metadata, modifiedAt: Date.now() };
      
      await this.saveProjectsToStorage();

      return {
        success: true,
        data: true,
        metadata: {
          projectId,
          updatedFields: Object.keys(metadata),
          updatedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async addProjectTags(projectId: string, tags: string[]): Promise<ContractResult<boolean>> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        return {
          success: false,
          error: `Project with ID "${projectId}" not found`
        };
      }

      const cleanTags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      const newTags = cleanTags.filter(tag => !project.tags.includes(tag));
      
      if (newTags.length === 0) {
        return {
          success: true,
          data: true,
          metadata: { message: 'No new tags to add' }
        };
      }

      project.tags.push(...newTags);
      project.metadata.modifiedAt = Date.now();
      
      await this.saveProjectsToStorage();

      return {
        success: true,
        data: true,
        metadata: {
          projectId,
          addedTags: newTags,
          totalTags: project.tags.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add tags: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async removeProjectTags(projectId: string, tags: string[]): Promise<ContractResult<boolean>> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        return {
          success: false,
          error: `Project with ID "${projectId}" not found`
        };
      }

      const cleanTags = tags.map(tag => tag.trim().toLowerCase());
      const originalCount = project.tags.length;
      
      project.tags = project.tags.filter(tag => !cleanTags.includes(tag));
      project.metadata.modifiedAt = Date.now();
      
      await this.saveProjectsToStorage();

      return {
        success: true,
        data: true,
        metadata: {
          projectId,
          removedCount: originalCount - project.tags.length,
          remainingTags: project.tags.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove tags: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async renameProject(projectId: string, newName: string): Promise<ContractResult<boolean>> {
    try {
      if (!newName || newName.trim().length === 0) {
        return {
          success: false,
          error: 'Project name cannot be empty'
        };
      }

      const project = this.projects.get(projectId);
      if (!project) {
        return {
          success: false,
          error: `Project with ID "${projectId}" not found`
        };
      }

      // Check for duplicate names
      const existingProject = Array.from(this.projects.values()).find(
        p => p.id !== projectId && p.name === newName.trim()
      );
      if (existingProject) {
        return {
          success: false,
          error: `Project with name "${newName}" already exists`
        };
      }

      const oldName = project.name;
      project.name = newName.trim();
      project.metadata.modifiedAt = Date.now();
      
      await this.saveProjectsToStorage();
      await this.recordProjectAction(projectId, 'renamed', `Project renamed from "${oldName}" to "${newName}"`);

      return {
        success: true,
        data: true,
        metadata: {
          projectId,
          oldName,
          newName: newName.trim(),
          renamedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to rename project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Import/Export functionality
  async exportProject(projectId: string, options: ProjectExport): Promise<ContractResult<Blob>> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        return {
          success: false,
          error: `Project with ID "${projectId}" not found`
        };
      }

      const exportData: Record<string, unknown> = { ...project };

      // Remove audio data if not requested
      if (!options.includeAudio && (exportData.audioOutput as AudioOutput | undefined)) { // Added type assertion for safety
        // Assuming exportData.audioOutput is of type AudioOutput | undefined
        const audioOutput = exportData.audioOutput as AudioOutput | undefined;
        if (audioOutput) {
            exportData.audioOutput = {
            ...audioOutput,
            audioFile: null,
            segments: audioOutput.segments.map((seg: AudioSegment) => ({ // Typed seg as AudioSegment
                ...seg,
                audioData: null
            }))
            };
        }
      }

      // Remove settings if not requested
      if (!options.includeSettings) {
        delete exportData.settings;
      }

      // Add history if requested
      if (options.includeHistory) {
        exportData.history = this.projectHistory.get(projectId) || [];
      }

      let blob: Blob;
      let filename = `${project.name}_export`;

      switch (options.format) {
        case 'json':
          blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          filename += '.json';
          break;

        case 'zip':
          // For ZIP format, we would need a ZIP library
          // For now, fall back to JSON
          blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          filename += '.json';
          break;

        case 'backup':
          // Add backup metadata
          exportData._backup = {
            version: ProjectManager.VERSION,
            exportedAt: Date.now(),
            options
          };
          blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          filename += '.backup';
          break;

        default:
          return {
            success: false,
            error: `Unsupported export format: ${options.format}`
          };
      }

      await this.recordProjectAction(projectId, 'exported', `Project exported as ${options.format}`);

      return {
        success: true,
        data: blob,
        metadata: {
          projectId,
          format: options.format,
          filename,
          size: blob.size,
          exportedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async importProject(importData: ProjectImport): Promise<ContractResult<StoryProject>> {
    try {
      let projectData: unknown; // Changed any to unknown

      // Parse import data based on format
      switch (importData.format) {
        case 'json':
          try {
            const text = typeof importData.data === 'string' ? 
              importData.data : 
              new TextDecoder().decode(importData.data as ArrayBuffer);
            projectData = JSON.parse(text);
          } catch (error) {
            console.error("JSON parsing error during import:", error);
            return {
              success: false,
              error: `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown parsing error'}`
            };
          }
          break;

        case 'txt':
          // Create new project from text
          const text = typeof importData.data === 'string' ? 
            importData.data : 
            new TextDecoder().decode(importData.data as ArrayBuffer);
          
          return this.createProject('Imported Text', text);

        default:
          return {
            success: false,
            error: `Unsupported import format: ${importData.format}`
          };
      }

      // Validate project data
      if (!projectData.name || !projectData.originalText) {
        return {
          success: false,
          error: 'Invalid project data: missing required fields'
        };
      }

      // Handle existing project
      if (this.projects.has(projectData.id) && !importData.options.overwriteExisting) {
        // Generate new ID
        projectData.id = this.generateProjectId();
        projectData.name = `${projectData.name} (Imported)`;
      }

      // Create/update project
      const project: StoryProject = {
        ...projectData,
        metadata: {
          ...projectData.metadata,
          modifiedAt: Date.now(),
          lastOpenedAt: Date.now(),
          version: ProjectManager.VERSION
        }
      };

      this.projects.set(project.id, project);
      await this.saveProjectsToStorage();

      await this.recordProjectAction(project.id, 'created', `Project imported from ${importData.format}`);

      return {
        success: true,
        data: project,
        metadata: {
          importedAt: Date.now(),
          originalFormat: importData.format,
          overwritten: this.projects.has(projectData.id)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async exportAllProjects(options: ProjectExport): Promise<ContractResult<Blob>> {
    try {
      const allProjects = Array.from(this.projects.values());
      const exportData: Record<string, unknown> = { // Explicitly typed
        version: ProjectManager.VERSION,
        exportedAt: Date.now(),
        projects: allProjects,
        options
      };

      // Remove audio data if not requested
      if (!options.includeAudio) {
        exportData.projects = exportData.projects.map(project => ({
          ...project,
          audioOutput: project.audioOutput ? {
            ...project.audioOutput,
            audioFile: null,
            segments: project.audioOutput.segments.map(seg => ({
              ...seg,
              audioData: null
            }))
          } : undefined
        }));
      }

      // Include history if requested
      if (options.includeHistory) {
        (exportData as any).history = Object.fromEntries(this.projectHistory.entries());
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });

      return {
        success: true,
        data: blob,
        metadata: {
          projectCount: allProjects.length,
          totalSize: blob.size,
          exportedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export all projects: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Auto-save and backup
  async enableAutoSave(projectId: string, intervalMinutes: number): Promise<ContractResult<boolean>> {
    try {
      if (intervalMinutes < 1 || intervalMinutes > 60) {
        return {
          success: false,
          error: 'Auto-save interval must be between 1 and 60 minutes'
        };
      }

      // Clear existing interval
      if (this.autoSaveIntervals.has(projectId)) {
        clearInterval(this.autoSaveIntervals.get(projectId)!);
      }

      // Set up new interval
      const interval = setInterval(async () => {
        const project = this.projects.get(projectId);
        if (project) {
          await this.saveProject(project);
        }
      }, intervalMinutes * 60 * 1000);

      this.autoSaveIntervals.set(projectId, interval);

      // Update project settings
      const project = this.projects.get(projectId);
      if (project) {
        project.settings.autoSave = true;
        project.settings.autoSaveInterval = intervalMinutes;
        await this.saveProjectsToStorage();
      }

      return {
        success: true,
        data: true,
        metadata: {
          projectId,
          intervalMinutes,
          enabledAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to enable auto-save: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async disableAutoSave(projectId: string): Promise<ContractResult<boolean>> {
    try {
      // Clear interval
      if (this.autoSaveIntervals.has(projectId)) {
        clearInterval(this.autoSaveIntervals.get(projectId)!);
        this.autoSaveIntervals.delete(projectId);
      }

      // Update project settings
      const project = this.projects.get(projectId);
      if (project) {
        project.settings.autoSave = false;
        await this.saveProjectsToStorage();
      }

      return {
        success: true,
        data: true,
        metadata: {
          projectId,
          disabledAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to disable auto-save: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async createBackup(projectId: string): Promise<ContractResult<string>> {
    try {
      const exportResult = await this.exportProject(projectId, {
        format: 'backup',
        includeAudio: true,
        includeSettings: true,
        includeHistory: true,
        compression: 'none'
      });

      if (!exportResult.success || !exportResult.data) {
        return {
          success: false,
          error: `Failed to create backup: ${exportResult.error}`
        };
      }

      const backupId = `backup_${projectId}_${Date.now()}`;
      const backupKey = `${ProjectManager.STORAGE_PREFIX}backup_${backupId}`;
      
      try {
        localStorage.setItem(backupKey, await this.blobToBase64(exportResult.data));
      } catch (error) {
        console.error("Error saving backup to localStorage:", error);
        return {
          success: false,
          error: `Insufficient storage space for backup: ${error instanceof Error ? error.message : 'Unknown storage error'}`
        };
      }

      return {
        success: true,
        data: backupId,
        metadata: {
          projectId,
          backupSize: exportResult.data.size,
          createdAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async restoreBackup(backupId: string): Promise<ContractResult<StoryProject>> {
    try {
      const backupKey = `${ProjectManager.STORAGE_PREFIX}backup_${backupId}`;
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) {
        return {
          success: false,
          error: `Backup with ID "${backupId}" not found`
        };
      }

      const blob = this.base64ToBlob(backupData);
      const text = await blob.text();
      
      const importResult = await this.importProject({
        source: 'file',
        format: 'json',
        data: text,
        options: {
          overwriteExisting: true,
          mergeSettings: false,
          validateData: true
        }
      });

      if (!importResult.success) {
        return importResult;
      }

      await this.recordProjectAction(
        importResult.data!.id, 
        'created', 
        `Project restored from backup ${backupId}`
      );

      return importResult;
    } catch (error) {
      return {
        success: false,
        error: `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Project templates
  async getProjectTemplates(): Promise<ContractResult<ProjectTemplate[]>> {
    try {
      const templates = Array.from(this.templates.values());
      
      return {
        success: true,
        data: templates.map(t => ({ ...t })),
        metadata: {
          totalTemplates: templates.length,
          categories: Array.from(new Set(templates.map(t => t.category)))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async createProjectFromTemplate(templateId: string, projectName: string): Promise<ContractResult<StoryProject>> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        return {
          success: false,
          error: `Template with ID "${templateId}" not found`
        };
      }

      const text = template.sampleText || 'Enter your story here...';
      
      const createResult = await this.createProject(projectName, text, template.defaultSettings);
      if (!createResult.success || !createResult.data) {
        return createResult;
      }

      const project = createResult.data;
      
      // Apply template customizations
      project.tags = [...template.tags];
      if (template.voiceTemplates.length > 0) {
        project.customVoices = template.voiceTemplates.reduce((acc, voice) => {
          acc[voice.name] = voice;
          return acc;
        }, {} as Record<string, VoiceProfile>); // Changed any to VoiceProfile
      }

      await this.saveProject(project);

      return {
        success: true,
        data: project,
        metadata: {
          templateId,
          templateName: template.name,
          createdAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create project from template: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async saveAsTemplate(projectId: string, templateName: string, description: string): Promise<ContractResult<ProjectTemplate>> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        return {
          success: false,
          error: `Project with ID "${projectId}" not found`
        };
      }

      const templateId = `template_${Date.now()}`;
      const template: ProjectTemplate = {
        id: templateId,
        name: templateName,
        description,
        category: 'custom',
        defaultSettings: { ...project.settings },
        sampleText: project.originalText.substring(0, 500) + (project.originalText.length > 500 ? '...' : ''),
        voiceTemplates: Object.values(project.customVoices),
        tags: [...project.tags]
      };

      this.templates.set(templateId, template);
      await this.saveTemplatesToStorage();

      return {
        success: true,
        data: template,
        metadata: {
          projectId,
          templateId,
          createdAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save as template: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // History and analytics
  async getProjectHistory(projectId: string): Promise<ContractResult<ProjectHistory[]>> {
    try {
      const history = this.projectHistory.get(projectId) || [];
      
      return {
        success: true,
        data: [...history], // Return copy
        metadata: {
          projectId,
          totalEntries: history.length,
          oldestEntry: history.length > 0 ? history[0].timestamp : null,
          newestEntry: history.length > 0 ? history[history.length - 1].timestamp : null
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get project history: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async recordProjectAction(projectId: string, action: ProjectHistory['action'], description: string): Promise<ContractResult<boolean>> {
    try {
      if (!this.projectHistory.has(projectId)) {
        this.projectHistory.set(projectId, []);
      }

      const history = this.projectHistory.get(projectId)!;
      const entry: ProjectHistory = {
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        timestamp: Date.now(),
        action,
        description
      };

      history.push(entry);

      // Limit history size
      if (history.length > ProjectManager.MAX_HISTORY_ENTRIES) {
        history.splice(0, history.length - ProjectManager.MAX_HISTORY_ENTRIES);
      }

      await this.saveHistoryToStorage();

      return {
        success: true,
        data: true,
        metadata: {
          entryId: entry.id,
          totalEntries: history.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to record action: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getStorageStats(): Promise<ContractResult<{ totalProjects: number; totalSize: number; availableSpace: number }>> {
    try {
      let totalSize = 0;

      // Calculate total storage usage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(ProjectManager.STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length * 2; // Rough estimate (UTF-16)
          }
        }
      }

      // Estimate available space (very rough)
      let availableSpace = 0;
      try {
        const testKey = 'storage_test';
        const testData = 'x'.repeat(1024 * 1024); // 1MB test
        let testSize = 0;
        
        while (testSize < 10 * 1024 * 1024) { // Test up to 10MB
          try {
            localStorage.setItem(testKey, testData.repeat(testSize / (1024 * 1024) + 1));
            testSize += 1024 * 1024;
          } catch {
            break;
          }
        }
        
        localStorage.removeItem(testKey);
        availableSpace = testSize;
      } catch {
        availableSpace = -1; // Unknown
      }

      return {
        success: true,
        data: {
          totalProjects: this.projects.size,
          totalSize,
          availableSpace
        },
        metadata: {
          calculatedAt: Date.now(),
          storagePrefix: ProjectManager.STORAGE_PREFIX
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Cleanup and maintenance
  async cleanupOldBackups(olderThanDays: number): Promise<ContractResult<number>> {
    try {
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      const keysToDelete: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${ProjectManager.STORAGE_PREFIX}backup_`)) {
          // Extract timestamp from backup key
          const match = key.match(/backup_[^_]+_(\d+)/);
          if (match) {
            const timestamp = parseInt(match[1]);
            if (timestamp < cutoffTime) {
              keysToDelete.push(key);
            }
          }
        }
      }

      // Delete old backups
      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
        deletedCount++;
      });

      return {
        success: true,
        data: deletedCount,
        metadata: {
          cutoffTime,
          olderThanDays,
          cleanedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup backups: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async validateProjectData(projectId: string): Promise<ContractResult<{ isValid: boolean; issues: string[] }>> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        return {
          success: false,
          error: `Project with ID "${projectId}" not found`
        };
      }

      const issues: string[] = [];

      // Validate required fields
      if (!project.name || project.name.trim().length === 0) {
        issues.push('Project name is empty');
      }

      if (!project.originalText || project.originalText.trim().length === 0) {
        issues.push('Project text is empty');
      }

      if (!project.metadata) {
        issues.push('Project metadata is missing');
      } else {
        if (!project.metadata.createdAt || project.metadata.createdAt <= 0) {
          issues.push('Invalid creation date');
        }
        if (!project.metadata.modifiedAt || project.metadata.modifiedAt <= 0) {
          issues.push('Invalid modification date');
        }
      }

      // Validate arrays
      if (!Array.isArray(project.characters)) {
        issues.push('Characters data is corrupted');
      }

      if (!Array.isArray(project.voiceAssignments)) {
        issues.push('Voice assignments data is corrupted');
      }

      if (!Array.isArray(project.tags)) {
        issues.push('Tags data is corrupted');
      }

      // Validate settings
      if (!project.settings) {
        issues.push('Project settings are missing');
      }

      return {
        success: true,
        data: {
          isValid: issues.length === 0,
          issues
        },
        metadata: {
          projectId,
          validatedAt: Date.now(),
          totalIssues: issues.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async repairProject(projectId: string): Promise<ContractResult<boolean>> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        return {
          success: false,
          error: `Project with ID "${projectId}" not found`
        };
      }

      let repaired = false;

      // Repair missing or invalid data
      if (!project.name || project.name.trim().length === 0) {
        project.name = `Untitled Project ${Date.now()}`;
        repaired = true;
      }

      if (!project.originalText) {
        project.originalText = '';
        repaired = true;
      }

      if (!project.metadata) {
        project.metadata = {
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          lastOpenedAt: Date.now(),
          wordCount: 0,
          characterCount: 0,
          estimatedDuration: 0,
          completionStatus: 'draft',
          processingProgress: 0,
          fileSize: 0,
          language: 'en',
          version: ProjectManager.VERSION
        };
        repaired = true;
      }

      if (!Array.isArray(project.characters)) {
        project.characters = [];
        repaired = true;
      }

      if (!Array.isArray(project.voiceAssignments)) {
        project.voiceAssignments = [];
        repaired = true;
      }

      if (!Array.isArray(project.tags)) {
        project.tags = [];
        repaired = true;
      }

      if (!project.settings) {
        project.settings = {
          useElevenLabs: false,
          outputFormat: 'mp3',
          enableQualityAnalysis: true,
          playbackSpeed: 1.0,
          characterVolumes: {},
          bookmarks: [],
          lastEditPosition: 0,
          autoSave: true,
          autoSaveInterval: 5
        };
        repaired = true;
      }

      if (!project.customVoices) {
        project.customVoices = {};
        repaired = true;
      }

      if (repaired) {
        project.metadata.modifiedAt = Date.now();
        await this.saveProject(project);
        await this.recordProjectAction(projectId, 'saved', 'Project data repaired');
      }

      return {
        success: true,
        data: repaired,
        metadata: {
          projectId,
          wasRepaired: repaired,
          repairedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to repair project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Private helper methods
  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveProjectsToStorage(): Promise<void> {
    try {
      const projectsData = Object.fromEntries(this.projects.entries());
      localStorage.setItem(
        `${ProjectManager.STORAGE_PREFIX}${ProjectManager.PROJECTS_KEY}`,
        JSON.stringify(projectsData)
      );
    } catch (error) {
      console.warn('Failed to save projects to storage:', error);
      throw new Error('Failed to save projects: insufficient storage space');
    }
  }

  private async loadProjectsFromStorage(): Promise<void> {
    try {
      const data = localStorage.getItem(`${ProjectManager.STORAGE_PREFIX}${ProjectManager.PROJECTS_KEY}`);
      if (data) {
        const projectsData = JSON.parse(data);
        this.projects = new Map(Object.entries(projectsData));
      }
    } catch (error) {
      console.warn('Failed to load projects from storage:', error);
    }
  }

  private async saveHistoryToStorage(): Promise<void> {
    try {
      const historyData = Object.fromEntries(this.projectHistory.entries());
      localStorage.setItem(
        `${ProjectManager.STORAGE_PREFIX}${ProjectManager.HISTORY_KEY}`,
        JSON.stringify(historyData)
      );
    } catch (error) {
      console.warn('Failed to save history to storage:', error);
    }
  }

  private async loadHistoryFromStorage(): Promise<void> {
    try {
      const data = localStorage.getItem(`${ProjectManager.STORAGE_PREFIX}${ProjectManager.HISTORY_KEY}`);
      if (data) {
        const historyData = JSON.parse(data);
        this.projectHistory = new Map(Object.entries(historyData));
      }
    } catch (error) {
      console.warn('Failed to load history from storage:', error);
    }
  }

  private async saveTemplatesToStorage(): Promise<void> {
    try {
      const templatesData = Object.fromEntries(this.templates.entries());
      localStorage.setItem(
        `${ProjectManager.STORAGE_PREFIX}${ProjectManager.TEMPLATES_KEY}`,
        JSON.stringify(templatesData)
      );
    } catch (error) {
      console.warn('Failed to save templates to storage:', error);
    }
  }

  private async loadTemplatesFromStorage(): Promise<void> {
    try {
      const data = localStorage.getItem(`${ProjectManager.STORAGE_PREFIX}${ProjectManager.TEMPLATES_KEY}`);
      if (data) {
        const templatesData = JSON.parse(data);
        this.templates = new Map(Object.entries(templatesData));
      }
    } catch (error) {
      console.warn('Failed to load templates from storage:', error);
    }
  }

  private setupDefaultTemplates(): void {
    if (this.templates.size === 0) {
      const defaultTemplates: ProjectTemplate[] = [
        {
          id: 'fiction_novel',
          name: 'Fiction Novel',
          description: 'Template for fiction novels with multiple characters',
          category: 'fiction',
          defaultSettings: {
            useElevenLabs: false,
            outputFormat: 'mp3',
            enableQualityAnalysis: true,
            playbackSpeed: 1.0,
            characterVolumes: {},
            bookmarks: [],
            lastEditPosition: 0,
            autoSave: true,
            autoSaveInterval: 5
          },
          sampleText: 'Chapter 1\n\nIt was a dark and stormy night when Sarah first arrived at the mansion...',
          voiceTemplates: [],
          tags: ['fiction', 'novel']
        },
        {
          id: 'short_story',
          name: 'Short Story',
          description: 'Template for short stories and flash fiction',
          category: 'fiction',
          defaultSettings: {
            useElevenLabs: false,
            outputFormat: 'mp3',
            enableQualityAnalysis: true,
            playbackSpeed: 1.1,
            characterVolumes: {},
            bookmarks: [],
            lastEditPosition: 0,
            autoSave: true,
            autoSaveInterval: 3
          },
          sampleText: 'The coffee shop was empty except for the barista and one customer...',
          voiceTemplates: [],
          tags: ['fiction', 'short-story']
        },
        {
          id: 'educational',
          name: 'Educational Content',
          description: 'Template for educational materials and tutorials',
          category: 'educational',
          defaultSettings: {
            useElevenLabs: false,
            outputFormat: 'mp3',
            enableQualityAnalysis: false,
            playbackSpeed: 0.9,
            characterVolumes: {},
            bookmarks: [],
            lastEditPosition: 0,
            autoSave: true,
            autoSaveInterval: 10
          },
          sampleText: 'Welcome to this educational module. Today we will learn about...',
          voiceTemplates: [],
          tags: ['educational', 'tutorial']
        }
      ];

      defaultTemplates.forEach(template => {
        this.templates.set(template.id, template);
      });

      this.saveTemplatesToStorage();
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:type;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64: string, mimeType: string = 'application/json'): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}