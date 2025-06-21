import React, { useState } from 'react';
import { LiteraryDeviceInstance } from '../types/contracts';

interface LiteraryDeviceReportProps {
  devices: LiteraryDeviceInstance[];
}

type DeviceCategory = 'Comparison' | 'Sound & Rhythm' | 'Emphasis & Understatement' | 'Structure & Plot' | 'Imagery & Symbolism' | 'Other';

const deviceCategories: Record<DeviceCategory, LiteraryDeviceInstance['deviceType'][]> = {
  'Comparison': ['Metaphor', 'Simile', 'Analogy', 'Personification', 'Anthropomorphism', 'Zoomorphism', 'Allegory', 'Juxtaposition', 'Metonymy', 'Synecdoche', 'Allusion'],
  'Sound & Rhythm': ['Alliteration', 'Assonance', 'Consonance', 'Onomatopoeia', 'Cacophony', 'Euphony', 'Sibilance'],
  'Emphasis & Understatement': ['Hyperbole', 'Understatement', 'Paradox', 'Oxymoron', 'Irony', 'Euphemism', 'Pun'],
  'Structure & Plot': ['Foreshadowing', 'Flashback', 'Anaphora', 'Epistrophe', 'Polysyndeton', 'Asyndeton', 'ChekhovsGun', 'InMediasRes', 'Apostrophe'],
  'Imagery & Symbolism': ['Imagery', 'Symbolism', 'Motif', 'PatheticFallacy'],
  'Other': [] // For any devices not fitting above, though the prompt list is covered
};

const getCategoryForDevice = (deviceType: LiteraryDeviceInstance['deviceType']): DeviceCategory => {
  for (const category in deviceCategories) {
    if (deviceCategories[category as DeviceCategory].includes(deviceType)) {
      return category as DeviceCategory;
    }
  }
  return 'Other';
};

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{ marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          textAlign: 'left',
          background: '#f0f0f0',
          border: 'none',
          borderBottom: isOpen ? '1px solid #ccc' : 'none',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        {title} {isOpen ? '▲' : '▼'}
      </button>
      {isOpen && (
        <div style={{ padding: '1rem' }}>
          {children}
        </div>
      )}
    </div>
  );
};

const LiteraryDeviceCard: React.FC<{ device: LiteraryDeviceInstance }> = ({ device }) => (
  <div style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '0.5rem', borderRadius: '4px', background: '#fff' }}>
    <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#333' }}>{device.deviceType}</h4>
    <p style={{ fontStyle: 'italic', color: '#555', borderLeft: '3px solid #007bff', paddingLeft: '0.5rem', margin: '0.5rem 0' }}>
      "{device.textSnippet}"
    </p>
    <p style={{ fontSize: '0.9rem', color: '#444' }}>
      <strong style={{ color: '#222' }}>Explanation:</strong> {device.explanation}
    </p>
    <p style={{ fontSize: '0.8rem', color: '#777' }}>Position: {device.position}</p>
  </div>
);

const LiteraryDeviceReport: React.FC<LiteraryDeviceReportProps> = ({ devices }) => {
  if (!devices || devices.length === 0) {
    return <p>No literary devices detected.</p>;
  }

  const groupedDevices = devices.reduce((acc, device) => {
    const category = getCategoryForDevice(device.deviceType);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(device);
    return acc;
  }, {} as Record<DeviceCategory, LiteraryDeviceInstance[]>);

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9' }}>
      <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '0.5rem', color: '#0056b3' }}>Literary Device Report</h2>
      {Object.entries(groupedDevices).map(([category, deviceList]) => (
        <AccordionSection key={category} title={`Devices of ${category}`}>
          {deviceList.length > 0 ? (
            deviceList.map((device, index) => (
              <LiteraryDeviceCard key={`${device.deviceType}-${index}`} device={device} />
            ))
          ) : (
            <p>No devices found in this category.</p>
          )}
        </AccordionSection>
      ))}
    </div>
  );
};

// Mock data for development and testing
const mockLiteraryDevices: LiteraryDeviceInstance[] = [
  { deviceType: 'Metaphor', textSnippet: "Her eyes were pools of the deepest blue.", explanation: "Compares eyes to pools without using 'like' or 'as'.", position: 10 },
  { deviceType: 'Simile', textSnippet: "He runs like the wind.", explanation: "Compares running speed to wind using 'like'.", position: 50 },
  { deviceType: 'Alliteration', textSnippet: "Silly snakes slither silently.", explanation: "Repetition of the 's' sound.", position: 100 },
  { deviceType: 'Personification', textSnippet: "The wind whispered secrets through the trees.", explanation: "Gives human quality (whispering) to the wind.", position: 150 },
  { deviceType: 'Hyperbole', textSnippet: "I'm so hungry I could eat a horse.", explanation: "Exaggeration for effect.", position: 200 },
  { deviceType: 'Onomatopoeia', textSnippet: "The bee buzzed by.", explanation: "Word mimics a sound.", position: 250 },
  { deviceType: 'Irony', textSnippet: "A pilot with a fear of heights.", explanation: "Situational irony.", position: 300 },
  { deviceType: 'Foreshadowing', textSnippet: "The dark clouds gathered ominously, hinting at the storm to come.", explanation: "Suggests future events.", position: 350 },
  { deviceType: 'Imagery', textSnippet: "The air was filled with the scent of freshly baked bread and blooming lilacs.", explanation: "Appeals to the sense of smell (olfactory imagery).", position: 400 },
  { deviceType: 'Symbolism', textSnippet: "The dove, a symbol of peace, flew overhead.", explanation: "An object representing an abstract idea.", position: 420 },
   { deviceType: 'Juxtaposition', textSnippet: "It was the best of times, it was the worst of times.", explanation: "Placing contrasting ideas side by side.", position: 20},
  { deviceType: 'Assonance', textSnippet: "The rain in Spain falls mainly on the plain.", explanation: "Repetition of vowel sounds.", position: 60},
  { deviceType: 'Consonance', textSnippet: "Mike likes his new bike.", explanation: "Repetition of consonant sounds.", position: 70},
  { deviceType: 'Paradox', textSnippet: "This is the beginning of the end.", explanation: "A statement that appears self-contradictory but contains a deeper truth.", position: 210},
  { deviceType: 'Oxymoron', textSnippet: "Living dead.", explanation: "Two contradictory terms used together.", position: 220},
  { deviceType: 'Anaphora', textSnippet: "We shall not flag or fail. We shall go on to the end. We shall fight in France.", explanation: "Repetition of a word or phrase at the beginning of successive clauses.", position: 360},
  { deviceType: 'Motif', textSnippet: "Throughout the novel, the recurring image of a broken clock highlighted the protagonist's obsession with lost time.", explanation: "A recurring element that has symbolic significance.", position: 410},
];

// Example of how to use the component with mock data:
// const App = () => <LiteraryDeviceReport devices={mockLiteraryDevices} />;

export default LiteraryDeviceReport;
// To make this component usable, you would typically import it into another component
// and pass the `devices` prop, which would come from the AIEnhancementService.
// For example, in a parent component:
// import LiteraryDeviceReport from './LiteraryDeviceReport';
// import { AIEnhancementService } from '../services/implementations/AIEnhancementService';
// import { LiteraryDeviceInstance } from '../types/contracts';
//
// const MyPage = () => {
//   const [devices, setDevices] = useState<LiteraryDeviceInstance[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const service = new AIEnhancementService();
//
//   const handleAnalyzeText = async (text: string) => {
//     setIsLoading(true);
//     const result = await service.analyzeLiteraryDevices(text);
//     if (result.success && result.data) {
//       setDevices(result.data);
//     } else {
//       console.error("Error analyzing text:", result.error);
//       setDevices([]); // Clear previous results or show error
//     }
//     setIsLoading(false);
//   };
//
//   // Example: Call handleAnalyzeText with some text when the component mounts or on a button click
//   // useEffect(() => {
//   //   handleAnalyzeText("Some sample text to analyze for literary devices.");
//   // }, []);
//
//   if (isLoading) return <p>Loading literary devices...</p>;
//
//   return (
//     <div>
//       {/* Some UI to trigger analysis, e.g., a textarea and a button */}
//       <button onClick={() => handleAnalyzeText("The old man was a sea of wisdom, yet his words crashed like waves on the shore.")}>Analyze Sample</button>
//       <LiteraryDeviceReport devices={devices.length > 0 ? devices : mockLiteraryDevices} />
//     </div>
//   );
// };
//
// export default MyPage; // Or however you integrate it
//
// Note: The mock data is included directly in this file for simplicity.
// In a real app, you might fetch it or pass it as props.
// The styling is basic inline CSS for demonstration; consider using CSS modules or a styled-components approach for a real application.
