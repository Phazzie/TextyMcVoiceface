import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  RotateCcw, 
  Save, 
  Download, 
  Upload, 
  Play, 
  Pause,
  Settings,
  User,
  Sliders,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { 
  Character, 
  VoiceAssignment, 
  VoiceAdjustments, 
  VoiceProfile, 
  VoicePreview,
  VoiceSettings 
} from '../types/contracts';
import { SeamManager } from '../services/SeamManager';

interface VoiceCustomizerProps {
  characters: Character[];
  voiceAssignments: VoiceAssignment[];
  onVoiceUpdate?: (character: string, profile: VoiceProfile) => void;
}

export const VoiceCustomizer: React.FC<VoiceCustomizerProps> = ({
  characters,
  voiceAssignments,
  onVoiceUpdate
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [adjustments, setAdjustments] = useState<VoiceAdjustments>({});
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [currentPreview, setCurrentPreview] = useState<VoicePreview | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [customVoices, setCustomVoices] = useState<Record<string, VoiceProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize voice customizer
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacter) {
      setSelectedCharacter(characters[0].name);
    }
    loadCustomVoices();
  }, [characters, selectedCharacter]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const loadCustomVoices = async () => {
    try {
      const seamManager = SeamManager.getInstance();
      const voiceCustomizer = seamManager.getVoiceCustomizer();
      
      const result = await voiceCustomizer.getCustomVoices();
      if (result.success && result.data) {
        setCustomVoices(result.data);
      }
    } catch (error) {
      console.error('Failed to load custom voices:', error);
    }
  };

  const handleAdjustmentChange = (parameter: keyof VoiceAdjustments, value: number | string) => {
    setAdjustments(prev => ({
      ...prev,
      [parameter]: value
    }));
    
    // Clear current preview when adjustments change
    setCurrentPreview(null);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    }
  };

  const generatePreview = async () => {
    if (!selectedCharacter) return;

    setIsGeneratingPreview(true);
    setErrorMessage('');
    
    try {
      const seamManager = SeamManager.getInstance();
      const voiceCustomizer = seamManager.getVoiceCustomizer();
      
      const result = await voiceCustomizer.previewVoiceAdjustment(selectedCharacter, adjustments);
      
      if (result.success && result.data) {
        setCurrentPreview(result.data);
        
        // Create audio URL and load it
        if (audioRef.current) {
          const audioUrl = URL.createObjectURL(result.data.audioSegment.audioData);
          audioRef.current.src = audioUrl;
          audioRef.current.load();
        }
      } else {
        setErrorMessage(result.error || 'Failed to generate preview');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const playPreview = async () => {
    if (!audioRef.current || !currentPreview) return;

    try {
      if (isPlayingPreview) {
        audioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        await audioRef.current.play();
        setIsPlayingPreview(true);
      }
    } catch (error) {
      setErrorMessage('Failed to play preview audio');
    }
  };

  const saveCustomVoice = async () => {
    if (!selectedCharacter || !currentPreview) return;

    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const seamManager = SeamManager.getInstance();
      const voiceCustomizer = seamManager.getVoiceCustomizer();
      
      const result = await voiceCustomizer.saveCustomVoice(selectedCharacter, currentPreview.voiceProfile);
      
      if (result.success) {
        setSaveStatus('success');
        await loadCustomVoices(); // Refresh custom voices
        
        // Notify parent component
        if (onVoiceUpdate) {
          onVoiceUpdate(selectedCharacter, currentPreview.voiceProfile);
        }
        
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setErrorMessage(result.error || 'Failed to save custom voice');
      }
    } catch (error) {
      setSaveStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = async () => {
    if (!selectedCharacter) return;

    try {
      const seamManager = SeamManager.getInstance();
      const voiceCustomizer = seamManager.getVoiceCustomizer();
      
      const result = await voiceCustomizer.resetToDefault(selectedCharacter);
      
      if (result.success && result.data) {
        setAdjustments({});
        setCurrentPreview(null);
        await loadCustomVoices();
        
        if (onVoiceUpdate && result.data) {
          onVoiceUpdate(selectedCharacter, result.data);
        }
      } else {
        setErrorMessage(result.error || 'Failed to reset voice');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const exportSettings = async () => {
    try {
      const seamManager = SeamManager.getInstance();
      const voiceCustomizer = seamManager.getVoiceCustomizer();
      
      const result = await voiceCustomizer.exportVoiceSettings();
      
      if (result.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setErrorMessage(result.error || 'Failed to export settings');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const settings: VoiceSettings = JSON.parse(text);
      
      const seamManager = SeamManager.getInstance();
      const voiceCustomizer = seamManager.getVoiceCustomizer();
      
      const result = await voiceCustomizer.importVoiceSettings(settings);
      
      if (result.success) {
        await loadCustomVoices();
        setAdjustments({});
        setCurrentPreview(null);
      } else {
        setErrorMessage(result.error || 'Failed to import settings');
      }
    } catch (error) {
      setErrorMessage('Invalid settings file format');
    }
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCurrentVoiceProfile = (): VoiceProfile | null => {
    if (customVoices[selectedCharacter]) {
      return customVoices[selectedCharacter];
    }
    
    const assignment = voiceAssignments.find(va => va.character === selectedCharacter);
    return assignment?.voice || null;
  };

  const hasCustomizations = Object.keys(adjustments).length > 0 && Object.values(adjustments).some(v => v !== undefined && v !== null);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Sliders className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Voice Customizer</h3>
            <p className="text-gray-600">Fine-tune character voices with real-time preview</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={exportSettings}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors flex items-center space-x-1"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Character Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Character</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {characters.map((character) => (
            <button
              key={character.name}
              onClick={() => {
                setSelectedCharacter(character.name);
                setAdjustments({});
                setCurrentPreview(null);
              }}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedCharacter === character.name
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{character.name}</span>
              </div>
              {customVoices[character.name] && (
                <div className="flex items-center space-x-1 mt-2">
                  <Settings className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-purple-600">Custom</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedCharacter && (
        <>
          {/* Current Voice Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-800 mb-2">Current Voice Profile</h4>
            {(() => {
              const profile = getCurrentVoiceProfile();
              return profile ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Gender:</span>
                    <span className="ml-2 font-medium capitalize">{profile.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Age:</span>
                    <span className="ml-2 font-medium capitalize">{profile.age}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tone:</span>
                    <span className="ml-2 font-medium capitalize">{profile.tone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className={`ml-2 font-medium ${customVoices[selectedCharacter] ? 'text-purple-600' : 'text-gray-600'}`}>
                      {customVoices[selectedCharacter] ? 'Custom' : 'Default'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No voice profile available</p>
              );
            })()}
          </div>

          {/* Voice Adjustments */}
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            {/* Pitch Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pitch Adjustment: {adjustments.pitch !== undefined ? (adjustments.pitch > 0 ? '+' : '') + adjustments.pitch.toFixed(2) : '0.00'}
              </label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={adjustments.pitch || 0}
                onChange={(e) => handleAdjustmentChange('pitch', parseFloat(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Lower</span>
                <span>Normal</span>
                <span>Higher</span>
              </div>
            </div>

            {/* Speed Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speed Adjustment: {adjustments.speed !== undefined ? (adjustments.speed > 0 ? '+' : '') + adjustments.speed.toFixed(2) : '0.00'}
              </label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={adjustments.speed || 0}
                onChange={(e) => handleAdjustmentChange('speed', parseFloat(e.target.value))}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Slower</span>
                <span>Normal</span>
                <span>Faster</span>
              </div>
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
              <select
                value={adjustments.tone || ''}
                onChange={(e) => handleAdjustmentChange('tone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Keep Original</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="neutral">Neutral</option>
                <option value="dramatic">Dramatic</option>
              </select>
            </div>

            {/* Emphasis Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emphasis: {adjustments.emphasis !== undefined ? adjustments.emphasis.toFixed(1) : '0.5'}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={adjustments.emphasis !== undefined ? adjustments.emphasis : 0.5}
                onChange={(e) => handleAdjustmentChange('emphasis', parseFloat(e.target.value))}
                className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Subtle</span>
                <span>Natural</span>
                <span>Strong</span>
              </div>
            </div>
          </div>

          {/* Preview Controls */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-800">Voice Preview</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={generatePreview}
                  disabled={isGeneratingPreview || !hasCustomizations}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isGeneratingPreview ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  <span>{isGeneratingPreview ? 'Generating...' : 'Generate Preview'}</span>
                </button>

                {currentPreview && (
                  <button
                    onClick={playPreview}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    {isPlayingPreview ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>{isPlayingPreview ? 'Pause' : 'Play'}</span>
                  </button>
                )}
              </div>
            </div>

            {currentPreview && (
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Preview Text:</span>
                </div>
                <p className="text-sm text-gray-600 italic mb-3">"{currentPreview.previewText}"</p>
                <div className="text-xs text-gray-500">
                  Duration: {currentPreview.duration.toFixed(1)}s | 
                  Voice: {currentPreview.voiceProfile.name}
                </div>
              </div>
            )}

            {!hasCustomizations && (
              <p className="text-sm text-gray-500 italic">
                Adjust voice parameters above to generate a preview
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={resetToDefault}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Default</span>
            </button>

            <div className="flex items-center space-x-3">
              {saveStatus === 'success' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Saved successfully!</span>
                </div>
              )}

              {saveStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Save failed</span>
                </div>
              )}

              <button
                onClick={saveCustomVoice}
                disabled={!currentPreview || isSaving}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                {isSaving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Custom Voice'}</span>
              </button>
            </div>
          </div>

          {/* Error Display */}
          {errorMessage && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Hidden Elements */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingPreview(false)}
        onError={() => {
          setIsPlayingPreview(false);
          setErrorMessage('Failed to play audio preview');
        }}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={importSettings}
        className="hidden"
      />
    </div>
  );
};