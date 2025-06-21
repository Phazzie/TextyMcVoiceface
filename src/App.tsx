import React from 'react';
import './index.css'; // Using index.css as it is present
import ActorsStudio from './components/ActorsStudio';
import { Character } from './types/contracts'; // Ensure this path is correct

function App() {
  const mockCharacters: Character[] = [
    { name: 'Elara', frequency: 120, characteristics: ['Brave', 'Resourceful', 'Leader'], emotionalStates: ['Determined', 'Hopeful'], isMainCharacter: true, firstAppearance: 1 },
    { name: 'Jax', frequency: 95, characteristics: ['Witty', 'Agile', 'Sarcastic'], emotionalStates: ['Mischievous', 'Loyal'], isMainCharacter: false, firstAppearance: 3 },
    { name: 'General Vorlag', frequency: 70, characteristics: ['Ruthless', 'Strategic', 'Intimidating'], emotionalStates: ['Angry', 'Confident'], isMainCharacter: true, firstAppearance: 12 },
    { name: 'Lyra', frequency: 50, characteristics: ['Wise', 'Mysterious', 'Calm'], emotionalStates: ['Serene', 'Concerned'], isMainCharacter: false, firstAppearance: 7 },
    { name: 'Narrator', frequency: 200, characteristics: ['Omniscient', 'Eloquent'], emotionalStates: ['Neutral', 'Engaging'], isMainCharacter: false, firstAppearance: 0 },
  ];

  return (
    <div className="App">
      <ActorsStudio characters={mockCharacters} />
    </div>
  );
}

export default App;