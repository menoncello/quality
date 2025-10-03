/**
 * Keyboard navigation utilities for dashboard components
 */

import type { DashboardView } from '../types/dashboard';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  context?: DashboardView[];
}

export interface NavigationConfig {
  wrapAround: boolean;
  skipDisabled: boolean;
  pageSize: number;
}

/**
 * Create navigation handler for list navigation
 */
export function createListNavigation(
  itemCount: number,
  onSelect: (index: number) => void,
  config: NavigationConfig = { wrapAround: true, skipDisabled: true, pageSize: 10 }
) {
  return {
    handleKeyDown: (key: string, currentIndex: number): number => {
      let newIndex = currentIndex;

      switch (key) {
        case 'up':
        case 'k':
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case 'down':
        case 'j':
          newIndex = Math.min(itemCount - 1, currentIndex + 1);
          break;
        case 'home':
          newIndex = 0;
          break;
        case 'end':
          newIndex = itemCount - 1;
          break;
        case 'pageup':
          newIndex = Math.max(0, currentIndex - config.pageSize);
          break;
        case 'pagedown':
          newIndex = Math.min(itemCount - 1, currentIndex + config.pageSize);
          break;
        case 'enter':
          onSelect(currentIndex);
          break;
        default:
          return currentIndex;
      }

      // Handle wrap around
      if (config.wrapAround) {
        if (newIndex < 0) newIndex = itemCount - 1;
        if (newIndex >= itemCount) newIndex = 0;
      }

      return newIndex;
    },
  };
}

/**
 * Create navigation handler for menu navigation
 */
export function createMenuNavigation(
  itemCount: number,
  onSelect: (index: number) => void,
  onCancel: () => void
) {
  return {
    handleKeyDown: (
      key: string,
      currentIndex: number
    ): { index: number; action?: 'select' | 'cancel' } => {
      let newIndex = currentIndex;

      switch (key) {
        case 'up':
        case 'k':
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case 'down':
        case 'j':
          newIndex = Math.min(itemCount - 1, currentIndex + 1);
          break;
        case 'home':
          newIndex = 0;
          break;
        case 'end':
          newIndex = itemCount - 1;
          break;
        case 'enter':
        case ' ':
          return { index: currentIndex, action: 'select' };
        case 'escape':
          onCancel();
          return { index: currentIndex, action: 'cancel' };
        default:
          if (key >= '1' && key <= '9') {
            const numericIndex = parseInt(key) - 1;
            if (numericIndex < itemCount) {
              return { index: numericIndex, action: 'select' };
            }
          }
          return { index: currentIndex };
      }

      return { index: newIndex };
    },
  };
}

/**
 * Check if key is a navigation key
 */
export function isNavigationKey(key: string): boolean {
  return [
    'up',
    'down',
    'left',
    'right',
    'home',
    'end',
    'pageup',
    'pagedown',
    'tab',
    'enter',
    'escape',
    'space',
  ].includes(key.toLowerCase());
}

/**
 * Check if key is a number key (1-9)
 */
export function isNumberKey(key: string): boolean {
  return key >= '1' && key <= '9';
}

/**
 * Get key display name
 */
export function getKeyName(key: string): string {
  const keyMap: Record<string, string> = {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
    home: 'Home',
    end: 'End',
    pageup: 'Page Up',
    pagedown: 'Page Down',
    tab: 'Tab',
    enter: 'Enter',
    escape: 'Esc',
    space: 'Space',
  };

  return keyMap[key.toLowerCase()] ?? key.toUpperCase();
}

/**
 * Default keyboard shortcuts for dashboard
 */
export const defaultKeyboardShortcuts: Omit<KeyboardShortcut, 'action'>[] = [
  { key: '↑↓', description: 'Navigate issues', context: ['dashboard', 'issue-list'] },
  {
    key: 'Enter',
    description: 'Select/Expand',
    context: ['dashboard', 'issue-list', 'issue-details'],
  },
  { key: 'Escape', description: 'Go back/Close', context: ['issue-details', 'issue-list'] },
  { key: 'f', description: 'Open filters', context: ['dashboard', 'issue-list'] },
  { key: 'e', description: 'Export options', context: ['dashboard', 'issue-list'] },
  {
    key: 'q',
    description: 'Quit dashboard',
    context: ['dashboard', 'issue-list', 'issue-details'],
  },
  { key: 'Tab', description: 'Navigate sections', context: ['dashboard', 'issue-list'] },
  { key: 'Space', description: 'Toggle filters', context: ['issue-list'] },
  { key: '1-9', description: 'Quick jump', context: ['dashboard', 'issue-list'] },
  { key: 'Home', description: 'First issue', context: ['dashboard', 'issue-list'] },
  { key: 'End', description: 'Last issue', context: ['dashboard', 'issue-list'] },
  { key: 'Page Up/Down', description: 'Navigate page', context: ['dashboard', 'issue-list'] },
];

/**
 * Create keyboard shortcut handler
 */
export function createKeyboardHandler(shortcuts: KeyboardShortcut[], currentView: DashboardView) {
  return (key: string): boolean => {
    const applicableShortcuts = shortcuts.filter(
      shortcut => !shortcut.context || shortcut.context.includes(currentView)
    );

    for (const shortcut of applicableShortcuts) {
      if (shortcut.key.toLowerCase() === key.toLowerCase()) {
        shortcut.action();
        return true;
      }
    }

    return false;
  };
}
