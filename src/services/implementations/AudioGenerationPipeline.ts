import { 
  IAudioGenerationPipeline, 
  ContractResult, 
  TextSegment, 
  VoiceProfile, 
  AudioSegment, 
  AudioOutput 
} from '../../types/contracts';

export class AudioGenerationPipeline implements IAudioGenerationPipeline {
  private audioContext: AudioContext | null = null;
  private speechSynthesis: SpeechSynthesis;

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not available, using fallback methods');
    }
  }

  async generateSegmentAudio(segment: TextSegment, voice: VoiceProfile): Promise<ContractResult<AudioSegment>> {
    try {
      // Create speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(segment.content);
      
      // Configure voice parameters
      utterance.rate = voice.speed;
      utterance.pitch = voice.pitch;
      utterance.volume = 1.0;

      // Try to find a matching system voice
      const voices = this.speechSynthesis.getVoices();
      const matchingVoice = this.findBestMatchingVoice(voices, voice);
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      // Generate audio
      const audioBlob = await this.synthesizeToBlob(utterance);
      const duration = await this.calculateAudioDuration(audioBlob);

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
          originalLength: segment.content.length,
          voiceUsed: matchingVoice?.name || 'default',
          generationTime: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Audio generation failed for segment ${segment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      
      // If we have only one segment, return it directly
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

      // For multiple segments, we need to combine them
      const combinedBlob = await this.combineAudioBlobs(segments.map(s => s.audioData));
      const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
      
      // Get unique character count
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
      // For now, we'll implement basic optimization
      // In a production environment, this could include:
      // - Noise reduction
      // - Volume normalization
      // - Compression optimization
      // - Format conversion
      
      if (!this.audioContext) {
        // If no AudioContext, return original
        return {
          success: true,
          data: audioData,
          metadata: { optimized: false, reason: 'No AudioContext available' }
        };
      }

      // Convert blob to array buffer
      const arrayBuffer = await audioData.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Apply basic volume normalization
      const normalizedBuffer = this.normalizeVolume(audioBuffer);
      
      // Convert back to blob
      const optimizedBlob = await this.audioBufferToBlob(normalizedBuffer);

      return {
        success: true,
        data: optimizedBlob,
        metadata: {
          optimized: true,
          originalSize: audioData.size,
          optimizedSize: optimizedBlob.size,
          compressionRatio: optimizedBlob.size / audioData.size
        }
      };
    } catch (error) {
      // If optimization fails, return original audio
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

  private findBestMatchingVoice(voices: SpeechSynthesisVoice[], targetVoice: VoiceProfile): SpeechSynthesisVoice | null {
    if (voices.length === 0) return null;

    // Score each voice based on how well it matches our target
    const scoredVoices = voices.map(voice => {
      let score = 0;
      
      // Gender matching
      if (targetVoice.gender === 'female' && voice.name.toLowerCase().includes('female')) {
        score += 3;
      } else if (targetVoice.gender === 'male' && voice.name.toLowerCase().includes('male')) {
        score += 3;
      }
      
      // Language preference (English)
      if (voice.lang.startsWith('en')) {
        score += 2;
      }
      
      // Age matching (heuristic based on voice name)
      const voiceName = voice.name.toLowerCase();
      if (targetVoice.age === 'child' && voiceName.includes('child')) {
        score += 2;
      } else if (targetVoice.age === 'elderly' && (voiceName.includes('old') || voiceName.includes('senior'))) {
        score += 2;
      }
      
      // Quality preference (prefer Google/Apple voices if available)
      if (voiceName.includes('google') || voiceName.includes('apple')) {
        score += 1;
      }
      
      return { voice, score };
    });

    // Sort by score and return the best match
    scoredVoices.sort((a, b) => b.score - a.score);
    return scoredVoices[0]?.voice || voices[0];
  }

  private synthesizeToBlob(utterance: SpeechSynthesisUtterance): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Create a MediaRecorder to capture the speech synthesis
      const chunks: BlobPart[] = [];
      
      // Create an audio context for recording
      if (!this.audioContext) {
        // Fallback: create a simple audio blob with estimated duration
        const estimatedDuration = utterance.text.length * 100; // Rough estimate
        const silentBuffer = new ArrayBuffer(estimatedDuration);
        resolve(new Blob([silentBuffer], { type: 'audio/wav' }));
        return;
      }

      try {
        // Create a destination for recording
        const destination = this.audioContext.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(destination.stream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          resolve(blob);
        };

        mediaRecorder.onerror = (error) => {
          reject(error);
        };

        // Start recording
        mediaRecorder.start();

        // Set up speech synthesis callbacks
        utterance.onend = () => {
          setTimeout(() => {
            mediaRecorder.stop();
          }, 100); // Small delay to ensure audio is captured
        };

        utterance.onerror = (error) => {
          mediaRecorder.stop();
          reject(error);
        };

        // Start speech synthesis
        this.speechSynthesis.speak(utterance);

        // Fallback timeout
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 30000); // 30 second timeout
      } catch (error) {
        // Fallback: create a simple blob
        const estimatedDuration = utterance.text.length * 100;
        const silentBuffer = new ArrayBuffer(estimatedDuration);
        resolve(new Blob([silentBuffer], { type: 'audio/wav' }));
      }
    });
  }

  private async calculateAudioDuration(audioBlob: Blob): Promise<number> {
    try {
      if (!this.audioContext) {
        // Estimate duration based on text length
        // Rough estimate: 150 words per minute, 5 characters per word
        const textLength = audioBlob.size / 1000; // Very rough estimate
        return Math.max(1, textLength * 0.1);
      }

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer.duration;
    } catch (error) {
      // Fallback estimation
      return Math.max(1, audioBlob.size / 8000); // Very rough estimate
    }
  }

  private async combineAudioBlobs(blobs: Blob[]): Promise<Blob> {
    try {
      if (!this.audioContext) {
        // Simple concatenation fallback
        return new Blob(blobs, { type: 'audio/wav' });
      }

      // Decode all audio blobs
      const audioBuffers = await Promise.all(
        blobs.map(async (blob) => {
          const arrayBuffer = await blob.arrayBuffer();
          return await this.audioContext!.decodeAudioData(arrayBuffer);
        })
      );

      // Calculate total duration
      const totalDuration = audioBuffers.reduce((sum, buffer) => sum + buffer.duration, 0);
      
      // Create a new buffer to hold the combined audio
      const combinedBuffer = this.audioContext.createBuffer(
        audioBuffers[0].numberOfChannels,
        Math.ceil(totalDuration * audioBuffers[0].sampleRate),
        audioBuffers[0].sampleRate
      );

      // Copy all audio data into the combined buffer
      let offset = 0;
      for (const buffer of audioBuffers) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          combinedBuffer.getChannelData(channel).set(channelData, offset);
        }
        offset += buffer.length;
      }

      // Convert buffer back to blob
      return await this.audioBufferToBlob(combinedBuffer);
    } catch (error) {
      // Fallback: simple concatenation
      return new Blob(blobs, { type: 'audio/wav' });
    }
  }

  private normalizeVolume(audioBuffer: AudioBuffer): AudioBuffer {
    const normalizedBuffer = this.audioContext!.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = normalizedBuffer.getChannelData(channel);
      
      // Find the peak value
      let peak = 0;
      for (let i = 0; i < inputData.length; i++) {
        peak = Math.max(peak, Math.abs(inputData[i]));
      }
      
      // Normalize to 0.8 to prevent clipping
      const normalizeRatio = peak > 0 ? 0.8 / peak : 1;
      
      for (let i = 0; i < inputData.length; i++) {
        outputData[i] = inputData[i] * normalizeRatio;
      }
    }

    return normalizedBuffer;
  }

  private async audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
    // Convert AudioBuffer to WAV format
    const length = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bytesPerSample = 2;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;
    
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const intSample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, intSample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }
}