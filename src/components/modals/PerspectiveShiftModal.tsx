import React, { useState, useEffect } from 'react';
import { X, Loader2, Wand2 } from 'lucide-react';
import { SeamManager } from '../../services/SeamManager';
import { IAIEnhancementService, Character } from '../../types/contracts'; // Assuming Character type is available

interface PerspectiveShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  originalCharacterName: string; // Name of the character whose perspective is being shifted FROM
  storyCharacters: Character[]; // Full list of characters in the story for the dropdown
  // Consider adding a callback for when rewrite is successful, e.g., onRewriteSuccess: (rewrittenText: string) => void;
}

export const PerspectiveShiftModal: React.FC<PerspectiveShiftModalProps> = ({
  isOpen,
  onClose,
  originalText,
  originalCharacterName,
  storyCharacters,
}) => {
  const [selectedNewCharacterName, setSelectedNewCharacterName] = useState<string>('');
  const [rewrittenText, setRewrittenText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const aiService = SeamManager.get<IAIEnhancementService>('AIEnhancementService');

  // Filter out the original character from the dropdown list
  const perspectiveOptions = storyCharacters.filter(char => char.name !== originalCharacterName);

  useEffect(() => {
    // Reset state when modal opens or original text changes
    if (isOpen) {
      setRewrittenText('');
      setError(null);
      // Set a default selected character if available and not the original character
      if (perspectiveOptions.length > 0) {
        setSelectedNewCharacterName(perspectiveOptions[0].name);
      } else {
        setSelectedNewCharacterName('');
      }
    }
  }, [isOpen, originalText, storyCharacters, originalCharacterName]);


  const handleRewrite = async () => {
    if (!selectedNewCharacterName || !originalText || !originalCharacterName) {
      setError('Original text, original character, and new character perspective must be selected.');
      return;
    }
    if (!aiService) {
        setError('AI Enhancement Service is not available.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setRewrittenText('');

    try {
      const result = await aiService.rewriteFromNewPerspective(originalText, selectedNewCharacterName, originalCharacterName);
      if (result.success && result.data) {
        setRewrittenText(result.data);
      } else {
        setError(result.error || 'Failed to rewrite text from new perspective.');
      }
    } catch (e) {
      console.error("Error calling rewriteFromNewPerspective:", e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Wand2 className="w-6 h-6 mr-2 text-purple-600" />
            Shift Perspective
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original Text (from {originalCharacterName}'s perspective):</label>
            <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto text-sm text-gray-700 border border-gray-200">
              {originalText}
            </div>
          </div>

          <div>
            <label htmlFor="character-select" className="block text-sm font-medium text-gray-700 mb-1">
              Rewrite from the perspective of:
            </label>
            <select
              id="character-select"
              value={selectedNewCharacterName}
              onChange={(e) => setSelectedNewCharacterName(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm disabled:bg-gray-100"
              disabled={isLoading || perspectiveOptions.length === 0}
            >
              {perspectiveOptions.length === 0 && <option value="">No other characters available</option>}
              {perspectiveOptions.map((character) => (
                <option key={character.name} value={character.name}>
                  {character.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRewrite}
              disabled={isLoading || !selectedNewCharacterName || perspectiveOptions.length === 0}
              className="flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5 mr-2" />
              )}
              Rewrite
            </button>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-md text-sm text-red-700 border border-red-200">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {rewrittenText && !isLoading && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rewritten Text (from {selectedNewCharacterName}'s perspective):
              </label>
              <div className="bg-purple-50 p-3 rounded-md max-h-48 overflow-y-auto text-sm text-gray-800 border border-purple-200">
                {rewrittenText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
