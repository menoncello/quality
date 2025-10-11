/**
 * Base abstract component for all dashboard widgets
 */

import React, { useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import type { WidgetConfig } from '../../types/dashboard';

// Re-export types for widget registry
export type { WidgetConfig } from '../../types/dashboard';

interface BaseWidgetProps {
  config: WidgetConfig;
  isSelected: boolean;
  onSelect: (widgetId: string) => void;
  onUpdate: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  children: React.ReactNode;
}

export function BaseWidget({
  config,
  isSelected,
  onSelect: _onSelect,
  onUpdate,
  children,
}: BaseWidgetProps): React.ReactElement {
  const { id, position, visible } = config;

  // Handle keyboard input for widget management
  useInput((input, key) => {
    if (!isSelected) return;

    switch (input) {
      case 'r': // Resize widget
        if (key.ctrl) {
          handleResize();
        }
        break;
      case 'm': // Move widget
        if (key.ctrl) {
          handleMove();
        }
        break;
      case 'h': // Toggle visibility
        if (key.ctrl) {
          handleToggleVisibility();
        }
        break;
      case '+': // Increase size
        if (key.ctrl) {
          handleIncreaseSize();
        }
        break;
      case '-': // Decrease size
        if (key.ctrl) {
          handleDecreaseSize();
        }
        break;
    }
  });

  const handleResize = useCallback(() => {
    // Cycle through common sizes
    const sizes = [
      { width: 40, height: 10 },
      { width: 60, height: 15 },
      { width: 80, height: 20 },
      { width: 100, height: 25 },
    ];
    
    const currentIndex = sizes.findIndex(
      size => size.width === position.width && size.height === position.height
    );
    const nextIndex = (currentIndex + 1) % sizes.length;
    
    onUpdate(id, {
      position: {
        ...position,
        ...sizes[nextIndex],
      },
    });
  }, [id, position, onUpdate]);

  const handleMove = useCallback(() => {
    // Simple movement pattern: right -> down -> left -> up
    const step = 5;
    let newPosition = { ...position };

    if (position.x < 80) {
      newPosition.x += step;
    } else if (position.y < 20) {
      newPosition.y += step;
      newPosition.x = 0;
    } else {
      newPosition = { x: 0, y: 0, width: position.width, height: position.height };
    }

    onUpdate(id, { position: newPosition });
  }, [id, position, onUpdate]);

  const handleToggleVisibility = useCallback(() => {
    onUpdate(id, { visible: !visible });
  }, [id, visible, onUpdate]);

  const handleIncreaseSize = useCallback(() => {
    onUpdate(id, {
      position: {
        ...position,
        width: Math.min(120, position.width + 10),
        height: Math.min(30, position.height + 5),
      },
    });
  }, [id, position, onUpdate]);

  const handleDecreaseSize = useCallback(() => {
    onUpdate(id, {
      position: {
        ...position,
        width: Math.max(20, position.width - 10),
        height: Math.min(5, position.height - 5),
      },
    });
  }, [id, position, onUpdate]);

  // Render widget only if visible
  if (!visible) {
    return <Box />;
  }

  return (
    <Box
      flexDirection="column"
      borderStyle={isSelected ? 'double' : 'single'}
      borderColor={isSelected ? 'blue' : 'gray'}
      paddingX={position.x > 0 ? 0 : 1}
      paddingY={position.y > 0 ? 0 : 1}
    >
      {/* Widget Header */}
      <Box
        width="100%"
        borderStyle="single"
        borderColor={isSelected ? 'blue' : 'gray'}
        justifyContent="space-between"
        paddingX={1}
      >
        <Text bold color={isSelected ? 'blue' : 'white'}>
          {config.type.toUpperCase()}
        </Text>
        <Text color="gray" dimColor>
          {position.width}×{position.height}
        </Text>
      </Box>

      {/* Widget Content */}
      <Box flexGrow={1} paddingX={1} paddingY={1}>
        {children}
      </Box>

      {/* Widget Footer (when selected) */}
      {isSelected && (
        <Box
          width="100%"
          borderStyle="single"
          borderColor="blue"
          justifyContent="center"
          paddingX={1}
        >
          <Text color="blue" dimColor>
            Ctrl+R:Resize Ctrl+M:Move Ctrl+H:Hide +/-:Size
          </Text>
        </Box>
      )}
    </Box>
  );
}

// Widget factory function type
export type WidgetFactory = (
  config: WidgetConfig,
  isSelected: boolean,
  onSelect: (widgetId: string) => void,
  onUpdate: (widgetId: string, updates: Partial<WidgetConfig>) => void
) => React.ReactElement | null;

// Widget registration interface
export interface WidgetRegistration {
  type: string;
  name: string;
  description: string;
  factory: WidgetFactory;
  defaultConfig: Partial<WidgetConfig>;
  minSize: { width: number; height: number };
  maxSize: { width: number; height: number };
}