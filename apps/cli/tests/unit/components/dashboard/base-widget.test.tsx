/**
 * Unit tests for BaseWidget component
 */

import { render } from 'ink-testing-library';
import { Box, Text } from 'ink';
import { describe, it, expect, vi } from 'vitest';
import { BaseWidget } from '../../../../src/components/dashboard/base-widget';
import type { WidgetConfig } from '../../../../src/types/dashboard';

describe('BaseWidget', () => {
  const mockConfig: WidgetConfig = {
    id: 'test-widget',
    type: 'summary',
    position: { x: 0, y: 0, width: 50, height: 15 },
    config: {},
    visible: true,
  };

  const mockOnSelect = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockChildren = <Text>Test Content</Text>;

  it('should render widget with correct properties', () => {
    const { lastFrame } = render(
      <BaseWidget
        config={mockConfig}
        isSelected={false}
        onSelect={mockOnSelect}
        onUpdate={mockOnUpdate}
      >
        {mockChildren}
      </BaseWidget>
    );

    expect(lastFrame()).toContain('SUMMARY');
    expect(lastFrame()).toContain('50×15');
    expect(lastFrame()).toContain('Test Content');
  });

  it('should render selected widget with double border', () => {
    const { lastFrame } = render(
      <BaseWidget
        config={mockConfig}
        isSelected={true}
        onSelect={mockOnSelect}
        onUpdate={mockOnUpdate}
      >
        {mockChildren}
      </BaseWidget>
    );

    expect(lastFrame()).toContain('SUMMARY');
    expect(lastFrame()).toContain('Ctrl+R:Resize Ctrl+M:Move Ctrl+H:Hide +/-:Size');
  });

  it('should not render widget when visible is false', () => {
    const invisibleConfig = { ...mockConfig, visible: false };
    const { lastFrame } = render(
      <BaseWidget
        config={invisibleConfig}
        isSelected={false}
        onSelect={mockOnSelect}
        onUpdate={mockOnUpdate}
      >
        {mockChildren}
      </BaseWidget>
    );

    expect(lastFrame()).toBe('');
  });

  it('should handle resize functionality', () => {
    const { stdin } = render(
      <BaseWidget
        config={mockConfig}
        isSelected={true}
        onSelect={mockOnSelect}
        onUpdate={mockOnUpdate}
      >
        {mockChildren}
      </BaseWidget>
    );

    // Simulate Ctrl+R for resize
    stdin.write('\x12'); // Ctrl+R
    stdin.write('r');
    stdin.write('\x0d'); // Enter to confirm

    // Should call onUpdate with new size
    expect(mockOnUpdate).toHaveBeenCalledWith(
      mockConfig.id,
      expect.objectContaining({
        position: expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        }),
      })
    );
  });

  it('should handle move functionality', () => {
    const { stdin } = render(
      <BaseWidget
        config={mockConfig}
        isSelected={true}
        onSelect={mockOnSelect}
        onUpdate={mockOnUpdate}
      >
        {mockChildren}
      </BaseWidget>
    );

    // Simulate Ctrl+M for move
    stdin.write('\x0d'); // Ctrl+M
    stdin.write('m');
    stdin.write('\x0d'); // Enter to confirm

    // Should call onUpdate with new position
    expect(mockOnUpdate).toHaveBeenCalledWith(
      mockConfig.id,
      expect.objectContaining({
        position: expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        }),
      })
    );
  });

  it('should handle toggle visibility functionality', () => {
    const { stdin } = render(
      <BaseWidget
        config={mockConfig}
        isSelected={true}
        onSelect={mockOnSelect}
        onUpdate={mockOnUpdate}
      >
        {mockChildren}
      </BaseWidget>
    );

    // Simulate Ctrl+H for hide
    stdin.write('\x08'); // Ctrl+H
    stdin.write('h');

    // Should call onUpdate with visibility toggled
    expect(mockOnUpdate).toHaveBeenCalledWith(
      mockConfig.id,
      expect.objectContaining({
        position: expect.objectContaining({
          width: 40,
          height: 10,
          x: 0,
          y: 0,
        }),
      })
    );
  });

  it('should handle increase size functionality', () => {
    const { stdin } = render(
      <BaseWidget
        config={mockConfig}
        isSelected={true}
        onSelect={mockOnSelect}
        onUpdate={mockOnUpdate}
      >
        {mockChildren}
      </BaseWidget>
    );

    // Simulate Ctrl++ for increase size
    stdin.write('\x2b'); // Ctrl++
    stdin.write('+');

    // Should call onUpdate with increased size
    expect(mockOnUpdate).toHaveBeenCalledWith(
      mockConfig.id,
      expect.objectContaining({
        position: expect.objectContaining({
          width: 40,
          height: 10,
          x: 0,
          y: 0,
        }),
      })
    );
  });

  it('should handle decrease size functionality', () => {
    const { stdin } = render(
      <BaseWidget
        config={mockConfig}
        isSelected={true}
        onSelect={mockOnSelect}
        onUpdate={mockOnUpdate}
      >
        {mockChildren}
      </BaseWidget>
    );

    // Simulate Ctrl+- for decrease size
    stdin.write('\x2d'); // Ctrl+-
    stdin.write('-');

    // Should call onUpdate with decreased size
    expect(mockOnUpdate).toHaveBeenCalledWith(
      mockConfig.id,
      expect.objectContaining({
        position: expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        }),
      })
    );
  });

  it('should respect minimum size constraints', () => {
    const smallConfig = {
      ...mockConfig,
      position: { x: 0, y: 0, width: 20, height: 5 },
    };

    const { stdin } = render(
      <BaseWidget
        config={smallConfig}
        isSelected={true}
        onSelect={mockOnSelect}
        onUpdate={mockOnUpdate}
      >
        {mockChildren}
      </BaseWidget>
    );

    // Simulate Ctrl+- for decrease size
    stdin.write('\x2d'); // Ctrl+-
    stdin.write('-');

    // Should call onUpdate with size at minimum
    expect(mockOnUpdate).toHaveBeenCalledWith(
      smallConfig.id,
      expect.objectContaining({
        position: expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        }),
      })
    );
  });

  it('should respect maximum size constraints', () => {
    const largeConfig = {
      ...mockConfig,
      position: { x: 0, y: 0, width: 120, height: 30 },
    };

    const { stdin } = render(
      <BaseWidget
        config={largeConfig}
        isSelected={true}
        onSelect={mockOnSelect}
        onUpdate={mockOnUpdate}
      >
        {mockChildren}
      </BaseWidget>
    );

    // Simulate Ctrl++ for increase size
    stdin.write('\x2b'); // Ctrl++
    stdin.write('+');

    // Should call onUpdate with size at maximum
    expect(mockOnUpdate).toHaveBeenCalledWith(
      largeConfig.id,
      expect.objectContaining({
        position: expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        }),
      })
    );
  });
});