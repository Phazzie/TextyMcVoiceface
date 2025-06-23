import React from 'react';
import { DialogueTurn } from '../../types/contracts';

interface PowerBalanceChartProps {
  data: DialogueTurn[];
}

export const PowerBalanceChart: React.FC<PowerBalanceChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center p-4 text-gray-500">No dialogue data to display power balance.</div>;
  }

  const chartHeight = 300;
  const chartWidth = 600;
  const padding = 50; // Padding around the chart
  const yAxisLabelOffset = 35;
  const xAxisLabelOffset = 35;

  // Power scores range from -5 to +5. We'll map this to the chart's y-axis.
  const minYValue = -5;
  const maxYValue = 5;
  const yRange = maxYValue - minYValue; // 10

  // Calculate x and y coordinates for each point
  const points = data.map((turn, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - ((turn.powerScore - minYValue) / yRange) * (chartHeight - 2 * padding);
    return { x, y, turn };
  });

  const linePath = points.map(p => `${p.x},${p.y}`).join(' L ');

  // Y-axis lines and labels
  const yAxisLines = [];
  for (let i = 0; i <= yRange; i++) {
    const value = minYValue + i;
    const y = chartHeight - padding - (i / yRange) * (chartHeight - 2 * padding);
    yAxisLines.push(
      <g key={`y-tick-${value}`}>
        <line
          x1={padding - 5}
          y1={y}
          x2={chartWidth - padding}
          y2={y}
          stroke={value === 0 ? '#9ca3af' : '#e5e7eb'} // gray-400 or gray-200
          strokeDasharray={value === 0 ? "0" : "2,2"}
        />
        <text x={padding - yAxisLabelOffset} y={y + 4} fontSize="10" fill="#6b7281" textAnchor="middle">
          {value}
        </text>
      </g>
    );
  }

  // Tooltip state
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; turn: DialogueTurn } | null>(null);

  return (
    <div className="relative p-4 bg-white rounded-lg shadow" data-testid="power-balance-chart-container">
      <h5 className="text-lg font-semibold text-gray-700 mb-4">Dialogue Power Dynamics</h5>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" data-testid="power-balance-svg">
        {/* Y-axis Title */}
        <text
            transform={`translate(${padding - yAxisLabelOffset - 5}, ${chartHeight / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize="12"
            fill="#374151"
            fontWeight="medium"
        >
            Power Score
        </text>

        {/* X-axis Title */}
         <text
            x={chartWidth / 2}
            y={chartHeight - padding + xAxisLabelOffset + 10}
            textAnchor="middle"
            fontSize="12"
            fill="#374151"
            fontWeight="medium"
        >
            Dialogue Turn
        </text>

        {/* Y-Axis Lines and Labels */}
        {yAxisLines}

        {/* X-Axis Line (at y=0, which is powerScore=0 line) */}
        <line
            x1={padding} y1={chartHeight - padding - ((-minYValue)/yRange) * (chartHeight - 2 * padding)}
            x2={chartWidth - padding} y2={chartHeight - padding - ((-minYValue)/yRange) * (chartHeight - 2 * padding)}
            stroke="#9ca3af"
        />


        {/* Data Line */}
        {points.length > 1 && (
            <path d={`M ${linePath}`} stroke="#3b82f6" strokeWidth="2" fill="none" data-testid="power-balance-line" />
        )}

        {/* Data Points & Tooltip Triggers */}
        {points.map((p, index) => (
          <React.Fragment key={`point-group-${index}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#3b82f6"
              className="cursor-pointer"
              onMouseEnter={() => setTooltip({ x: p.x, y: p.y, turn: p.turn })}
              onMouseLeave={() => setTooltip(null)}
              data-testid={`chart-point-${index}`}
            />
            {/* X-axis labels (character names or turn numbers) */}
            <text x={p.x} y={chartHeight - padding + 20} fontSize="9" fill="#6b7281" textAnchor="middle" data-testid={`x-label-${index}`}>
              {p.turn.characterName.substring(0,10)}{data.length > 10 && index % 2 !== 0 ? "" : ` (${index+1})`}
            </text>
          </React.Fragment>
        ))}
      </svg>

      {/* Tooltip Display */}
      {tooltip && (
        <div
          className="absolute bg-gray-800 text-white p-3 rounded-lg shadow-xl text-xs"
          style={{
            left: `${tooltip.x + 5}px`, // Position tooltip relative to SVG viewport for consistency
            top: `${tooltip.y - 70}px`,  // Adjust to avoid overlap
            pointerEvents: 'none', // Allow mouse events to pass through to elements below
            minWidth: '200px',
          }}
        >
          <p className="font-bold">{tooltip.turn.characterName}</p>
          <p>Power Score: <span className="font-semibold">{tooltip.turn.powerScore}</span></p>
          <hr className="my-1 border-gray-600"/>
          <p>Question: {tooltip.turn.metrics.isQuestion ? 'Yes' : 'No'}</p>
          <p>Word Count: {tooltip.turn.metrics.wordCount}</p>
          <p>Interruptions: {tooltip.turn.metrics.interruptions}</p>
          <p>Hedge/Intensifier Ratio: {tooltip.turn.metrics.hedgeToIntensifierRatio.toFixed(2)}</p>
          <p>Topic Changed: {tooltip.turn.metrics.topicChanged ? 'Yes' : 'No'}</p>
          {tooltip.turn.detectedTactic && (
            <p className="mt-1 pt-1 border-t border-gray-600">
              Tactic: <span className="font-semibold">{tooltip.turn.detectedTactic.replace(/([A-Z])/g, ' $1').trim()}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
