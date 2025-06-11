import React, { useState, useRef } from 'react';
import { Upload, FileText, Mic, Play } from 'lucide-react';

interface StoryInputProps {
  onTextSubmit: (text: string) => void;
  isProcessing: boolean;
}

export const StoryInput: React.FC<StoryInputProps> = ({ onTextSubmit, isProcessing }) => {
  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your story here... Include dialogue in quotes and narrative text to see the magic happen!"
            className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none font-mono text-sm leading-relaxed"
            disabled={isProcessing}
          />
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={handleSampleLoad}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                disabled={isProcessing}
              >
                <Play className="w-4 h-4 inline mr-1" />
                Load Sample Story
              </button>
              <span className="text-sm text-gray-500 py-2">
                {inputText.length} characters
              </span>
            </div>
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
    </div>
  );
};