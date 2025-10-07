/**
 * Priority Badge Component Tests
 */

import { describe, it, expect } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { PriorityBadge } from '../../../src/components/dashboard/priority-badge';

describe('PriorityBadge', () => {
  it('should display critical priority with score', () => {
    const { lastFrame } = render(<PriorityBadge score={8.5} level="critical" showScore={true} />);

    expect(lastFrame()).toContain('CRITICAL (8.5)');
  });

  it('should display high priority without score', () => {
    const { lastFrame } = render(<PriorityBadge score={6.2} level="high" showScore={false} />);

    expect(lastFrame()).toContain('HIGH');
    expect(lastFrame()).not.toContain('6.2');
  });

  it('should determine priority level from score when level not provided', () => {
    const { lastFrame } = render(<PriorityBadge score={4.1} showScore={true} />);

    expect(lastFrame()).toContain('MEDIUM (4.1)');
  });

  it('should display low priority correctly', () => {
    const { lastFrame } = render(<PriorityBadge score={2.3} showScore={true} />);

    expect(lastFrame()).toContain('LOW (2.3)');
  });

  it('should handle edge case scores', () => {
    const { lastFrame } = render(<PriorityBadge score={8.0} showScore={true} />);

    expect(lastFrame()).toContain('CRITICAL (8.0)');
  });
});
