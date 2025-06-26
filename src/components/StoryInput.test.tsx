import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StoryInput } from './StoryInput';
import { PerspectiveShiftModal } from './modals/PerspectiveShiftModal';
import { Character } from '../types/contracts';
import { SeamManager } from '../services/SeamManager'; // For mocking PerspectiveShiftModal's dependencies
import { IAIEnhancementService } from '../types/contracts'; // For mocking PerspectiveShiftModal's dependencies

// Mock PerspectiveShiftModal to check its props and visibility
jest.mock('./modals/PerspectiveShiftModal', () => ({
  PerspectiveShiftModal: jest.fn(({ isOpen, onClose, originalText, originalCharacterName, storyCharacters }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-perspective-shift-modal">
        <p>Original Text: {originalText}</p>
        <p>Original Character: {originalCharacterName}</p>
        <p>Characters Available: {storyCharacters.map(c => c.name).join(', ')}</p>
        <button onClick={onClose}>Close Mock Modal</button>
      </div>
    );
  }),
}));

// Mock AIEnhancementService (dependency of the actual PerspectiveShiftModal, good to have if modal wasn't fully mocked)
const mockAIEnhancementService: Partial<IAIEnhancementService> = {
  rewriteFromNewPerspective: jest.fn().mockResolvedValue({ success: true, data: "Mocked rewrite" }),
};

jest.mock('../services/SeamManager', () => ({
  SeamManager: {
    get: jest.fn(),
    isRegistered: jest.fn(() => true),
    getInstance: jest.fn().mockReturnThis(),
    // Add specific getters for services if StoryInput or its children used them directly
  },
}));


const mockStoryCharacters: Character[] = [
  { name: 'Alice', frequency: 1, characteristics: [], emotionalStates: [], isMainCharacter: true, firstAppearance: 0 },
  { name: 'Bob', frequency: 1, characteristics: [], emotionalStates: [], isMainCharacter: false, firstAppearance: 0 },
  { name: 'Charlie', frequency: 1, characteristics: [], emotionalStates: [], isMainCharacter: false, firstAppearance: 0 },
  { name: 'Narrator', frequency: 1, characteristics: [], emotionalStates: [], isMainCharacter: false, firstAppearance: 0 },
];

const defaultProps = {
  onTextSubmit: jest.fn(),
  isProcessing: false,
  initialText: '',
  storyCharacters: mockStoryCharacters,
};

// Helper to simulate text selection
const simulateTextSelection = (textarea: HTMLElement, start: number, end: number) => {
  (textarea as HTMLTextAreaElement).setSelectionRange(start, end);
  fireEvent.select(textarea); // For React Testing Library to pick up selection
  // fireEvent.mouseUp(textarea); // Sometimes needed to ensure onSelect/onMouseUp handlers trigger
};


describe('StoryInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PerspectiveShiftModal as jest.Mock).mockClear();
     // Setup SeamManager.get for PerspectiveShiftModal's internal use, even if modal is mocked
    (SeamManager.get as jest.Mock).mockImplementation((serviceName: string) => {
      if (serviceName === 'AIEnhancementService') {
        return mockAIEnhancementService as IAIEnhancementService;
      }
      return null; // Should not be called for other services by this test setup
    });
  });

  it('renders textarea and submit button', () => {
    render(<StoryInput {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Paste your story here/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Audiobook/i })).toBeInTheDocument();
  });

  it('does not show "Shift Perspective" button initially', () => {
    render(<StoryInput {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /Shift Perspective/i })).not.toBeInTheDocument();
  });

  it('shows "Shift Perspective" button when text is selected', () => {
    render(<StoryInput {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Paste your story here/);
    fireEvent.change(textarea, { target: { value: 'Hello world, this is a test.' } });
    simulateTextSelection(textarea, 0, 5); // Select "Hello"

    expect(screen.getByRole('button', { name: /Shift Perspective/i })).toBeInTheDocument();
  });

  describe('Original Character Detection Heuristic', () => {
    test('Scenario 1: Attribution Before (Character said, "Quote")', () => {
      const text = 'Alice said, "This is the selected part." The rest of the story.';
      render(<StoryInput {...defaultProps} initialText={text} />);
      const textarea = screen.getByDisplayValue(text);

      simulateTextSelection(textarea, text.indexOf('"This is the selected part."'), text.indexOf('"This is the selected part."') + '"This is the selected part."'.length);
      fireEvent.click(screen.getByRole('button', { name: /Shift Perspective/i }));

      expect(PerspectiveShiftModal).toHaveBeenCalledWith(expect.objectContaining({
        originalCharacterName: 'Alice'
      }), {});
    });

    test('Scenario 2: Attribution After ("Quote," said Character)', () => {
      const text = '"This is the selected part," said Bob. More story follows.';
      render(<StoryInput {...defaultProps} initialText={text} />);
      const textarea = screen.getByDisplayValue(text);
      // Select just the text within quotes for this pattern to be accurately tested
      const dialogueContent = "This is the selected part";
      const quoteStartIndex = text.indexOf(`"${dialogueContent}"`);
      const selectionStart = quoteStartIndex + 1; // After opening quote
      const selectionEnd = selectionStart + dialogueContent.length; // Before closing quote

      // To test the heuristic accurately, we need to select text that would make currentSelectedText = `"${dialogueContent}"`
      // So, select from opening quote to closing quote.
      const fullQuoteSelectionStart = text.indexOf(`"${dialogueContent}"`);
      const fullQuoteSelectionEnd = fullQuoteSelectionStart + `"${dialogueContent}"`.length;

      simulateTextSelection(textarea, fullQuoteSelectionStart, fullQuoteSelectionEnd);
      fireEvent.click(screen.getByRole('button', { name: /Shift Perspective/i }));

      expect(PerspectiveShiftModal).toHaveBeenCalledWith(expect.objectContaining({
        originalCharacterName: 'Bob'
      }), {});
    });

    test('Scenario 3: Character Mentioned Near Selection (less specific)', () => {
      const text = 'The scene was tense. Charlie was thinking about the events. This is the selected part.';
      render(<StoryInput {...defaultProps} initialText={text} />);
      const textarea = screen.getByDisplayValue(text);

      simulateTextSelection(textarea, text.indexOf('This is the selected part.'), text.length);
      fireEvent.click(screen.getByRole('button', { name: /Shift Perspective/i }));

      // This heuristic is weaker, might pick Charlie or default. Current logic might pick Charlie.
      expect(PerspectiveShiftModal).toHaveBeenCalledWith(expect.objectContaining({
        originalCharacterName: 'Charlie'
      }), {});
    });

    test('Scenario 4: No Clear Attribution/Mention (defaults correctly)', () => {
      const text = 'Just some narration. This is the selected part. No names anywhere near.';
      render(<StoryInput {...defaultProps} initialText={text} />);
      const textarea = screen.getByDisplayValue(text);

      simulateTextSelection(textarea, text.indexOf('This is the selected part.'), text.length);
      fireEvent.click(screen.getByRole('button', { name: /Shift Perspective/i }));

      // Expects fallback to first non-Narrator or Narrator
      const expectedDefault = mockStoryCharacters.find(c=>c.name !== 'Narrator')?.name || mockStoryCharacters[0]?.name || 'Narrator';
      expect(PerspectiveShiftModal).toHaveBeenCalledWith(expect.objectContaining({
        originalCharacterName: expectedDefault
      }), {});
    });

    test('Scenario 5: Selection is only narration, defaults correctly', () => {
      const text = 'The sun set. A lone wolf howled. This is the selected part of narration.';
      render(<StoryInput {...defaultProps} initialText={text} />);
      const textarea = screen.getByDisplayValue(text);

      simulateTextSelection(textarea, text.indexOf('This is the selected part'), text.length);
      fireEvent.click(screen.getByRole('button', { name: /Shift Perspective/i }));

      const expectedDefault = mockStoryCharacters.find(c=>c.name !== 'Narrator')?.name || mockStoryCharacters[0]?.name || 'Narrator';
      expect(PerspectiveShiftModal).toHaveBeenCalledWith(expect.objectContaining({
        originalCharacterName: expectedDefault
      }), {});
    });
  });

  it('opens PerspectiveShiftModal with correct props on button click', () => {
    const initialText = 'Alice thought, "This is my selected text." Bob watched her.';
    render(<StoryInput {...defaultProps} initialText={initialText} />);
    const textarea = screen.getByDisplayValue(initialText);

    const selectionStart = initialText.indexOf('"This is my selected text."');
    const selectionEnd = selectionStart + '"This is my selected text."'.length;
    const selected = initialText.substring(selectionStart, selectionEnd);

    simulateTextSelection(textarea, selectionStart, selectionEnd);

    const shiftButton = screen.getByRole('button', { name: /Shift Perspective/i });
    fireEvent.click(shiftButton);

    expect(PerspectiveShiftModal).toHaveBeenCalledTimes(1);
    expect(PerspectiveShiftModal).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
        originalText: selected,
        // originalCharacterName will be determined by heuristic, let's check it's a string
        originalCharacterName: expect.any(String),
        storyCharacters: mockStoryCharacters,
      }),
      {}
    );
    // Check if the modal is visible (via our mock's data-testid)
    expect(screen.getByTestId('mock-perspective-shift-modal')).toBeInTheDocument();
  });

  it('closes PerspectiveShiftModal when its onClose is called', () => {
    const initialText = 'Select me!';
    render(<StoryInput {...defaultProps} initialText={initialText} />);
    const textarea = screen.getByDisplayValue(initialText);
    simulateTextSelection(textarea, 0, initialText.length);

    fireEvent.click(screen.getByRole('button', { name: /Shift Perspective/i }));
    expect(screen.getByTestId('mock-perspective-shift-modal')).toBeInTheDocument();

    // Simulate the modal's onClose call
    const closeButtonInMock = screen.getByRole('button', {name: 'Close Mock Modal'});
    fireEvent.click(closeButtonInMock);

    // Check if the PerspectiveShiftModal mock was called with isOpen: false or if it's no longer rendered
    // Since our mock renders null if !isOpen, we check it's not in document.
    expect(screen.queryByTestId('mock-perspective-shift-modal')).not.toBeInTheDocument();
  });
});
