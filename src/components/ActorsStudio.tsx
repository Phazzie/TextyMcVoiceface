import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Character, ActorArchetype } from '../types/contracts';

interface ActorsStudioProps {
  characters: Character[];
}

type CastingSelections = {
  [characterName: string]: ActorArchetype | undefined;
};

const ActorsStudio: React.FC<ActorsStudioProps> = ({ characters }) => {
  const [castingSelections, setCastingSelections] = useState<CastingSelections>({});

  const handleArchetypeChange = (characterName: string, archetype: ActorArchetype) => {
    setCastingSelections((prevSelections) => ({
      ...prevSelections,
      [characterName]: archetype,
    }));
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          AI Actors Studio
        </h1>
        <p className="mt-3 text-xl text-gray-400">Cast your characters with unique AI actor archetypes.</p>
      </header>

      {characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {characters.map((character) => (
            <div
              key={character.name}
              className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 hover:border-purple-500 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{character.name}</h3>
                  {/* <p className="text-sm text-gray-400">{character.frequency} lines</p> */}
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor={`archetype-${character.name}`} className="block text-sm font-medium text-gray-400 mb-1">
                  Actor Archetype
                </label>
                <select
                  id={`archetype-${character.name}`}
                  name={`archetype-${character.name}`}
                  className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors duration-200"
                  value={castingSelections[character.name] || ''}
                  onChange={(e) =>
                    handleArchetypeChange(character.name, e.target.value as ActorArchetype)
                  }
                >
                  <option value="" disabled className="text-gray-500">Select Archetype...</option>
                  {Object.values(ActorArchetype).map((archetype) => (
                    <option key={archetype} value={archetype} className="text-white bg-gray-700 hover:bg-gray-600">
                      {archetype}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <User size={64} className="mx-auto text-gray-600 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-500">No Characters Found</h2>
          <p className="text-gray-600 mt-2">Please add characters to your project to begin casting.</p>
        </div>
      )}

      {/* "Begin Table Read" Button */}
      {characters.length > 0 && (
        <div className="mt-16 text-center">
          <button
            disabled
            className="px-12 py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold text-lg rounded-lg shadow-xl hover:from-green-600 hover:to-cyan-600 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Begin Table Read
          </button>
        </div>
      )}
    </div>
  );
};

export default ActorsStudio;
