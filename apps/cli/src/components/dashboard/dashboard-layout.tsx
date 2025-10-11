/**
 * Dashboard Layout component with keyboard-based panel management
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput, type Key } from 'ink';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import { WidgetRegistry } from './widget-registry';
import type { DashboardLayout as DashboardLayoutType, WidgetConfig } from '../../types/dashboard';

interface DashboardLayoutProps {
  layout: DashboardLayoutType;
  onLayoutUpdate: (layout: DashboardLayoutType) => void;
  onExit: () => void;
}

interface LayoutMode {
  mode: 'normal' | 'edit' | 'add-widget' | 'manage-layouts';
  selectedWidgetId: string | null;
  selectedWidgetIndex: number;
}

export function DashboardLayout({ layout, onLayoutUpdate, onExit }: DashboardLayoutProps): React.ReactElement {
  const { setCurrentLayout } = useDashboardStore();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>({
    mode: 'normal',
    selectedWidgetId: null,
    selectedWidgetIndex: 0,
  });

  // Update store when layout changes
  useEffect(() => {
    setCurrentLayout(layout);
  }, [layout, setCurrentLayout]);

  // Handle keyboard input
  useInput((input, key) => {
    switch (layoutMode.mode) {
      case 'normal':
        handleNormalMode(input, key);
        break;
      case 'edit':
        handleEditMode(input, key);
        break;
      case 'add-widget':
        handleAddWidgetMode(input, key);
        break;
      case 'manage-layouts':
        handleManageLayoutsMode(input, key);
        break;
    }
  });

  const handleNormalMode = useCallback((input: string, key: Key) => {
    switch (input) {
      case 'q':
        onExit();
        break;
      case 'e':
        // Enter edit mode
        if (layout.widgets.length > 0) {
          setLayoutMode(prev => ({
            ...prev,
            mode: 'edit',
            selectedWidgetId: layout.widgets[0]?.id ?? null,
            selectedWidgetIndex: 0,
          }));
        }
        break;
      case 'a':
        // Add widget mode
        setLayoutMode(prev => ({ ...prev, mode: 'add-widget' }));
        break;
      case 'l':
        // Manage layouts mode
        setLayoutMode(prev => ({ ...prev, mode: 'manage-layouts' }));
        break;
      case 'r':
        // Reset layout to default
        if (key.ctrl) {
          resetToDefaultLayout();
        }
        break;
    }
  }, [layout.widgets, onExit]);

  const handleEditMode = useCallback((input: string, key: Key) => {
    const { selectedWidgetIndex } = layoutMode;
    const widgets = layout.widgets;

    switch (input) {
      case 'escape':
        // Exit edit mode
        setLayoutMode(prev => ({ ...prev, mode: 'normal', selectedWidgetId: null }));
        break;
      case 'arrowleft':
        // Select previous widget
        if (selectedWidgetIndex > 0) {
          const newIndex = selectedWidgetIndex - 1;
          setLayoutMode(prev => ({
            ...prev,
            selectedWidgetIndex: newIndex,
            selectedWidgetId: widgets[newIndex]?.id ?? null,
          }));
        }
        break;
      case 'arrowright':
        // Select next widget
        if (selectedWidgetIndex < widgets.length - 1) {
          const newIndex = selectedWidgetIndex + 1;
          setLayoutMode(prev => ({
            ...prev,
            selectedWidgetIndex: newIndex,
            selectedWidgetId: widgets[newIndex]?.id ?? null,
          }));
        }
        break;
      case 'd':
        // Delete selected widget
        if (key.ctrl && layoutMode.selectedWidgetId) {
          deleteWidget(layoutMode.selectedWidgetId);
        }
        break;
      case 'h':
        // Toggle widget visibility
        if (key.ctrl && layoutMode.selectedWidgetId) {
          toggleWidgetVisibility(layoutMode.selectedWidgetId);
        }
        break;
    }
  }, [layoutMode, layout.widgets]);

  const handleAddWidgetMode = useCallback((input: string, _key: Key) => {
    const availableTypes = WidgetRegistry.getAvailableWidgetTypes();

    switch (input) {
      case 'escape':
        setLayoutMode(prev => ({ ...prev, mode: 'normal' }));
        break;
      default: {
        // Number keys to select widget type
        const widgetIndex = parseInt(input, 10);
        if (widgetIndex >= 1 && widgetIndex <= availableTypes.length) {
          const widgetType = availableTypes[widgetIndex - 1];
          if (widgetType) {
            addWidget(widgetType.type);
          }
        }
        break;
      }
    }
  }, []);

  const handleManageLayoutsMode = useCallback((input: string, key: Key) => {
    switch (input) {
      case 'escape':
        setLayoutMode(prev => ({ ...prev, mode: 'normal' }));
        break;
      case 's':
        // Save current layout
        if (key.ctrl) {
          saveLayout();
        }
        break;
      case 'i':
        // Import layout
        if (key.ctrl) {
          importLayout();
        }
        break;
      case 'x':
        // Export layout
        if (key.ctrl) {
          exportLayout();
        }
        break;
    }
  }, []);

  const deleteWidget = useCallback((widgetId: string) => {
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date(),
    };
    onLayoutUpdate(updatedLayout);
    
    // Update selection
    const remainingWidgets = updatedLayout.widgets;
    if (remainingWidgets.length === 0) {
      setLayoutMode(prev => ({ ...prev, mode: 'normal', selectedWidgetId: null }));
    } else {
      const newSelectedIndex = Math.min(layoutMode.selectedWidgetIndex, remainingWidgets.length - 1);
      setLayoutMode(prev => ({
        ...prev,
        selectedWidgetIndex: newSelectedIndex,
        selectedWidgetId: remainingWidgets[newSelectedIndex]?.id ?? null,
      }));
    }
  }, [layout, layoutMode.selectedWidgetIndex, onLayoutUpdate]);

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
      ),
      updatedAt: new Date(),
    };
    onLayoutUpdate(updatedLayout);
  }, [layout, onLayoutUpdate]);

  const addWidget = useCallback((widgetType: string) => {
    const newWidget = WidgetRegistry.getDefaultConfig(widgetType);
    if (!newWidget) return;

    // Position new widget to avoid overlap
    const existingPositions = layout.widgets.map(w => w.position);
    const newPosition = { ...newWidget.position };
    
    // Simple positioning algorithm: place to the right of existing widgets
    if (existingPositions.length > 0) {
      const rightmostWidget = existingPositions.reduce((rightmost, current) => 
        current.x > rightmost.x ? current : rightmost
      );
      newPosition.x = rightmostWidget.x + rightmostWidget.width + 2;
      
      // Wrap to next line if too far right
      if (newPosition.x > 100) {
        newPosition.x = 0;
        const bottomWidget = existingPositions.reduce((bottom, current) =>
          current.y > bottom.y ? current : bottom
        );
        newPosition.y = bottomWidget.y + bottomWidget.height + 2;
      }
    }

    const updatedWidget = { ...newWidget, position: newPosition };
    const updatedLayout = {
      ...layout,
      widgets: [...layout.widgets, updatedWidget],
      updatedAt: new Date(),
    };
    onLayoutUpdate(updatedLayout);
    setLayoutMode(prev => ({ ...prev, mode: 'normal' }));
  }, [layout, onLayoutUpdate]);

  const resetToDefaultLayout = useCallback(() => {
    const defaultLayout = createDefaultLayout();
    onLayoutUpdate(defaultLayout);
    setLayoutMode(prev => ({ ...prev, mode: 'normal' }));
  }, [onLayoutUpdate]);

  const saveLayout = useCallback(() => {
    // This would integrate with SQLite persistence
    // TODO: Implement SQLite persistence
    setLayoutMode(prev => ({ ...prev, mode: 'normal' }));
  }, []);

  const importLayout = useCallback(() => {
    // This would handle layout import from JSON
    // TODO: Implement JSON import functionality
    setLayoutMode(prev => ({ ...prev, mode: 'normal' }));
  }, []);

  const exportLayout = useCallback(() => {
    // This would handle layout export to JSON
    // TODO: Implement JSON export functionality
    setLayoutMode(prev => ({ ...prev, mode: 'normal' }));
  }, [layout]);

  const handleWidgetUpdate = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    const updatedLayout = {
      ...layout,
      widgets: layout.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      ),
      updatedAt: new Date(),
    };
    onLayoutUpdate(updatedLayout);
  }, [layout, onLayoutUpdate]);

  const renderModeSpecificContent = () => {
    switch (layoutMode.mode) {
      case 'add-widget':
        return renderAddWidgetMenu();
      case 'manage-layouts':
        return renderManageLayoutsMenu();
      default:
        return null;
    }
  };

  const renderAddWidgetMenu = () => {
    const availableTypes = WidgetRegistry.getAvailableWidgetTypes();
    
    return (
      <Box
        borderStyle="double"
        borderColor="cyan"
        flexDirection="column"
        paddingX={1}
        marginX={10}
        marginTop={5}
        marginBottom={5}
      >
        <Box marginBottom={1}>
          <Text bold color="cyan">Add Widget</Text>
        </Box>
        <Text color="gray">Select widget type to add:</Text>
        <Box marginTop={1}>
          {availableTypes.map((type, index) => (
            <Box key={type.type}>
              <Text color="yellow">{index + 1}.</Text>
              <Text> {type.name} - {type.description}</Text>
            </Box>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text color="gray" dimColor>Press 1-{availableTypes.length} to select, Escape to cancel</Text>
        </Box>
      </Box>
    );
  };

  const renderManageLayoutsMenu = () => {
    return (
      <Box
        borderStyle="double"
        borderColor="magenta"
        flexDirection="column"
        paddingX={1}
        marginX={10}
        marginTop={5}
        marginBottom={5}
      >
        <Box marginBottom={1}>
          <Text bold color="magenta">Manage Layouts</Text>
        </Box>
        <Text>Ctrl+S: Save current layout</Text>
        <Text>Ctrl+I: Import layout from JSON</Text>
        <Text>Ctrl+X: Export layout to JSON</Text>
        <Box marginTop={1}>
          <Text color="gray" dimColor>Escape to cancel</Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <Box marginBottom={1}>
        <Box justifyContent="space-between" width="100%">
          <Text bold color="blue">
            Layout: {layout.name} ({layoutMode.mode})
          </Text>
          <Text color="gray">
            Widgets: {layout.widgets.length} | Mode: {layoutMode.mode}
          </Text>
        </Box>
      </Box>

      {/* Widget Area */}
      <Box flexGrow={1} flexDirection="column">
        {layout.widgets.map((widget, _index) => {
          const widgetElement = WidgetRegistry.createWidget(
            widget,
            widget.id === layoutMode.selectedWidgetId,
            (widgetId: string) => {
              setLayoutMode(prev => ({
                ...prev,
                selectedWidgetId: widgetId,
                selectedWidgetIndex: layout.widgets.findIndex(w => w.id === widgetId),
              }));
            },
            handleWidgetUpdate
          );
          return widgetElement;
        })}
      </Box>

      {/* Mode-specific overlays */}
      {renderModeSpecificContent()}

      {/* Footer */}
      <Box marginTop={1}>
        <Box justifyContent="space-between" width="100%">
          <Text color="gray" dimColor>
            {layoutMode.mode === 'normal' && 'E:Edit A:Add L:Manage Ctrl+R:Reset Q:Quit'}
            {layoutMode.mode === 'edit' && '←→:Select Ctrl+D:Delete Ctrl+H:Hide Esc:Exit'}
            {layoutMode.mode === 'add-widget' && '1-9:Select Widget Esc:Cancel'}
            {layoutMode.mode === 'manage-layouts' && 'Ctrl+S:Save Ctrl+I:Import Ctrl+X:Export Esc:Cancel'}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

// Helper function to create default layout
function createDefaultLayout(): DashboardLayoutType {
  const summaryWidget = WidgetRegistry.getDefaultConfig('summary', {
    id: 'summary-default',
    position: { x: 0, y: 0, width: 50, height: 12 },
  });
  
  const issuesWidget = WidgetRegistry.getDefaultConfig('issues', {
    id: 'issues-default',
    position: { x: 55, y: 0, width: 45, height: 15 },
  });
  
  const coverageWidget = WidgetRegistry.getDefaultConfig('coverage', {
    id: 'coverage-default',
    position: { x: 0, y: 14, width: 45, height: 10 },
  });
  
  const trendsWidget = WidgetRegistry.getDefaultConfig('trends', {
    id: 'trends-default',
    position: { x: 50, y: 17, width: 50, height: 10 },
  });

  return {
    id: 'default-layout',
    name: 'Default Layout',
    description: 'Default dashboard layout with all widgets',
    isPreset: true,
    widgets: [summaryWidget, issuesWidget, coverageWidget, trendsWidget].filter(Boolean) as WidgetConfig[],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}