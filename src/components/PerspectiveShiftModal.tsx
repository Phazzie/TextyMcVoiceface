import React, { useState, useEffect } from 'react';
import { ContractResult, Character, IAIEnhancementService } from '../types/contracts'; // Assuming IAIEnhancementService might be needed here or passed differently
import { X, ChevronsUpDown, Check } from 'lucide-react';

interface PerspectiveShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  selectedText: string;
  originalCharacterName: string; // Name of the character whose perspective the text is currently from
  aiEnhancementService: IAIEnhancementService;
  onRewriteComplete: (rewrittenText: string, newCharacterName: string) => void; // Added newCharacterName
}

export const PerspectiveShiftModal: React.FC<PerspectiveShiftModalProps> = ({
  isOpen,
  onClose,
  characters,
  selectedText,
  originalCharacterName,
  aiEnhancementService,
  onRewriteComplete,
}) => {
  const [selectedNewCharacter, setSelectedNewCharacter] = useState<string>('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherCharacters = characters.filter(char => char.name !== originalCharacterName && char.name.toLowerCase() !== 'narrator'); // Filter out original and generic narrator if needed

  useEffect(() => {
    // Reset selected character if the modal is reopened or characters change
    if (isOpen && otherCharacters.length > 0) {
      // Pre-select the first available character if none is selected or current selection is invalid
      if (!selectedNewCharacter || !otherCharacters.find(c => c.name === selectedNewCharacter)) {
        setSelectedNewCharacter(otherCharacters[0].name);
      }
    } else if (isOpen && otherCharacters.length === 0) {
        setSelectedNewCharacter(''); // No other characters to select
    }
    if (!isOpen) {
      // Reset state when modal closes
      setError(null);
      setIsRewriting(false);
    }
  }, [isOpen, characters, originalCharacterName, otherCharacters, selectedNewCharacter]);

  const handleRewrite = async () => {
    if (!selectedNewCharacter || !selectedText) {
      setError('Please select a character and ensure text is selected.');
      return;
    }

    setIsRewriting(true);
    setError(null);

    try {
      const result: ContractResult<string> = await aiEnhancementService.rewriteFromNewPerspective(
        selectedText,
        selectedNewCharacter,
        originalCharacterName
      );

      if (result.success && result.data) {
        onRewriteComplete(result.data, selectedNewCharacter); // Pass selectedNewCharacter
        onClose(); // Close modal on success
      } else {
        setError(result.error || 'Failed to rewrite text.');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsRewriting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-8 bg-white w-full max-w-lg mx-auto rounded-xl shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <h3 className="text-xl font-semibold text-gray-800 mb-6">Shift Perspective</h3>

        <div className="mb-4">
          <label htmlFor="character-select" className="block text-sm font-medium text-gray-700 mb-1">
            Rewrite from perspective of:
          </label>
          {otherCharacters.length > 0 ? (
            <select
              id="character-select"
              value={selectedNewCharacter}
              onChange={(e) => setSelectedNewCharacter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              disabled={isRewriting}
            >
              {selectedNewCharacter === '' && <option value="" disabled>Select a character</option>}
              {otherCharacters.map((char) => (
                <option key={char.name} value={char.name}>
                  {char.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-500">No other characters available to shift perspective to.</p>
          )}
        </div>

        <div className="mb-6">
          <p className="block text-sm font-medium text-gray-700 mb-1">Original text (from {originalCharacterName || 'Unknown'}):</p>
          <div className="max-h-32 overflow-y-auto p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
            {selectedText || "No text selected."}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isRewriting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleRewrite}
            disabled={isRewriting || !selectedNewCharacter || otherCharacters.length === 0}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
              isRewriting || !selectedNewCharacter || otherCharacters.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isRewriting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline mr-2 align-[-0.125em]"></div>
                Rewriting...
              </>
            ) : (
              'Rewrite'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
