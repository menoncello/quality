/**
 * Sort controls component - minimal
 */

import React from 'react';
import { Box, Text } from 'ink';

export function SortControls(): React.ReactElement {
  return (
    <Box marginBottom={1}>
      <Text color="gray" dimColor>
        Issues (sorted by score)
      </Text>
    </Box>
  );
}