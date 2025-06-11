import React from 'react';
import { User, Crown, Volume2 } from 'lucide-react';
import { Character, VoiceAssignment } from '../types/contracts';

interface CharacterListProps {
  characters: Character[];
  voiceAssignments: VoiceAssignment[];
  onVoicePreview?: (character: string, voice: VoiceAssignment['voice']) => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({ 
  characters, 
  voiceAssignments, 
  onVoicePreview 
}) => {
  const getVoiceForCharacter = (characterName: string) => {
    return voiceAssignments.find(va => va.character === characterName);
  };

  const getCharacterIcon = (character: Character) => {
    if (character.name === 'Narrator') {
      return <User className="w-5 h-5 text-blue-500" />;
    }
    return character.isMainCharacter ? 
      <Crown className="w-5 h-5 text-yellow-500" /> : 
      <User className="w-5 h-5 text-gray-500" />;
  };

  const getVoiceTypeColor = (gender: string) => {
    switch (gender) {
      case 'female': return 'bg-pink-100 text-pink-700';
      case 'male': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (characters.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Character Voices</h3>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {characters.map((character) => {
          const voiceAssignment = getVoiceForCharacter(character.name);
          
          return (
            <div
              key={character.name}
              className="p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getCharacterIcon(character)}
                  <div>
                    <h4 className="font-semibold text-gray-800">{character.name}</h4>
                    <p className="text-sm text-gray-500">
                      {character.frequency} line{character.frequency !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                {character.isMainCharacter && (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                    Main
                  </span>
                )}
              </div>

              {voiceAssignment && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Voice:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVoiceTypeColor(voiceAssignment.voice.gender)}`}>
                      {voiceAssignment.voice.gender} · {voiceAssignment.voice.age}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Tone:</span>
                      <span className="capitalize">{voiceAssignment.voice.tone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pitch:</span>
                      <span>{(voiceAssignment.voice.pitch * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span>{(voiceAssignment.voice.speed * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {onVoicePreview && (
                    <button
                      onClick={() => onVoicePreview(character.name, voiceAssignment.voice)}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Preview Voice</span>
                    </button>
                  )}
                </div>
              )}

              {character.characteristics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Characteristics:</p>
                  <div className="flex flex-wrap gap-1">
                    {character.characteristics.slice(0, 3).map((trait) => (
                      <span
                        key={trait}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {trait}
                      </span>
                    ))}
                    {character.characteristics.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        +{character.characteristics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};