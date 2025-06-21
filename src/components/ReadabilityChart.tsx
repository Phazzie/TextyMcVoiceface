import React, { useRef, useState, useEffect } from 'react';
import { ReadabilityPoint } from '../types/contracts';

interface ReadabilityChartProps {
  data: ReadabilityPoint[];
  width?: number;
  height?: number;
}

export const ReadabilityChart: React.FC<ReadabilityChartProps> = ({
  data,
  width = 600,
  height = 300,
}) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length === 0) {
    return <div className="text-center p-4">No readability data available to display.</div>;
  }

  const padding = { top: 20, right: 30, bottom: 50, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxScore = Math.max(0, ...data.map(d => d.score), 100); // Ensure Y axis goes at least to 100 or max score
  const minScore = Math.min(100, ...data.map(d => d.score), 0); // Ensure Y axis starts at least at 0 or min score

  const xScale = (index: number) => (index / (data.length - 1 || 1)) * chartWidth;
  const yScale = (score: number) => chartHeight - ((score - minScore) / (maxScore - minScore)) * chartHeight;

  const linePath = data
    .map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.score);
      return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
    })
    .join(' ');

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - svgRect.left - padding.left;
    // const y = event.clientY - svgRect.top - padding.top;

    const index = Math.round((x / chartWidth) * (data.length - 1));

    if (index >= 0 && index < data.length) {
      const point = data[index];
      setTooltip({
        visible: true,
        x: xScale(index) + padding.left,
        y: yScale(point.score) + padding.top - 10, // Position tooltip above the point
        content: `Paragraph ${point.paragraphIndex + 1}: ${point.score.toFixed(1)}`,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  // Y-axis labels (e.g., 0, 20, 40, 60, 80, 100)
  const yAxisLabels = [];
  const numTicks = 5; // Adjust for more or fewer labels
  for (let i = 0; i <= numTicks; i++) {
    const scoreValue = minScore + (i / numTicks) * (maxScore - minScore);
    yAxisLabels.push({
      value: scoreValue.toFixed(0),
      y: yScale(scoreValue),
    });
  }

  return (
    <div className="relative bg-gray-50 p-4 rounded-lg shadow">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="overflow-visible"
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* X-axis */}
          <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#cbd5e1" />
          <text x={chartWidth / 2} y={chartHeight + padding.bottom / 1.5 } textAnchor="middle" fontSize="12" fill="#64748b">
            Paragraph Index
          </text>
            {data.length > 1 && data.map((_, index) => {
             if (data.length > 10 && index % Math.floor(data.length / 10) !== 0 && index !== data.length -1 && index !== 0) return null; // Show limited ticks for many paragraphs
             return (
                <text
                    key={`x-label-${index}`}
                    x={xScale(index)}
                    y={chartHeight + 15}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                >
                    {index + 1}
                </text>
             );
            })}


          {/* Y-axis */}
          <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="#cbd5e1" />
           <text x={-padding.left / 1.5} y={chartHeight / 2} textAnchor="middle" fontSize="12" fill="#64748b" transform={`rotate(-90, ${-padding.left / 1.5}, ${chartHeight/2})`}>
            Readability Score (F-K)
          </text>
          {yAxisLabels.map(label => (
            <g key={`y-label-${label.value}`}>
              <text x={-10} y={label.y} textAnchor="end" alignmentBaseline="middle" fontSize="10" fill="#64748b">
                {label.value}
              </text>
              <line x1={-5} y1={label.y} x2={chartWidth} y2={label.y} stroke="#e2e8f0" strokeDasharray="2,2" />
            </g>
          ))}

          {/* Line path */}
          <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" />

          {/* Data points (circles) */}
          {data.map((point, index) => (
            <circle
              key={`dot-${index}`}
              cx={xScale(index)}
              cy={yScale(point.score)}
              r="4"
              fill="#3b82f6"
              className="cursor-pointer"
            />
          ))}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translateX(-50%) translateY(-100%)', // Center tooltip above point
            pointerEvents: 'none',
          }}
          className="bg-gray-800 text-white text-xs rounded-md px-2 py-1 shadow-lg whitespace-nowrap"
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};
