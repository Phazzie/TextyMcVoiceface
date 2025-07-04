import React, { useState, useRef, useEffect } from 'react'; // Removed useCallback
import { Upload, FileText, Mic, Play, Wand2 } from 'lucide-react'; // Added Wand2
import { PerspectiveShiftModal } from './modals/PerspectiveShiftModal'; // Added import
import { Character } from '../types/contracts'; // Added import

interface StoryInputProps {
  onTextSubmit: (text: string) => void;
  isProcessing: boolean;
  initialText?: string;
  storyCharacters?: Character[]; // Added prop for character list
}

export const StoryInput: React.FC<StoryInputProps> = ({
  onTextSubmit,
  isProcessing,
  initialText = '',
  storyCharacters = [] // Default to empty array
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for textarea

  // State for Perspective Shift
  const [isPerspectiveModalOpen, setIsPerspectiveModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  // const [selectionRange, setSelectionRange] = useState<{ start: number, end: number } | null>(null); // Unused state
  // For now, assume the original character is the one most frequent in the selected text or a default.
  // A more robust solution would involve speaker detection for the selected segment.
  const [originalCharacterForShift, setOriginalCharacterForShift] = useState<string>("Narrator");

  // Helper function to escape regex special characters
  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  useEffect(() => {
    setInputText(initialText);
  }, [initialText]);

  const handleTextSelection = () => {
    if (textareaRef.current) {
      const { selectionStart, selectionEnd, value } = textareaRef.current;
      if (selectionStart !== selectionEnd) {
        const currentSelectedText = value.substring(selectionStart, selectionEnd);
        setSelectedText(currentSelectedText);
        // setSelectionRange({ start: selectionStart, end: selectionEnd }); // Unused state

        // Refined original character detection
        let foundCharacterName = "Narrator"; // Default
        if (storyCharacters.length > 0) {
          const contextBeforeSelection = value.substring(Math.max(0, selectionStart - 100), selectionStart); // Look 100 chars before
          const contextAroundSelection = value.substring(Math.max(0, selectionStart - 50), Math.min(value.length, selectionEnd + 50)); // Look 50 chars around

          // Try to find attribution like "Character said," or ", said Character"
          // This is a simplified heuristic and can be expanded.
          for (const char of storyCharacters) {
            if (char.name === "Narrator") continue; // Skip narrator as an explicit speaker here

            const namePattern = new RegExp(`\\b${escapeRegExp(char.name)}\\b`, 'i');

            // Pattern 1: "Quote," Character said. (Looking in text *after* selection if selection is quote)
            if (currentSelectedText.startsWith('"') && currentSelectedText.endsWith('"')) {
                const textAfterSelection = value.substring(selectionEnd, Math.min(value.length, selectionEnd + 50)).toLowerCase();
                if (textAfterSelection.match(new RegExp(`^\\s*,?\\s*said\\s+${escapeRegExp(char.name.toLowerCase())}\\b`)) ||
                    textAfterSelection.match(new RegExp(`^\\s*${escapeRegExp(char.name.toLowerCase())}\\s+said\\b`))) {
                    foundCharacterName = char.name;
                    break;
                }
            }

            // Pattern 2: Character said, "Quote" (Looking in text *before* selection)
            const textBeforePattern = new RegExp(`\\b${escapeRegExp(char.name)}\\b\\s+(said|asked|replied|muttered|shouted|whispered),?\\s*"${escapeRegExp(currentSelectedText.substring(0,10))}`, 'i');
            if (contextBeforeSelection.match(textBeforePattern)) {
                foundCharacterName = char.name;
                break;
            }

            // Pattern 3: General mention of character name within or immediately around the selection
            if (namePattern.test(contextAroundSelection)) {
                // This is a weaker heuristic, might be overridden by stronger ones above.
                // Could be refined to check proximity to dialogue.
                foundCharacterName = char.name;
                // Don't break here, let stronger heuristics override if found
            }
          }
        }
        // If no specific character was found by heuristics, and there are characters, default to first non-narrator or narrator
        if (foundCharacterName === "Narrator" && storyCharacters.length > 0) {
            const firstNonNarrator = storyCharacters.find(c => c.name !== "Narrator");
            foundCharacterName = firstNonNarrator ? firstNonNarrator.name : storyCharacters[0]?.name || "Narrator";
        }

        setOriginalCharacterForShift(foundCharacterName);

      } else {
        setSelectedText('');
        // setSelectionRange(null); // Unused state
        setOriginalCharacterForShift("Narrator"); // Reset when no selection
      }
    }
  };

  const openPerspectiveShiftModal = () => {
    if (selectedText) {
      // Potentially add logic here to determine the originalCharacterName from the selectedText or context
      // For now, using a placeholder or the globally assumed original character.
      // A more sophisticated approach might involve parsing the selected text or allowing user to specify.
      if (storyCharacters.length > 0 && !storyCharacters.find(c => c.name === originalCharacterForShift)) {
        setOriginalCharacterForShift(storyCharacters[0]?.name || "Narrator");
      }
      setIsPerspectiveModalOpen(true);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    handleTextSelection(); // Update selection on text change as well
  };

  // Callback to update text if Perspective Shift is successful (optional)
  // const onRewriteSuccess = (rewrittenText: string) => {
  //   if (selectionRange && textareaRef.current) {
  //     const currentText = textareaRef.current.value;
  //     const newText =
  //       currentText.substring(0, selectionRange.start) +
  //       rewrittenText +
  //       currentText.substring(selectionRange.end);
  //     setInputText(newText);
  //     // Clear selection
  //     setSelectedText('');
  //     setSelectionRange(null);
  //     textareaRef.current.setSelectionRange(selectionRange.start + rewrittenText.length, selectionRange.start + rewrittenText.length);
  //   }
  // };

  const handleSubmit = () => {
    if (inputText.trim() && !isProcessing) {
      onTextSubmit(inputText.trim());
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInputText(content);
      };
      reader.readAsText(file);
    }
  };

  const handleSampleLoad = () => {
    const sampleStory = `Sarah looked out the window, watching the rain streak down the glass. "Is he coming?" she wondered, her heart racing with anticipation.

The storm had been building all afternoon, and John had promised to be there by five. She glanced at the clock—it was nearly six.

"I'll be there," he had said with that confident smile of his. "Nothing will keep me away."

But that was yesterday, and now she wasn't so sure. The phone rang, startling her from her thoughts.

"Hello?" she answered, trying to keep the worry from her voice.

"Sarah, it's me," John's voice came through the receiver, slightly breathless. "I'm sorry I'm late, but I'm on my way. The roads are terrible, but I'll be there soon."

She felt a wave of relief wash over her. "Be careful," she said softly. "I'll be waiting."`;
    
    setInputText(sampleStory);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Story Input</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setInputMode('text')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              inputMode === 'text'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Text
          </button>
          <button
            onClick={() => setInputMode('file')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              inputMode === 'file'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            File
          </button>
        </div>
      </div>

      {inputMode === 'text' ? (
        <div className="space-y-4">
          <textarea
            ref={textareaRef} // Added ref
            value={inputText} // Ensure value is set
            onChange={handleTextChange} // Updated handler
            onSelect={handleTextSelection} // Added onSelect
            onMouseUp={handleTextSelection} // Added onMouseUp for better selection detection
            onKeyUp={handleTextSelection} // Added onKeyUp for selection changes via keyboard
            placeholder="Paste your story here... Select text to try shifting perspective!"
            className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none font-mono text-sm leading-relaxed"
            disabled={isProcessing}
          />
          <div className="flex justify-between items-center mt-2"> {/* Added mt-2 for spacing */}
            <div className="flex space-x-2 items-center"> {/* Ensure items are vertically centered */}
              <button
                onClick={handleSampleLoad}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                disabled={isProcessing}
              >
                <Play className="w-4 h-4 inline mr-1" />
                Load Sample Story
              </button>
              {selectedText && (
                <button
                  onClick={openPerspectiveShiftModal}
                  className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 flex items-center"
                  disabled={isProcessing || storyCharacters.length === 0}
                  title={storyCharacters.length === 0 ? "No characters available to shift perspective" : "Shift perspective of selected text"}
                >
                  <Wand2 className="w-4 h-4 mr-1" />
                  Shift Perspective
                </button>
              )}
            </div>
            <span className="text-sm text-gray-500 py-2">
              {inputText.length} characters {selectedText ? `(${selectedText.length} selected)` : ''}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-all duration-200 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Click to upload a text file</p>
            <p className="text-sm text-gray-500">Supports .txt files up to 10MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isProcessing}
          />
          {inputText && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">File loaded successfully:</p>
              <p className="text-sm font-medium text-gray-800">{inputText.length} characters</p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={!inputText.trim() || isProcessing}
          className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
            !inputText.trim() || isProcessing
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 inline mr-2" />
              Generate Audiobook
            </>
          )}
        </button>
      </div>

      <PerspectiveShiftModal
        isOpen={isPerspectiveModalOpen}
        onClose={() => setIsPerspectiveModalOpen(false)}
        originalText={selectedText}
        originalCharacterName={originalCharacterForShift} // This needs to be determined more accurately
        storyCharacters={storyCharacters}
        // onRewriteSuccess={onRewriteSuccess} // Optional: handle text update
      />
    </div>
  );
};