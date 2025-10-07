/**
 * Range Slider Component
 * Allows selecting a range between min and max values
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  showLabels?: boolean;
  width?: number;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  showLabels = true,
  width = 40,
}) => {
  const [activeHandle, setActiveHandle] = useState<'min' | 'max' | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Clamp value to valid range
  const clampedValue: [number, number] = [
    Math.max(min, Math.min(max, value[0])),
    Math.max(min, Math.min(max, value[1])),
  ].sort((a, b) => a - b) as [number, number];

  // Calculate handle positions
  const range = max - min;
  const minPosition = Math.round(((clampedValue[0] - min) / range) * (width - 2));
  const maxPosition = Math.round(((clampedValue[1] - min) / range) * (width - 2));

  // Generate slider bar representation
  const generateSliderBar = () => {
    const bar = Array(width).fill(' ');

    // Fill the selected range
    for (let i = minPosition; i <= maxPosition; i++) {
      if (i >= 0 && i < width) {
        bar[i] = '█';
      }
    }

    // Add handles
    if (minPosition >= 0 && minPosition < width) {
      bar[minPosition] = activeHandle === 'min' ? '▼' : '◄';
    }
    if (maxPosition >= 0 && maxPosition < width && maxPosition !== minPosition) {
      bar[maxPosition] = activeHandle === 'max' ? '▲' : '►';
    }

    return bar.join('');
  };

  // Handle keyboard input
  useInput((input, key) => {
    if (key.escape) {
      setActiveHandle(null);
      setIsDragging(false);
      return;
    }

    // If no handle is active, select one
    if (!activeHandle && !isDragging) {
      if (key.leftArrow || key.rightArrow) {
        setActiveHandle(key.leftArrow ? 'max' : 'min');
        setIsDragging(true);
      } else if (input === 'h' || input === 'l') {
        setActiveHandle(input === 'h' ? 'max' : 'min');
        setIsDragging(true);
      }
      return;
    }

    if (activeHandle && isDragging) {
      let newValue = [...clampedValue] as [number, number];
      const handleIndex = activeHandle === 'min' ? 0 : 1;

      switch (true) {
        case key.leftArrow:
        case input === 'h':
          newValue[handleIndex] = Math.max(min, newValue[handleIndex] - step);
          break;

        case key.rightArrow:
        case input === 'l':
          newValue[handleIndex] = Math.min(max, newValue[handleIndex] + step);
          break;

        case input === '\u0001': // Ctrl+A (home)
        case input === '^':
          newValue[handleIndex] = activeHandle === 'min' ? min : clampedValue[0];
          break;

        case input === '\u0005': // Ctrl+E (end)
        case input === '$':
          newValue[handleIndex] = activeHandle === 'max' ? max : clampedValue[1];
          break;

        case key.tab:
          // Switch between handles
          setActiveHandle(activeHandle === 'min' ? 'max' : 'min');
          return;

        case key.return:
          setActiveHandle(null);
          setIsDragging(false);
          return;

        default:
          // Handle number input for direct value setting
          if (input >= '0' && input <= '9') {
            const digit = parseInt(input);
            newValue[handleIndex] = Math.min(max, Math.max(min, digit));
          }
          break;
      }

      // Ensure min <= max
      if (newValue[0] > newValue[1]) {
        newValue = newValue.reverse() as [number, number];
        setActiveHandle(activeHandle === 'min' ? 'max' : 'min');
      }

      onChange(newValue);
    }

    // Allow initial handle selection
    if (!activeHandle && !isDragging) {
      if (input === '1' || input === '2') {
        setActiveHandle(input === '1' ? 'min' : 'max');
        setIsDragging(true);
      }
    }
  });

  // Auto-reset active handle when value changes externally
  useEffect(() => {
    if (!isDragging) {
      setActiveHandle(null);
    }
  }, [value, isDragging]);

  return (
    <Box flexDirection="column">
      {/* Value display */}
      {showLabels && (
        <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <Text color="cyan">
            Min: <Text bold>{clampedValue[0]}</Text>
          </Text>
          <Text color="cyan">
            Max: <Text bold>{clampedValue[1]}</Text>
          </Text>
        </Box>
      )}

      {/* Slider bar */}
      <Box flexDirection="row" marginBottom={1}>
        <Text color="gray">[</Text>
        <Text color={activeHandle ? 'yellow' : 'green'}>{generateSliderBar()}</Text>
        <Text color="gray">]</Text>
        {activeHandle && (
          <Text color="yellow" bold>
            {' '}
            {activeHandle === 'min' ? 'MIN' : 'MAX'}{' '}
          </Text>
        )}
      </Box>

      {/* Help text */}
      <Box flexDirection="row">
        <Text color="gray" dimColor>
          {!activeHandle
            ? '[←→] or [H/L] to activate • [1/2] quick select'
            : '[←→] or [H/L] adjust • [Tab] switch • [Enter] confirm • [Esc] cancel'}
        </Text>
      </Box>

      {/* Range labels */}
      {showLabels && (
        <Box flexDirection="row" justifyContent="space-between" marginTop={1}>
          <Text color="gray">{min}</Text>
          <Text color="gray">{max}</Text>
        </Box>
      )}
    </Box>
  );
};

export default RangeSlider;
