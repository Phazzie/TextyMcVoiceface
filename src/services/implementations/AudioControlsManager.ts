import { 
  IAudioControlsManager, 
  ContractResult, 
  Bookmark, 
  TimestampedExport, 
  CharacterVolumeSettings, 
  PlaybackSettings 
} from '../../types/contracts';

export class AudioControlsManager implements IAudioControlsManager {
  private bookmarks: Map<string, Bookmark> = new Map();
  private playbackSettings: PlaybackSettings = {
    speed: 1.0,
    globalVolume: 1.0,
    characterVolumes: [],
    enableEQ: false,
    bassBoost: 0,
    trebleBoost: 0
  };
  private nextBookmarkId = 1;

  // Audio context for advanced audio processing
  private audioContext?: AudioContext;
  private currentAudioElement?: HTMLAudioElement;

  constructor() {
    this.initializeAudioContext();
    this.loadSettings();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not available:', error);
    }
  }

  async adjustPlaybackSpeed(speed: number): Promise<ContractResult<boolean>> {
    try {
      if (speed < 0.25 || speed > 4.0) {
        return {
          success: false,
          error: 'Playback speed must be between 0.25x and 4.0x'
        };
      }

      this.playbackSettings.speed = speed;
      
      // Apply to current audio element if available
      if (this.currentAudioElement) {
        this.currentAudioElement.playbackRate = speed;
      }

      await this.saveSettings();

      return {
        success: true,
        data: true,
        metadata: {
          newSpeed: speed,
          appliedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to adjust playback speed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async setVolumeForCharacter(character: string, volume: number): Promise<ContractResult<boolean>> {
    try {
      if (volume < 0 || volume > 1) {
        return {
          success: false,
          error: 'Volume must be between 0.0 and 1.0'
        };
      }

      // Find existing character volume setting or create new one
      const existingIndex = this.playbackSettings.characterVolumes.findIndex(cv => cv.character === character);
      
      if (existingIndex >= 0) {
        this.playbackSettings.characterVolumes[existingIndex].volume = volume;
      } else {
        this.playbackSettings.characterVolumes.push({
          character: character,
          volume: volume,
          muted: false,
          solo: false
        });
      }

      await this.saveSettings();

      return {
        success: true,
        data: true,
        metadata: {
          character: character,
          volume: volume,
          settingsCount: this.playbackSettings.characterVolumes.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set character volume: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async createBookmarks(position: number, label: string): Promise<ContractResult<Bookmark>> {
    try {
      if (position < 0) {
        return {
          success: false,
          error: 'Bookmark position cannot be negative'
        };
      }

      if (!label.trim()) {
        return {
          success: false,
          error: 'Bookmark label cannot be empty'
        };
      }

      const bookmarkId = `bookmark-${this.nextBookmarkId++}`;
      const bookmark: Bookmark = {
        id: bookmarkId,
        position: position,
        label: label.trim(),
        timestamp: Date.now(),
        description: '',
        segment: undefined,
        speaker: undefined
      };

      this.bookmarks.set(bookmarkId, bookmark);
      await this.saveBookmarks();

      return {
        success: true,
        data: bookmark,
        metadata: {
          totalBookmarks: this.bookmarks.size,
          createdAt: bookmark.timestamp
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async exportWithTimestamps(): Promise<ContractResult<TimestampedExport>> {
    try {
      // Generate SRT format by default
      const format = 'srt';
      let content = '';
      
      // Get all bookmarks sorted by position
      const sortedBookmarks = Array.from(this.bookmarks.values()).sort((a, b) => a.position - b.position);
      
      if (sortedBookmarks.length === 0) {
        content = '1\n00:00:00,000 --> 00:00:10,000\n[No bookmarks available]\n\n';
      } else {
        sortedBookmarks.forEach((bookmark, index) => {
          const startTime = this.formatSRTTime(bookmark.position);
          const endTime = this.formatSRTTime(bookmark.position + 5); // Default 5 second duration
          
          content += `${index + 1}\n`;
          content += `${startTime} --> ${endTime}\n`;
          content += `${bookmark.label}\n\n`;
        });
      }

      const timestampedExport: TimestampedExport = {
        format: format,
        content: content,
        metadata: {
          totalDuration: this.getTotalDuration(),
          segmentCount: sortedBookmarks.length,
          characterCount: this.getUniqueCharacterCount(),
          exportTime: Date.now()
        }
      };

      return {
        success: true,
        data: timestampedExport,
        metadata: {
          format: format,
          bookmarkCount: sortedBookmarks.length,
          contentLength: content.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export timestamps: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getBookmarks(): Promise<ContractResult<Bookmark[]>> {
    try {
      const bookmarkArray = Array.from(this.bookmarks.values()).sort((a, b) => a.position - b.position);
      
      return {
        success: true,
        data: bookmarkArray,
        metadata: {
          totalBookmarks: bookmarkArray.length,
          retrievedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async deleteBookmark(bookmarkId: string): Promise<ContractResult<boolean>> {
    try {
      if (!this.bookmarks.has(bookmarkId)) {
        return {
          success: false,
          error: `Bookmark with ID ${bookmarkId} not found`
        };
      }

      this.bookmarks.delete(bookmarkId);
      await this.saveBookmarks();

      return {
        success: true,
        data: true,
        metadata: {
          deletedId: bookmarkId,
          remainingBookmarks: this.bookmarks.size
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async updateBookmark(bookmarkId: string, updates: Partial<Bookmark>): Promise<ContractResult<Bookmark>> {
    try {
      const existingBookmark = this.bookmarks.get(bookmarkId);
      if (!existingBookmark) {
        return {
          success: false,
          error: `Bookmark with ID ${bookmarkId} not found`
        };
      }

      // Validate updates
      if (updates.position !== undefined && updates.position < 0) {
        return {
          success: false,
          error: 'Bookmark position cannot be negative'
        };
      }

      if (updates.label !== undefined && !updates.label.trim()) {
        return {
          success: false,
          error: 'Bookmark label cannot be empty'
        };
      }

      // Apply updates
      const updatedBookmark: Bookmark = {
        ...existingBookmark,
        ...updates,
        id: bookmarkId // Preserve original ID
      };

      this.bookmarks.set(bookmarkId, updatedBookmark);
      await this.saveBookmarks();

      return {
        success: true,
        data: updatedBookmark,
        metadata: {
          updatedFields: Object.keys(updates),
          updatedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async setCharacterVolumes(settings: CharacterVolumeSettings[]): Promise<ContractResult<boolean>> {
    try {
      // Validate all settings
      for (const setting of settings) {
        if (setting.volume < 0 || setting.volume > 1) {
          return {
            success: false,
            error: `Invalid volume ${setting.volume} for character ${setting.character}. Must be between 0.0 and 1.0`
          };
        }
      }

      this.playbackSettings.characterVolumes = [...settings];
      await this.saveSettings();

      return {
        success: true,
        data: true,
        metadata: {
          charactersConfigured: settings.length,
          appliedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set character volumes: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getPlaybackSettings(): Promise<ContractResult<PlaybackSettings>> {
    try {
      return {
        success: true,
        data: { ...this.playbackSettings },
        metadata: {
          characterCount: this.playbackSettings.characterVolumes.length,
          retrievedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get playback settings: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async resetToDefaults(): Promise<ContractResult<PlaybackSettings>> {
    try {
      this.playbackSettings = {
        speed: 1.0,
        globalVolume: 1.0,
        characterVolumes: [],
        enableEQ: false,
        bassBoost: 0,
        trebleBoost: 0
      };

      await this.saveSettings();

      return {
        success: true,
        data: { ...this.playbackSettings },
        metadata: {
          resetAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to reset settings: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Public method to register current audio element for direct control
  public setCurrentAudioElement(audioElement: HTMLAudioElement): void {
    this.currentAudioElement = audioElement;
    
    // Apply current settings
    audioElement.playbackRate = this.playbackSettings.speed;
    audioElement.volume = this.playbackSettings.globalVolume;
  }

  // Utility methods
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  private getTotalDuration(): number {
    // This would ideally be set from the actual audio output
    // For now, return a reasonable default or get from audio element
    return this.currentAudioElement?.duration || 0;
  }

  private getUniqueCharacterCount(): number {
    return new Set(this.playbackSettings.characterVolumes.map(cv => cv.character)).size;
  }

  private async saveSettings(): Promise<void> {
    try {
      localStorage.setItem('audioControlsSettings', JSON.stringify(this.playbackSettings));
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('audioControlsSettings');
      if (saved) {
        this.playbackSettings = { ...this.playbackSettings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  private async saveBookmarks(): Promise<void> {
    try {
      const bookmarkArray = Array.from(this.bookmarks.entries());
      localStorage.setItem('audioBookmarks', JSON.stringify(bookmarkArray));
    } catch (error) {
      console.warn('Failed to save bookmarks:', error);
    }
  }

  private loadBookmarks(): void {
    try {
      const saved = localStorage.getItem('audioBookmarks');
      if (saved) {
        const bookmarkArray = JSON.parse(saved) as [string, Bookmark][];
        this.bookmarks = new Map(bookmarkArray);
        
        // Update next ID based on existing bookmarks
        const maxId = Math.max(0, ...Array.from(this.bookmarks.keys()).map(id => {
          const match = id.match(/bookmark-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }));
        this.nextBookmarkId = maxId + 1;
      }
    } catch (error) {
      console.warn('Failed to load bookmarks:', error);
    }
  }
}