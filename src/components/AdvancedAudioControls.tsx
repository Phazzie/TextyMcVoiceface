import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Play, 
  Download, 
  RotateCcw,
  Trash2,
  Edit3,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { AudioControlsManager } from '../services/implementations/AudioControlsManager';
import { Bookmark, CharacterVolumeSettings, PlaybackSettings } from '../types/contracts';

interface AdvancedAudioControlsProps {
  audioElement: HTMLAudioElement | null;
  characters: string[];
  onBookmarkJump: (position: number) => void;
  onExportTimestamps: () => void;
}

export const AdvancedAudioControls: React.FC<AdvancedAudioControlsProps> = ({
  audioElement,
  characters,
  onBookmarkJump,
  onExportTimestamps
}) => {
  const [audioControls] = useState(() => new AudioControlsManager());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [playbackSettings, setPlaybackSettings] = useState<PlaybackSettings>({
    speed: 1.0,
    globalVolume: 1.0,
    characterVolumes: [],
    enableEQ: false,
    bassBoost: 0,
    trebleBoost: 0
  });
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newBookmarkLabel, setNewBookmarkLabel] = useState('');
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Initialize audio controls
  useEffect(() => {
    if (audioElement) {
      audioControls.setCurrentAudioElement(audioElement);
      
      // Load initial settings
      loadPlaybackSettings();
      loadBookmarks();
    }
  }, [audioElement, audioControls]);

  // Initialize character volumes when characters change
  useEffect(() => {
    if (characters.length > 0 && playbackSettings.characterVolumes.length === 0) {
      const defaultVolumes: CharacterVolumeSettings[] = characters.map(character => ({
        character,
        volume: 1.0,
        muted: false,
        solo: false
      }));
      
      setPlaybackSettings(prev => ({
        ...prev,
        characterVolumes: defaultVolumes
      }));
      
      audioControls.setCharacterVolumes(defaultVolumes);
    }
  }, [characters, playbackSettings.characterVolumes.length, audioControls]);

  // Track current audio time for bookmarks
  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => audioElement.removeEventListener('timeupdate', handleTimeUpdate);
  }, [audioElement]);

  const loadPlaybackSettings = async () => {
    const result = await audioControls.getPlaybackSettings();
    if (result.success && result.data) {
      setPlaybackSettings(result.data);
    }
  };

  const loadBookmarks = async () => {
    const result = await audioControls.getBookmarks();
    if (result.success && result.data) {
      setBookmarks(result.data);
    }
  };

  const handleSpeedChange = async (speed: number) => {
    const result = await audioControls.adjustPlaybackSpeed(speed);
    if (result.success) {
      setPlaybackSettings(prev => ({ ...prev, speed }));
    }
  };

  const handleCharacterVolumeChange = async (character: string, volume: number) => {
    const result = await audioControls.setVolumeForCharacter(character, volume);
    if (result.success) {
      setPlaybackSettings(prev => ({
        ...prev,
        characterVolumes: prev.characterVolumes.map(cv =>
          cv.character === character ? { ...cv, volume } : cv
        )
      }));
    }
  };

  const handleCharacterMute = async (character: string) => {
    const characterVolume = playbackSettings.characterVolumes.find(cv => cv.character === character);
    if (characterVolume) {
      const newMutedState = !characterVolume.muted;
      const updatedVolumes = playbackSettings.characterVolumes.map(cv =>
        cv.character === character ? { ...cv, muted: newMutedState } : cv
      );
      
      await audioControls.setCharacterVolumes(updatedVolumes);
      setPlaybackSettings(prev => ({ ...prev, characterVolumes: updatedVolumes }));
    }
  };

  const handleCharacterSolo = async (character: string) => {
    const characterVolume = playbackSettings.characterVolumes.find(cv => cv.character === character);
    if (characterVolume) {
      const newSoloState = !characterVolume.solo;
      const updatedVolumes = playbackSettings.characterVolumes.map(cv => ({
        ...cv,
        solo: cv.character === character ? newSoloState : (newSoloState ? false : cv.solo)
      }));
      
      await audioControls.setCharacterVolumes(updatedVolumes);
      setPlaybackSettings(prev => ({ ...prev, characterVolumes: updatedVolumes }));
    }
  };

  const handleCreateBookmark = async () => {
    if (!newBookmarkLabel.trim()) return;
    
    const result = await audioControls.createBookmarks(currentTime, newBookmarkLabel);
    if (result.success && result.data) {
      setBookmarks(prev => [...prev, result.data!].sort((a, b) => a.position - b.position));
      setNewBookmarkLabel('');
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    const result = await audioControls.deleteBookmark(bookmarkId);
    if (result.success) {
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    }
  };

  const handleEditBookmark = async (bookmarkId: string, newLabel: string) => {
    const result = await audioControls.updateBookmark(bookmarkId, { label: newLabel });
    if (result.success && result.data) {
      setBookmarks(prev => prev.map(b => b.id === bookmarkId ? result.data! : b));
      setEditingBookmark(null);
    }
  };

  const handleExportTimestamps = async () => {
    const result = await audioControls.exportWithTimestamps();
    if (result.success && result.data) {
      // Create download
      const blob = new Blob([result.data.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audiobook-timestamps.${result.data.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onExportTimestamps();
    }
  };

  const handleResetSettings = async () => {
    const result = await audioControls.resetToDefaults();
    if (result.success && result.data) {
      setPlaybackSettings(result.data);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      {/* Toggle Advanced Controls */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800">Audio Controls</h4>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
        </button>
      </div>

      {/* Basic Controls */}
      <div className="space-y-4">
        {/* Playback Speed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Playback Speed: {playbackSettings.speed}x
          </label>
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={playbackSettings.speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.25x</span>
            <span>1x</span>
            <span>2x</span>
            <span>4x</span>
          </div>
        </div>

        {/* Quick Bookmark */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newBookmarkLabel}
            onChange={(e) => setNewBookmarkLabel(e.target.value)}
            placeholder="Bookmark label..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateBookmark()}
          />
          <button
            onClick={handleCreateBookmark}
            disabled={!newBookmarkLabel.trim()}
            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-6">
          {/* Character Volume Controls */}
          {characters.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-800 mb-3">Character Volumes</h5>
              <div className="space-y-3">
                {playbackSettings.characterVolumes.map((characterVolume) => (
                  <div key={characterVolume.character} className="flex items-center space-x-3">
                    <div className="w-20 text-sm font-medium text-gray-700 truncate">
                      {characterVolume.character}
                    </div>
                    
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={characterVolume.muted ? 0 : characterVolume.volume}
                        onChange={(e) => handleCharacterVolumeChange(characterVolume.character, parseFloat(e.target.value))}
                        disabled={characterVolume.muted}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="w-8 text-xs text-gray-600">
                        {Math.round((characterVolume.muted ? 0 : characterVolume.volume) * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCharacterMute(characterVolume.character)}
                        className={`p-1.5 rounded ${
                          characterVolume.muted 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } transition-colors`}
                        title={characterVolume.muted ? 'Unmute' : 'Mute'}
                      >
                        {characterVolume.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleCharacterSolo(characterVolume.character)}
                        className={`p-1.5 rounded text-xs font-bold ${
                          characterVolume.solo 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } transition-colors`}
                        title={characterVolume.solo ? 'Exit Solo' : 'Solo'}
                      >
                        {characterVolume.solo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookmarks List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-800">Bookmarks ({bookmarks.length})</h5>
              <button
                onClick={handleExportTimestamps}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
            
            {bookmarks.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No bookmarks yet. Add one above!</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3 flex-1">
                      <button
                        onClick={() => onBookmarkJump(bookmark.position)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Play className="w-3 h-3" />
                        <span>{formatTime(bookmark.position)}</span>
                      </button>
                      
                      {editingBookmark === bookmark.id ? (
                        <input
                          type="text"
                          defaultValue={bookmark.label}
                          className="flex-1 px-2 py-1 text-sm border rounded"
                          onBlur={(e) => handleEditBookmark(bookmark.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditBookmark(bookmark.id, e.currentTarget.value);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="flex-1 text-sm text-gray-700">{bookmark.label}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingBookmark(bookmark.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset Controls */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleResetSettings}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};