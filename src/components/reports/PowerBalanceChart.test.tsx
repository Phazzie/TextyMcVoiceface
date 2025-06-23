import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PowerBalanceChart } from './PowerBalanceChart';
import { DialogueTurn } from '../../types/contracts';

const mockDialogueTurns: DialogueTurn[] = [
  {
    characterName: 'Alice',
    powerScore: 2,
    metrics: { isQuestion: false, interruptions: 0, wordCount: 15, hedgeToIntensifierRatio: 0.6, topicChanged: false },
  },
  {
    characterName: 'Bob',
    powerScore: -1,
    metrics: { isQuestion: true, interruptions: 1, wordCount: 8, hedgeToIntensifierRatio: 0.2, topicChanged: true },
    detectedTactic: 'weaponizedPoliteness',
  },
  {
    characterName: 'Alice',
    powerScore: 3,
    metrics: { isQuestion: false, interruptions: 0, wordCount: 25, hedgeToIntensifierRatio: 0.8, topicChanged: false },
    detectedTactic: 'exchangeTermination',
  },
];

describe('PowerBalanceChart', () => {
  it('renders correctly with valid data', () => {
    render(<PowerBalanceChart data={mockDialogueTurns} />);
    expect(screen.getByText('Dialogue Power Dynamics')).toBeInTheDocument();
    expect(screen.getByTestId('power-balance-svg')).toBeInTheDocument();
    expect(screen.getByTestId('power-balance-line')).toBeInTheDocument();
    expect(screen.getAllByTestId(/chart-point-/)).toHaveLength(mockDialogueTurns.length);
  });

  it('renders "no data" message when data is null', () => {
    render(<PowerBalanceChart data={null as any} />); // Cast to any to test null
    expect(screen.getByText('No dialogue data to display power balance.')).toBeInTheDocument();
  });

  it('renders "no data" message when data is an empty array', () => {
    render(<PowerBalanceChart data={[]} />);
    expect(screen.getByText('No dialogue data to display power balance.')).toBeInTheDocument();
  });

  it('displays character names or turn numbers as X-axis labels', () => {
    render(<PowerBalanceChart data={mockDialogueTurns} />);
    expect(screen.getByText(/Alice.*\(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Bob.*\(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Alice.*\(3\)/)).toBeInTheDocument();
  });

  it('displays Y-axis labels for power scores', () => {
    render(<PowerBalanceChart data={mockDialogueTurns} />);
    expect(screen.getByText('-5')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows tooltip on mouse enter and hides on mouse leave (simplified check)', () => {
    render(<PowerBalanceChart data={mockDialogueTurns} />);
    const dataPoints = screen.getAllByTestId(/chart-point-/);

    expect(screen.queryByText(`Power Score: ${mockDialogueTurns[0].powerScore}`)).not.toBeInTheDocument();

    // Simulate mouse enter on the first data point
    fireEvent.mouseEnter(dataPoints[0]);
    expect(screen.getByText(mockDialogueTurns[0].characterName)).toBeInTheDocument();
    expect(screen.getByText(`Power Score: ${mockDialogueTurns[0].powerScore}`)).toBeInTheDocument();
    expect(screen.getByText(`Word Count: ${mockDialogueTurns[0].metrics.wordCount}`)).toBeInTheDocument();

    // Simulate mouse leave
    fireEvent.mouseLeave(dataPoints[0]);
    expect(screen.queryByText(`Power Score: ${mockDialogueTurns[0].powerScore}`)).not.toBeInTheDocument();
  });

  it('displays detected tactic in tooltip if present', () => {
    render(<PowerBalanceChart data={mockDialogueTurns} />);
    const dataPoints = screen.getAllByTestId(/chart-point-/);

    // Bob's turn (index 1) has a detectedTactic
    fireEvent.mouseEnter(dataPoints[1]);
    expect(screen.getByText('Tactic:')).toBeInTheDocument();
    expect(screen.getByText('Weaponized Politeness')).toBeInTheDocument(); // Formatted text
    fireEvent.mouseLeave(dataPoints[1]);

    // Alice's first turn (index 0) does not have a tactic
    fireEvent.mouseEnter(dataPoints[0]);
    expect(screen.queryByText('Tactic:')).not.toBeInTheDocument();
    fireEvent.mouseLeave(dataPoints[0]);
  });
});
