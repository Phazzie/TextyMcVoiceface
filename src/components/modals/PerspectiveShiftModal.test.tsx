import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PerspectiveShiftModal } from './PerspectiveShiftModal';
import { SeamManager } from '../../services/SeamManager';
import { IAIEnhancementService, Character } from '../../types/contracts'; // Removed ContractResult

// Mock AIEnhancementService
const mockRewriteFromNewPerspective = jest.fn();
const mockAIEnhancementService: IAIEnhancementService = {
  rewriteFromNewPerspective: mockRewriteFromNewPerspective,
  analyzeLiteraryDevices: jest.fn(), // Required by interface
  invertTrope: jest.fn(),          // Required by interface
};

// Mock SeamManager
jest.mock('../../services/SeamManager', () => ({
  SeamManager: {
    get: jest.fn(),
    isRegistered: jest.fn(() => true), // Assume service is always registered for these tests
    getInstance: jest.fn().mockReturnThis(), // for chained calls like SeamManager.getInstance().get...
    // Add other specific getters if needed by other components, though not directly by this modal
  },
}));

const mockStoryCharacters: Character[] = [
  { name: 'Alice', frequency: 10, characteristics: [], emotionalStates: [], isMainCharacter: true, firstAppearance: 1 },
  { name: 'Bob', frequency: 8, characteristics: [], emotionalStates: [], isMainCharacter: false, firstAppearance: 2 },
  { name: 'Charlie', frequency: 12, characteristics: [], emotionalStates: [], isMainCharacter: false, firstAppearance: 3 },
];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  originalText: "This is Alice's original thought.",
  originalCharacterName: "Alice",
  storyCharacters: mockStoryCharacters,
};

describe('PerspectiveShiftModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup SeamManager.get to return our mock service for AIEnhancementService
    (SeamManager.get as jest.Mock).mockImplementation((serviceName: string) => {
      if (serviceName === 'AIEnhancementService') {
        return mockAIEnhancementService;
      }
      return null;
    });
    mockRewriteFromNewPerspective.mockResolvedValue({ success: true, data: "This is Bob's new perspective." });
  });

  it('renders correctly when open', () => {
    render(<PerspectiveShiftModal {...defaultProps} />);
    expect(screen.getByText('Shift Perspective')).toBeInTheDocument();
    expect(screen.getByText(/Original Text \(from Alice's perspective\):/)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.originalText)).toBeInTheDocument();
    expect(screen.getByLabelText('Rewrite from the perspective of:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rewrite' })).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<PerspectiveShiftModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Shift Perspective')).not.toBeInTheDocument();
  });

  it('populates character dropdown correctly, excluding original character', () => {
    render(<PerspectiveShiftModal {...defaultProps} />);
    const select = screen.getByLabelText('Rewrite from the perspective of:') as HTMLSelectElement;
    expect(select.options.length).toBe(mockStoryCharacters.length - 1); // Alice is excluded
    expect(select.options[0].value).toBe('Bob');
    expect(select.options[1].value).toBe('Charlie');
    expect(Array.from(select.options).find(opt => opt.value === 'Alice')).toBeUndefined();
  });

  it('handles empty storyCharacters list for dropdown', () => {
    render(<PerspectiveShiftModal {...defaultProps} storyCharacters={[]} originalCharacterName="" />);
    const select = screen.getByLabelText('Rewrite from the perspective of:') as HTMLSelectElement;
    expect(select.options.length).toBe(1);
    expect(select.options[0].value).toBe('');
    expect(select.options[0].text).toBe('No other characters available');
    expect(screen.getByRole('button', { name: 'Rewrite' })).toBeDisabled();
  });


  it('calls rewrite service on button click and displays result', async () => {
    render(<PerspectiveShiftModal {...defaultProps} />);
    const rewriteButton = screen.getByRole('button', { name: 'Rewrite' });
    const select = screen.getByLabelText('Rewrite from the perspective of:') as HTMLSelectElement;

    // Select Bob
    fireEvent.change(select, { target: { value: 'Bob' } });
    expect(select.value).toBe('Bob');

    fireEvent.click(rewriteButton);

    expect(mockRewriteFromNewPerspective).toHaveBeenCalledWith(
      defaultProps.originalText,
      'Bob', // Selected new character
      defaultProps.originalCharacterName
    );

    // Check for loading state (optional, if implemented visually)
    expect(screen.getByRole('button', { name: 'Rewrite' })).toBeDisabled(); // Assuming it disables during load
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument(); // Assuming a loader with testid

    await waitFor(() => {
      expect(screen.getByText("This is Bob's new perspective.")).toBeInTheDocument();
    });
    expect(screen.getByText(/Rewritten Text \(from Bob's perspective\):/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rewrite' })).not.toBeDisabled(); // Re-enabled
  });

  it('displays error message if service call fails', async () => {
    mockRewriteFromNewPerspective.mockResolvedValueOnce({ success: false, error: 'AI failed miserably' });
    render(<PerspectiveShiftModal {...defaultProps} />);
    const rewriteButton = screen.getByRole('button', { name: 'Rewrite' });
    fireEvent.click(rewriteButton);

    await waitFor(() => {
      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('AI failed miserably')).toBeInTheDocument();
    });
  });

  // it('displays error if AppConfigService is not available (no API key for real calls)', async () => {
  //   // Simulate AppConfigService not being available or not returning a key
  //   (SeamManager.get as jest.Mock).mockImplementation((serviceName: string) => {
  //     if (serviceName === 'AIEnhancementService') {
  //       // Temporarily make appConfigService null within AIEnhancementService for this test
  //       // const serviceInstance = new AIEnhancementService(); // This line will cause a TS error if AIEnhancementService is not imported/defined
  //       // Assuming AIEnhancementService is a class constructor. If not, this mock needs adjustment.
  //       // For the 'any' fix, assuming serviceInstance is some object:
  //       // (serviceInstance as { appConfigService?: unknown }).appConfigService = null; // Force appConfigService to be null
  //       // return serviceInstance;
  //       // Returning the existing mock as this test is problematic
  //       return mockAIEnhancementService;
  //     }
  //     return null;
  //   });
  //    // And ensure MOCK_API_CALL is false in the service for this path to be hit (this is tricky to test without changing service code)
  //    // For now, this test relies on the console.warn and the mock path still being taken by default in AIEnhancementService
  //    // A better way would be to mock AppConfigService to return no key.

  //   render(<PerspectiveShiftModal {...defaultProps} />);
  //   // If the service's MOCK_API_CALL is true (which it is by default), this test won't show an API key error.
  //   // This test is more conceptual for when MOCK_API_CALL would be false.
  //   // The current AIEnhancementService constructor handles missing AppConfigService with a warning.
  //   // The rewrite function itself has a MOCK_API_CALL = true flag.
  //   // To truly test this, AIEnhancementService would need MOCK_API_CALL to be configurable or AppConfigService mock to return error.

  //   // Let's assume the button click would lead to an error path if API key is needed and missing.
  //   // The current mock in AIEnhancementService will still succeed.
  //   // This test case needs refinement if we want to test the "API key not configured" path accurately.
  //   console.log("Skipping specific 'API key not configured' UI error test due to service's internal MOCK_API_CALL flag / test setup issues.");
  // });


  it('calls onClose when close button is clicked', () => {
    render(<PerspectiveShiftModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
