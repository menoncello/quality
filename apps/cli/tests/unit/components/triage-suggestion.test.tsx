/**
 * Triage Suggestion Component Tests
 */

import { describe, it, expect, jest } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { TriageSuggestion } from '../../../src/components/dashboard/triage-suggestion';

describe('TriageSuggestion', () => {
  const mockSuggestion = {
    action: 'fix-now' as const,
    priority: 9,
    estimatedEffort: 4,
    assignee: 'john.doe@example.com',
    deadline: new Date('2025-01-15'),
    reasoning: 'Critical security vulnerability detected in authentication module',
    confidence: 0.95,
  };

  it('should display triage suggestion details', () => {
    const { lastFrame } = render(<TriageSuggestion suggestion={mockSuggestion} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI color codes
    expect(output).toContain('FIX-NOW');
    expect(output).toContain('Priority: 9/10');
    expect(output).toContain(
      'Reasoning: Critical security vulnerability detected in authentication module'
    );
    expect(output).toContain('Effort: 4h');
    expect(output).toContain('Confidence: 95%');
    expect(output).toContain('Assignee: john.doe@example.com');
    expect(output).toContain('Deadline: 1/15/2025');
  });

  it('should display suggestion without optional fields', () => {
    const minimalSuggestion = {
      action: 'schedule' as const,
      priority: 5,
      estimatedEffort: 2,
      reasoning: 'Minor performance improvement needed',
      confidence: 0.7,
    };

    const { lastFrame } = render(<TriageSuggestion suggestion={minimalSuggestion} />);

    const output = lastFrame().replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI color codes
    expect(output).toContain('SCHEDULE');
    expect(output).toContain('Priority: 5/10');
    expect(output).toContain('Effort: 2h');
    expect(output).toContain('Confidence: 70%'); // Use stripped output
    expect(output).not.toContain('Assignee:');
    expect(output).not.toContain('Deadline:');
  });

  it('should display interactive mode with actions', () => {
    const { lastFrame } = render(
      <TriageSuggestion
        suggestion={mockSuggestion}
        interactive={true}
        onAccept={jest.fn()}
        onReject={jest.fn()}
      />
    );

    expect(lastFrame()).toContain('[ACCEPT]');
    expect(lastFrame()).toContain('[REJECT]');
    expect(lastFrame()).toContain('(Use arrow keys and Enter to select)');
  });

  it('should not show interactive controls when not interactive', () => {
    const { lastFrame } = render(
      <TriageSuggestion suggestion={mockSuggestion} interactive={false} />
    );

    expect(lastFrame()).not.toContain('[ACCEPT]');
    expect(lastFrame()).not.toContain('[REJECT]');
    expect(lastFrame()).not.toContain('(Use arrow keys and Enter to select)');
  });

  it('should handle different action types', () => {
    const monitorSuggestion = {
      ...mockSuggestion,
      action: 'monitor' as const,
    };

    const { lastFrame } = render(<TriageSuggestion suggestion={monitorSuggestion} />);

    expect(lastFrame()).toContain('MONITOR');
  });
});
