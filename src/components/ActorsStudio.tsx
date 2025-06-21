import React, { useState, useEffect } from 'react';
import { Character } from '../types/contracts'; // Assuming Character type is available

interface ActorsStudioProps {
  sceneText: string;
  characters: Character[];
  onStartTableRead: (sceneText: string, castingChoices: Record<string, string>) => Promise<void>;
  // We might need a way to know if App.tsx is busy with a table read from another source
  // or if this component should manage its own "performing" state that App.tsx can trigger.
  // For now, let's manage a local loading state triggered by its own button.
}

const ActorArchetypes = [
  "Default",
  "Nervous Student",
  "Booming Announcer",
  "Whispering Spy",
  "Heroic Knight",
  "Scheming Villain",
  "Comical Sidekick",
  "Wise Elder",
  "Sarcastic Teenager",
  "Enthusiastic Child"
];

export const ActorsStudio: React.FC<ActorsStudioProps> = ({ sceneText, characters, onStartTableRead }) => {
  const [castingChoices, setCastingChoices] = useState<Record<string, string>>({});
  const [isPerforming, setIsPerforming] = useState(false);

  // Initialize casting choices with default archetype for each character
  useEffect(() => {
    const initialCasting: Record<string, string> = {};
    characters.forEach(character => {
      initialCasting[character.name] = ActorArchetypes[0]; // Default to the first archetype
    });
    setCastingChoices(initialCasting);
  }, [characters]);

  const handleArchetypeChange = (characterName: string, archetype: string) => {
    setCastingChoices(prev => ({
      ...prev,
      [characterName]: archetype,
    }));
  };

  const handleBeginTableRead = async () => {
    if (!sceneText || characters.length === 0) {
      // In a real app, show a user notification
      console.warn("Scene text or characters missing for table read.");
      return;
    }
    setIsPerforming(true);
    try {
      await onStartTableRead(sceneText, castingChoices);
    } catch (error) {
      console.error("Error during table read:", error);
      // Optionally, show an error notification to the user via a prop or context
    } finally {
      setIsPerforming(false);
    }
  };

  if (!sceneText) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">AI Actors Studio</h2>
        <p className="text-gray-600">Load a story to begin setting up your AI table read.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">AI Actors Studio</h2>

      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-700 mb-2">Scene Text</h3>
        <textarea
          value={sceneText}
          readOnly
          className="w-full h-40 p-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Your scene text will appear here..."
        />
      </div>

      {characters.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-medium text-gray-700 mb-3">Cast Your Actors</h3>
          <div className="space-y-4">
            {characters.map(character => (
              <div key={character.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-800 font-medium">{character.name}</span>
                <select
                  value={castingChoices[character.name] || ActorArchetypes[0]}
                  onChange={(e) => handleArchetypeChange(character.name, e.target.value)}
                  disabled={isPerforming}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                >
                  {ActorArchetypes.map(archetype => (
                    <option key={archetype} value={archetype}>{archetype}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleBeginTableRead}
        disabled={isPerforming || characters.length === 0}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isPerforming ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Performing Table Read...
          </>
        ) : (
          'Begin Table Read'
        )}
      </button>
    </div>
  );
};
