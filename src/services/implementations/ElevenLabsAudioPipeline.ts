import { 
  IAudioGenerationPipeline, 
  ContractResult, 
  TextSegment, 
  VoiceProfile, 
  AudioSegment, 
  AudioOutput 
} from '../../types/contracts';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: {
    gender?: string;
    age?: string;
    accent?: string;
    description?: string;
  };
}

interface ElevenLabsConfig {
  apiKey: string;
  model: string;
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export class ElevenLabsAudioPipeline implements IAudioGenerationPipeline {
  private config: ElevenLabsConfig;
  private availableVoices: ElevenLabsVoice[] = [];
  private voiceCache = new Map<string, ElevenLabsVoice>();

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      model: 'eleven_multilingual_v2', // High quality model
      stability: 0.5,
      similarity_boost: 0.5,
      style: 0.0,
      use_speaker_boost: true
    };
  }

  async initialize(): Promise<ContractResult<boolean>> {
    try {
      // Fetch available voices from ElevenLabs
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.config.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.availableVoices = data.voices;

      return {
        success: true,
        data: true,
        metadata: { voicesLoaded: this.availableVoices.length }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize ElevenLabs: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async generateSegmentAudio(segment: TextSegment, voice: VoiceProfile): Promise<ContractResult<AudioSegment>> {
    try {
      if (!this.config.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      // Map our voice profile to ElevenLabs voice
      const elevenLabsVoice = this.mapToElevenLabsVoice(voice);
      if (!elevenLabsVoice) {
        throw new Error(`No suitable ElevenLabs voice found for profile: ${voice.name}`);
      }

      // Prepare text with SSML for better control
      const processedText = this.addSSMLTags(segment.content, voice, segment.type);

      // Generate audio using ElevenLabs API
      const audioBlob = await this.callElevenLabsAPI(processedText, elevenLabsVoice, voice);
      const duration = await this.estimateAudioDuration(processedText);

      const audioSegment: AudioSegment = {
        id: segment.id,
        audioData: audioBlob,
        duration: duration,
        speaker: segment.speaker,
        text: segment.content
      };

      return {
        success: true,
        data: audioSegment,
        metadata: {
          voiceUsed: elevenLabsVoice.name,
          voiceId: elevenLabsVoice.voice_id,
          textLength: segment.content.length,
          generationTime: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `ElevenLabs audio generation failed for segment ${segment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async combineAudioSegments(segments: AudioSegment[]): Promise<ContractResult<AudioOutput>> {
    try {
      if (segments.length === 0) {
        return {
          success: false,
          error: 'No audio segments provided'
        };
      }

      const startTime = Date.now();
      
      // For single segment, return directly
      if (segments.length === 1) {
        const segment = segments[0];
        return {
          success: true,
          data: {
            audioFile: segment.audioData,
            duration: segment.duration,
            segments: segments,
            metadata: {
              characterCount: 1,
              totalSegments: 1,
              processingTime: Date.now() - startTime
            }
          }
        };
      }

      // Combine multiple audio segments
      const combinedBlob = await this.combineAudioBlobs(segments.map(s => s.audioData));
      const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
      
      const uniqueCharacters = new Set(segments.map(s => s.speaker)).size;

      const audioOutput: AudioOutput = {
        audioFile: combinedBlob,
        duration: totalDuration,
        segments: segments,
        metadata: {
          characterCount: uniqueCharacters,
          totalSegments: segments.length,
          processingTime: Date.now() - startTime
        }
      };

      return {
        success: true,
        data: audioOutput,
        metadata: {
          totalSegments: segments.length,
          totalDuration: totalDuration,
          uniqueCharacters: uniqueCharacters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Audio combination failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async optimizeAudio(audioData: Blob): Promise<ContractResult<Blob>> {
    try {
      // ElevenLabs already provides optimized audio, but we can add basic processing
      return {
        success: true,
        data: audioData,
        metadata: {
          optimized: true,
          originalSize: audioData.size,
          optimizedSize: audioData.size,
          compressionRatio: 1.0
        }
      };
    } catch (error) {
      return {
        success: true,
        data: audioData,
        metadata: {
          optimized: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private mapToElevenLabsVoice(voice: VoiceProfile): ElevenLabsVoice | null {
    // Check cache first
    const cacheKey = `${voice.gender}-${voice.age}-${voice.tone}`;
    if (this.voiceCache.has(cacheKey)) {
      return this.voiceCache.get(cacheKey)!;
    }

    // Find best matching voice from available voices
    const candidates = this.availableVoices.filter(v => {
      const labels = v.labels || {};
      
      // Gender matching
      if (voice.gender !== 'neutral') {
        const voiceGender = labels.gender?.toLowerCase();
        if (voiceGender && voiceGender !== voice.gender) {
          return false;
        }
      }

      // Age matching (heuristic)
      const voiceName = v.name.toLowerCase();
      if (voice.age === 'child' && !voiceName.includes('child') && !voiceName.includes('young')) {
        return false;
      }
      if (voice.age === 'elderly' && !voiceName.includes('old') && !voiceName.includes('elderly')) {
        return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      return this.availableVoices[0] || null; // Fallback to first available
    }

    // Score candidates and pick the best
    const scored = candidates.map(candidate => {
      let score = 0;
      const name = candidate.name.toLowerCase();
      const labels = candidate.labels || {};

      // Prefer voices that match gender exactly
      if (labels.gender?.toLowerCase() === voice.gender) score += 3;
      
      // Prefer voices that match tone
      if (voice.tone === 'warm' && (name.includes('warm') || name.includes('friendly'))) score += 2;
      if (voice.tone === 'dramatic' && (name.includes('dramatic') || name.includes('intense'))) score += 2;
      
      // Prefer clear, professional voices for narrator
      if (voice.name.includes('Narrator') && (name.includes('narrator') || name.includes('professional'))) score += 3;

      return { voice: candidate, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0].voice;
    
    // Cache the selection
    this.voiceCache.set(cacheKey, selected);
    
    return selected;
  }

  private addSSMLTags(text: string, voice: VoiceProfile, type: string): string {
    let processedText = text;

    // Add pauses for better pacing
    if (type === 'narration') {
      processedText = processedText.replace(/\. /g, '. <break time="0.5s"/> ');
      processedText = processedText.replace(/\, /g, ', <break time="0.2s"/> ');
    }

    // Adjust speed and pitch using prosody tags
    const speedPercent = Math.round(voice.speed * 100);
    const pitchHz = Math.round((voice.pitch - 1) * 50); // Convert to Hz offset
    
    processedText = `<prosody rate="${speedPercent}%" pitch="${pitchHz > 0 ? '+' : ''}${pitchHz}Hz">${processedText}</prosody>`;

    return processedText;
  }

  private async callElevenLabsAPI(text: string, voice: ElevenLabsVoice, voiceProfile: VoiceProfile): Promise<Blob> {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.config.apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: this.config.model,
        voice_settings: {
          stability: this.config.stability,
          similarity_boost: this.config.similarity_boost,
          style: this.config.style,
          use_speaker_boost: this.config.use_speaker_boost
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return await response.blob();
  }

  private async estimateAudioDuration(text: string): Promise<number> {
    // Rough estimation: average speaking rate is about 150-160 words per minute
    const words = text.split(/\s+/).length;
    const wordsPerMinute = 150;
    const durationMinutes = words / wordsPerMinute;
    return durationMinutes * 60; // Convert to seconds
  }

  private async combineAudioBlobs(blobs: Blob[]): Promise<Blob> {
    // Simple concatenation for now
    // In production, you might want to use Web Audio API for better mixing
    return new Blob(blobs, { type: 'audio/mpeg' });
  }

  // Utility method to get available voices
  getAvailableVoices(): ElevenLabsVoice[] {
    return this.availableVoices;
  }

  // Utility method to test API connection
  async testConnection(): Promise<ContractResult<boolean>> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': this.config.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status} ${response.statusText}`);
      }

      const userData = await response.json();
      
      return {
        success: true,
        data: true,
        metadata: {
          userName: userData.subscription?.character_count || 'Unknown',
          charactersLeft: userData.subscription?.character_limit - userData.subscription?.character_count || 'Unknown'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}