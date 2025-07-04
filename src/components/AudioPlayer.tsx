import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, RotateCcw, Volume2, Clock } from 'lucide-react';
import { AudioOutput } from '../types/contracts';
import { AdvancedAudioControls } from './AdvancedAudioControls';

interface AudioPlayerProps {
  audioOutput: AudioOutput;
  onDownload: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioOutput, onDownload }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  // const [showAdvancedControls, setShowAdvancedControls] = useState(false); // Unused state

  useEffect(() => {
    // Create object URL for the audio blob
    const url = URL.createObjectURL(audioOutput.audioFile);
    setAudioUrl(url);

    // Cleanup function
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioOutput.audioFile]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const newVolume = parseFloat(e.target.value);
    
    setVolume(newVolume);
    if (audio) {
      audio.volume = newVolume;
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    if (isPlaying) {
      audio.play();
    }
  };

  const handleBookmarkJump = (position: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = position;
    setCurrentTime(position);
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}m ${seconds}s`;
  };

  // Get unique character names from audio segments
  const characters = Array.from(new Set(audioOutput.segments.map(segment => segment.speaker)));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800">Your Audiobook</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(audioOutput.duration)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Volume2 className="w-4 h-4" />
            <span>{audioOutput.metadata.characterCount} voices</span>
          </div>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
      />

      {/* Main Controls */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>

          <button
            onClick={handleRestart}
            className="w-10 h-10 bg-white text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200 shadow-md"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                {formatTime(currentTime)}
              </span>
              <span className="text-sm text-gray-500">
                {formatTime(audioOutput.duration)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={audioOutput.duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(currentTime / audioOutput.duration) * 100}%, #E5E7EB ${(currentTime / audioOutput.duration) * 100}%, #E5E7EB 100%)`
              }}
            />
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <Volume2 className="w-5 h-5 text-gray-600" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-600 w-10">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Advanced Audio Controls */}
      <AdvancedAudioControls
        audioElement={audioRef.current}
        characters={characters}
        onBookmarkJump={handleBookmarkJump}
        onExportTimestamps={() => console.log('Timestamps exported')}
      />

      {/* Audio Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-2xl font-bold text-blue-600">{audioOutput.metadata.totalSegments}</div>
          <div className="text-sm text-gray-600">Segments</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-2xl font-bold text-purple-600">{audioOutput.metadata.characterCount}</div>
          <div className="text-sm text-gray-600">Characters</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-2xl font-bold text-green-600">{formatDuration(audioOutput.duration)}</div>
          <div className="text-sm text-gray-600">Duration</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(audioOutput.metadata.processingTime / 1000)}s
          </div>
          <div className="text-sm text-gray-600">Generated</div>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <button
          onClick={onDownload}
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Download Audiobook</span>
        </button>
      </div>
    </div>
  );
};