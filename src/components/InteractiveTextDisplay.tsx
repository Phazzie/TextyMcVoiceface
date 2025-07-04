import React, { useState, useMemo } from 'react'; // Removed useEffect
import { Character, TextSegment, IAIEnhancementService } from '../types/contracts';
import { PerspectiveShiftModal } from './PerspectiveShiftModal'; // Assuming it's in the same directory or path is adjusted
import { Edit3 } from 'lucide-react'; // Icon for perspective shift

interface InteractiveTextDisplayProps {
  textSegments: TextSegment[]; // Assuming full text is represented by these segments
  characters: Character[];
  aiEnhancementService: IAIEnhancementService;
  className?: string;
}

export const InteractiveTextDisplay: React.FC<InteractiveTextDisplayProps> = ({
  textSegments,
  characters,
  aiEnhancementService,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<TextSegment | null>(null);
  // Store rewritten text by segment ID, now including the character it was rewritten from
  const [rewrittenTexts, setRewrittenTexts] = useState<Record<string, { text: string; character: string }>>({});

  // Memoize the segments to avoid re-renders if props haven't changed
  const segmentsToDisplay = useMemo(() => textSegments, [textSegments]);

  const handleSegmentClick = (segment: TextSegment) => {
    if (segment.type === 'narration' || segment.speaker.toLowerCase() === 'narrator' || characters.find(c => c.name === segment.speaker) ) {
        // Allow shift if it's narration, explicitly by "narrator", or by a known character
        setSelectedSegment(segment);
    } else {
        // Potentially disallow for segments with unknown speakers or types not suitable for shifting
        console.warn("Perspective shift not initiated for segment type:", segment.type, "or speaker:", segment.speaker);
        setSelectedSegment(null);
    }
  };

  const handleOpenModal = (event: React.MouseEvent, segment: TextSegment) => {
    event.stopPropagation(); // Prevent click from re-selecting segment if button is on the segment
    if (segment.type === 'narration' || segment.speaker.toLowerCase() === 'narrator' || characters.find(c => c.name === segment.speaker)) {
        setSelectedSegment(segment); // Ensure this segment is the one modal operates on
        setIsModalOpen(true);
    } else {
         alert("Perspective shift is generally intended for narration or dialogue from a known character's viewpoint.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // setSelectedSegment(null); // Optionally clear selection when modal closes
  };

  const handleRewriteComplete = (rewrittenText: string, newCharacterName: string) => {
    if (selectedSegment) {
      setRewrittenTexts(prev => ({
        ...prev,
        [selectedSegment.id]: { text: rewrittenText, character: newCharacterName },
      }));
    }
    // Modal closes itself on success
  };

  // Determine the original speaker name for the selected segment
  // The 'speaker' field in TextSegment is assumed to be the original character name.
  // If it's "narrator" or empty, we might need a conventional name.
  const getOriginalCharacterNameForModal = (): string => {
    if (!selectedSegment) return 'Narrator'; // Default if no segment selected
    if (selectedSegment.speaker && selectedSegment.speaker.trim() !== '') {
      return selectedSegment.speaker;
    }
    return 'Narrator'; // Default for segments without a clear speaker
  };

  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Interactive Story Text</h3>
      {segmentsToDisplay.length === 0 && <p className="text-gray-500">No text segments to display.</p>}

      {segmentsToDisplay.map((segment) => (
        <div key={segment.id} className="mb-2 relative group">
          <p
            onClick={() => handleSegmentClick(segment)}
            className={`
              p-3 rounded-md transition-colors cursor-pointer hover:bg-blue-50
              ${selectedSegment?.id === segment.id ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-gray-50'}
              ${segment.type === 'dialogue' ? 'pl-6 border-l-4 border-green-300' : ''}
              ${segment.type === 'thought' ? 'pl-6 border-l-4 border-purple-300 font-style-italic' : ''}
            `}
          >
            {segment.speaker && segment.speaker.toLowerCase() !== 'narrator' && segment.type !== 'narration' && (
              <strong className="text-sm text-indigo-600 mr-2">{segment.speaker}:</strong>
            )}
            {segment.content}
          </p>

          {/* Button to trigger perspective shift for this segment */}
          {(segment.type === 'narration' || segment.speaker.toLowerCase() === 'narrator' || characters.find(c => c.name === segment.speaker)) && (
            <button
                onClick={(e) => handleOpenModal(e, segment)}
                title="Shift perspective for this paragraph"
                className="absolute top-1/2 right-2 transform -translate-y-1/2 p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
                <Edit3 size={16} />
            </button>
          )}

          {/* Display rewritten text if available */}
          {rewrittenTexts[segment.id] && (
            <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
              <p className="text-sm font-semibold text-yellow-700 mb-1">
                Rewritten from {rewrittenTexts[segment.id].character}'s perspective:
              </p>
              <p className="text-sm text-yellow-800">{rewrittenTexts[segment.id].text}</p>
            </div>
          )}
        </div>
      ))}

      {selectedSegment && (
        <PerspectiveShiftModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          characters={characters}
          selectedText={selectedSegment.content}
          originalCharacterName={getOriginalCharacterNameForModal()}
          aiEnhancementService={aiEnhancementService}
          onRewriteComplete={handleRewriteComplete}
        />
      )}
    </div>
  );
};
